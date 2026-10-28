"""
Telegram-бот для менеджеров: уведомления о новых сообщениях с сайта и ответы клиентам прямо из Telegram.

Два режима:
  1) Вебхук от Telegram (POST с полем update_id в теле) — привязка сотрудника по /start КОД и ответы реплаем.
  2) Действия из админки (заголовок X-Action + X-Staff-Token):
     status     — GET: настроен ли бот, привязан ли текущий сотрудник, число подписчиков
     connect    — POST {url}: только владелец; регистрирует вебхук у Telegram
     link-code  — POST: одноразовая ссылка для привязки Telegram к сотруднику
     unlink     — POST: отвязать Telegram текущего сотрудника
"""
import hashlib
import json
import os
import secrets
import urllib.request
import psycopg2

SCHEMA = "t_p21475602_quantum_innovation_l"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Action, X-Staff-Token",
}
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")


def ok(body, status=200):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False)}


def err(msg, status=400):
    return {"statusCode": status, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def tg(method: str, payload: dict | None = None):
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{TOKEN}/{method}",
        data=json.dumps(payload or {}).encode(), headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=8) as r:
        return json.loads(r.read())


def webhook_secret() -> str:
    return hashlib.sha256(("wh:" + TOKEN).encode()).hexdigest()[:48]


def send(chat_id, text, reply_to=None):
    p = {"chat_id": chat_id, "text": text}
    if reply_to:
        p["reply_to_message_id"] = reply_to
    return tg("sendMessage", p)


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


def handle_update(cur, conn, update: dict):
    msg = update.get("message") or {}
    chat_id = (msg.get("chat") or {}).get("id")
    text = (msg.get("text") or "").strip()
    if not chat_id or not text:
        return

    if text.startswith("/start"):
        parts = text.split(maxsplit=1)
        code = parts[1].strip() if len(parts) > 1 else ""
        cur.execute(f"""
            SELECT staff_id FROM {SCHEMA}.tg_link_codes WHERE code=%s AND expires_at > NOW()
        """, (code,))
        row = cur.fetchone()
        if not row:
            send(chat_id, "Чтобы подключить уведомления, откройте админку сайта → Настройки → Telegram и нажмите «Подключить».")
            return
        cur.execute(f"""
            INSERT INTO {SCHEMA}.tg_subscribers (chat_id, staff_id, tg_username) VALUES (%s,%s,%s)
            ON CONFLICT (chat_id) DO UPDATE SET staff_id=EXCLUDED.staff_id, tg_username=EXCLUDED.tg_username
        """, (chat_id, row[0], (msg.get("from") or {}).get("username")))
        cur.execute(f"UPDATE {SCHEMA}.tg_link_codes SET expires_at = NOW() WHERE code=%s", (code,))
        conn.commit()
        send(chat_id, "Готово! Теперь сюда приходят новые сообщения с сайта. Чтобы ответить клиенту, ответьте реплаем на нужное уведомление.")
        return

    cur.execute(f"SELECT staff_id FROM {SCHEMA}.tg_subscribers WHERE chat_id=%s", (chat_id,))
    sub = cur.fetchone()
    if not sub:
        send(chat_id, "Вы не подключены. Откройте админку → Настройки → Telegram и нажмите «Подключить».")
        return

    if text == "/stop":
        cur.execute(f"DELETE FROM {SCHEMA}.tg_subscribers WHERE chat_id=%s", (chat_id,))
        conn.commit()
        send(chat_id, "Уведомления отключены.")
        return

    reply = msg.get("reply_to_message")
    if not reply:
        send(chat_id, "Чтобы ответить клиенту, ответьте реплаем (Reply) на сообщение-уведомление.")
        return

    cur.execute(f"""
        SELECT client_id, guest_id FROM {SCHEMA}.tg_message_map WHERE chat_id=%s AND tg_message_id=%s
    """, (chat_id, reply.get("message_id")))
    target = cur.fetchone()
    if not target:
        send(chat_id, "Не нашёл, кому отвечать. Ответьте реплаем на свежее уведомление о сообщении.", msg.get("message_id"))
        return
    client_id, guest_id = target

    if client_id:
        cur.execute(f"""
            INSERT INTO {SCHEMA}.messages (client_id, sender_type, staff_id, body, kind)
            VALUES (%s, 'staff', %s, %s, 'text')
        """, (client_id, sub[0], text))
        cur.execute(f"""
            SELECT name FROM {SCHEMA}.staff_users WHERE id=%s
        """, (sub[0],))
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
    send(chat_id, "✓ Отправлено клиенту на сайте", msg.get("message_id"))


def handler(event: dict, context) -> dict:
    """Telegram-бот: вебхук, привязка сотрудников, настройка из админки."""
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
        if "update_id" in body:
            if not TOKEN or headers.get("x-telegram-bot-api-secret-token") != webhook_secret():
                return err("Forbidden", 403)
            handle_update(cur, conn, body)
            return ok({"ok": True})

        staff = get_staff(cur, headers.get("x-staff-token", ""))
        if not staff:
            return err("Unauthorized", 401)

        if action == "status":
            if not TOKEN:
                return ok({"configured": False, "linked": False, "subscribers": 0})
            me = tg("getMe").get("result", {})
            info = tg("getWebhookInfo").get("result", {})
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tg_subscribers")
            total = cur.fetchone()[0]
            cur.execute(f"SELECT tg_username FROM {SCHEMA}.tg_subscribers WHERE staff_id=%s", (staff["id"],))
            mine = cur.fetchone()
            return ok({
                "configured": True, "bot_username": me.get("username"), "webhook": bool(info.get("url")),
                "linked": bool(mine), "tg_username": mine[0] if mine else None, "subscribers": total,
            })

        if not TOKEN:
            return err("Токен бота не добавлен")

        if action == "connect":
            if not staff["is_owner"] and staff["role"] not in ("owner", "super_admin"):
                return err("Только владелец", 403)
            url = body.get("url")
            if not url:
                return err("url required")
            r = tg("setWebhook", {"url": url, "secret_token": webhook_secret(), "allowed_updates": ["message"]})
            return ok({"ok": bool(r.get("ok")), "description": r.get("description")})

        if action == "link-code":
            me = tg("getMe").get("result", {})
            code = secrets.token_urlsafe(9).replace("-", "a").replace("_", "b")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.tg_link_codes (code, staff_id, expires_at) VALUES (%s,%s, NOW() + INTERVAL '15 minutes')
            """, (code, staff["id"]))
            conn.commit()
            return ok({"url": f"https://t.me/{me.get('username')}?start={code}"})

        if action == "unlink":
            cur.execute(f"DELETE FROM {SCHEMA}.tg_subscribers WHERE staff_id=%s", (staff["id"],))
            conn.commit()
            return ok({"ok": True})

        return err("Unknown action", 404)
    finally:
        cur.close()
        conn.close()
