"""
Max-бот для менеджеров: уведомления о новых сообщениях с сайта и ответы клиентам прямо из Max.

Два режима:
  1) Вебхук от Max (POST с полем update_type) — привязка сотрудника по старту бота с кодом и ответы реплаем.
  2) Действия из админки (заголовок X-Action + X-Staff-Token):
     status     — GET: настроен ли бот, привязан ли текущий сотрудник, список подписчиков
     save-token — POST {url, token?}: только владелец; регистрирует вебхук в Max
     disconnect-bot — POST: только владелец; отключает бота
     link-code  — POST: одноразовая ссылка для привязки Max к сотруднику
     unlink     — POST: отвязать Max текущего сотрудника
"""
import hashlib
import json
import os
import secrets
import urllib.request
import psycopg2

SCHEMA = "t_p21475602_quantum_innovation_l"
API = "https://platform-api.max.ru"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Action, X-Staff-Token",
}


def ok(body, status=200):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False)}


def err(msg, status=400):
    return {"statusCode": status, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def load_token(cur) -> str:
    cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key='max_bot_token'")
    row = cur.fetchone()
    return (row[0] if row else "") or os.environ.get("MAX_BOT_TOKEN", "")


def mx(token: str, method: str, path: str, payload: dict | None = None):
    req = urllib.request.Request(
        API + path, method=method,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"Content-Type": "application/json", "Authorization": token},
    )
    with urllib.request.urlopen(req, timeout=6) as r:
        raw = r.read()
        return json.loads(raw) if raw else {}


def webhook_secret(token: str) -> str:
    return hashlib.sha256(("wh:" + token).encode()).hexdigest()[:48]


def send(token, user_id, text, reply_mid=None):
    p = {"text": text[:4000]}
    if reply_mid:
        p["link"] = {"type": "reply", "mid": reply_mid}
    try:
        return mx(token, "POST", f"/messages?user_id={user_id}", p)
    except Exception:
        return {}


def get_staff(cur, token):
    if not token:
        return None
    cur.execute(f"""
        SELECT s.id, s.name, s.is_owner, COALESCE(ss.preview_role, s.role)
        FROM {SCHEMA}.staff_sessions ss JOIN {SCHEMA}.staff_users s ON s.id = ss.staff_id
        WHERE ss.token=%s AND ss.expires_at > NOW() AND s.active=TRUE
    """, (token,))
    r = cur.fetchone()
    return {"id": r[0], "name": r[1], "is_owner": r[2], "role": r[3]} if r else None


def link_subscriber(cur, conn, token, user_id, username, code):
    cur.execute(f"""
        SELECT staff_id FROM {SCHEMA}.max_link_codes WHERE code=%s AND expires_at > NOW()
    """, (code,))
    row = cur.fetchone()
    if not row:
        send(token, user_id, "Чтобы подключить уведомления, откройте админку сайта → Настройки → Max и нажмите «Подключить».")
        return
    cur.execute(f"""
        INSERT INTO {SCHEMA}.max_subscribers (user_id, staff_id, username) VALUES (%s,%s,%s)
        ON CONFLICT (user_id) DO UPDATE SET staff_id=EXCLUDED.staff_id, username=EXCLUDED.username
    """, (user_id, row[0], username))
    cur.execute(f"UPDATE {SCHEMA}.max_link_codes SET expires_at = NOW() WHERE code=%s", (code,))
    conn.commit()
    send(token, user_id, "Готово! Теперь сюда приходят новые сообщения с сайта. Чтобы ответить клиенту, ответьте реплаем на нужное уведомление.")


def handle_update(cur, conn, update: dict, token: str):
    kind = update.get("update_type")

    if kind == "bot_started":
        user = update.get("user") or {}
        if user.get("user_id"):
            link_subscriber(cur, conn, token, user["user_id"], user.get("username"), (update.get("payload") or "").strip())
        return

    if kind != "message_created":
        return

    msg = update.get("message") or {}
    sender = msg.get("sender") or {}
    user_id = sender.get("user_id")
    body = msg.get("body") or {}
    text = (body.get("text") or "").strip()
    mid = body.get("mid")
    if not user_id or not text or sender.get("is_bot"):
        return

    if text.startswith("/start"):
        parts = text.split(maxsplit=1)
        link_subscriber(cur, conn, token, user_id, sender.get("username"), parts[1].strip() if len(parts) > 1 else "")
        return

    cur.execute(f"SELECT staff_id FROM {SCHEMA}.max_subscribers WHERE user_id=%s", (user_id,))
    sub = cur.fetchone()
    if not sub:
        send(token, user_id, "Вы не подключены. Откройте админку → Настройки → Max и нажмите «Подключить».")
        return

    if text == "/stop":
        cur.execute(f"DELETE FROM {SCHEMA}.max_subscribers WHERE user_id=%s", (user_id,))
        conn.commit()
        send(token, user_id, "Уведомления отключены.")
        return

    link = msg.get("link") or {}
    replied_mid = (link.get("message") or {}).get("mid") if link.get("type") == "reply" else None
    if not replied_mid:
        send(token, user_id, "Чтобы ответить клиенту, ответьте реплаем (Ответить) на сообщение-уведомление.", mid)
        return

    cur.execute(f"SELECT client_id, guest_id FROM {SCHEMA}.max_message_map WHERE mid=%s", (replied_mid,))
    target = cur.fetchone()
    if not target:
        send(token, user_id, "Не нашёл, кому отвечать. Ответьте реплаем на свежее уведомление о сообщении.", mid)
        return
    client_id, guest_id = target

    if client_id:
        cur.execute(f"""
            INSERT INTO {SCHEMA}.messages (client_id, sender_type, staff_id, body, kind)
            VALUES (%s, 'staff', %s, %s, 'text')
        """, (client_id, sub[0], text))
        cur.execute(f"SELECT name FROM {SCHEMA}.staff_users WHERE id=%s", (sub[0],))
        sname = cur.fetchone()[0]
        cur.execute(f"""
            INSERT INTO {SCHEMA}.client_notifications (client_id, type, title, body)
            VALUES (%s, 'message', %s, %s)
        """, (client_id, f"Новое сообщение от {sname}", text[:200]))
    else:
        cur.execute(f"""
            INSERT INTO {SCHEMA}.guest_messages (guest_id, sender_type, staff_id, body)
            VALUES (%s, 'staff', %s, %s)
        """, (guest_id, sub[0], text))
    conn.commit()
    send(token, user_id, "✓ Отправлено клиенту на сайте", mid)


def handler(event: dict, context) -> dict:
    """Max-бот: вебхук, привязка сотрудников, настройка из админки."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    action = headers.get("x-action", "")
    raw = event.get("body") or ""
    if event.get("isBase64Encoded") and raw:
        import base64
        raw = base64.b64decode(raw).decode()
    body = json.loads(raw) if raw.strip().startswith("{") else {}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    try:
        token = load_token(cur)

        if "update_type" in body:
            if not token or headers.get("x-max-bot-api-secret") != webhook_secret(token):
                return err("Forbidden", 403)
            handle_update(cur, conn, body, token)
            return ok({"ok": True})

        staff = get_staff(cur, headers.get("x-staff-token", ""))
        if not staff:
            return err("Unauthorized", 401)
        can_manage = staff["is_owner"] or staff["role"] in ("owner", "super_admin")

        if action == "status":
            if not token:
                return ok({"configured": False, "linked": False, "subscribers": [], "can_manage": can_manage})
            bot_name, webhook = None, False
            try:
                me = mx(token, "GET", "/me")
                bot_name = me.get("username") or me.get("name")
                subs_info = mx(token, "GET", "/subscriptions")
                webhook = bool(subs_info.get("subscriptions"))
            except Exception:
                pass
            cur.execute(f"""
                SELECT s.id, s.name, t.username FROM {SCHEMA}.max_subscribers t
                JOIN {SCHEMA}.staff_users s ON s.id = t.staff_id ORDER BY t.created_at
            """)
            subs = [{"staff_id": r[0], "name": r[1], "tg_username": r[2]} for r in cur.fetchall()]
            mine = next((x for x in subs if x["staff_id"] == staff["id"]), None)
            return ok({
                "configured": True, "bot_username": bot_name, "webhook": webhook,
                "linked": bool(mine), "tg_username": mine["tg_username"] if mine else None,
                "subscribers": subs, "can_manage": can_manage,
            })

        if action == "save-token":
            if not can_manage:
                return err("Только владелец", 403)
            given = (body.get("token") or "").strip()
            new_token = given or token
            url = body.get("url")
            if not new_token or not url:
                return err("Вставьте токен бота")
            try:
                me = mx(new_token, "GET", "/me")
            except Exception:
                return err("Max не принял токен. Проверьте, что скопировали его целиком.")
            if not me.get("user_id"):
                return err("Max не принял токен. Проверьте, что скопировали его целиком.")
            try:
                r = mx(new_token, "POST", "/subscriptions", {
                    "url": url, "update_types": ["message_created", "bot_started"], "secret": webhook_secret(new_token),
                })
            except Exception:
                return err("Не удалось подключить бота к сайту")
            if r.get("success") is False:
                return err(r.get("message") or "Не удалось подключить бота")
            if given:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.site_settings (key, value) VALUES ('max_bot_token', %s)
                    ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()
                """, (given,))
                conn.commit()
            return ok({"ok": True, "bot_username": me.get("username") or me.get("name")})

        if action == "disconnect-bot":
            if not can_manage:
                return err("Только владелец", 403)
            if token:
                try:
                    mx(token, "DELETE", "/subscriptions?url=" + urllib.request.quote(body.get("url") or "", safe=""))
                except Exception:
                    pass
            cur.execute(f"DELETE FROM {SCHEMA}.site_settings WHERE key='max_bot_token'")
            cur.execute(f"DELETE FROM {SCHEMA}.max_subscribers")
            conn.commit()
            return ok({"ok": True})

        if not token:
            return err("Бот не подключён")

        if action == "link-code":
            try:
                me = mx(token, "GET", "/me")
            except Exception:
                return err("Max сейчас не отвечает, попробуйте ещё раз")
            code = secrets.token_urlsafe(9).replace("-", "a").replace("_", "b")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.max_link_codes (code, staff_id, expires_at) VALUES (%s,%s, NOW() + INTERVAL '15 minutes')
            """, (code, staff["id"]))
            conn.commit()
            return ok({"url": f"https://max.ru/{me.get('username')}?start={code}"})

        if action == "unlink":
            cur.execute(f"DELETE FROM {SCHEMA}.max_subscribers WHERE staff_id=%s", (staff["id"],))
            conn.commit()
            return ok({"ok": True})

        return err("Unknown action", 404)
    finally:
        cur.close()
        conn.close()
