"""
Чат между посетителями сайта (клиент или гость) и сотрудниками (менеджер/поддержка).
Роутинг через заголовок X-Action. Авторизация — X-Client-Token (клиент), X-Guest-Token (гость) либо X-Staff-Token (сотрудник).

Гость — неавторизованный посетитель лендинга, который написал в чат до входа в личный кабинет.
Его переписка хранится отдельно от клиентских (guest_messages/guest_sessions) и видна сотрудникам
на отдельной вкладке «Гости», чтобы не путать с действующими клиентами.

X-Action значения:
  list                — GET история сообщений диалога.
                        Клиент передаёт X-Client-Token — получает свой диалог.
                        Гость передаёт X-Guest-Token — получает свой диалог.
                        Сотрудник передаёт X-Staff-Token + X-Client-Id (клиент) ИЛИ X-Guest-Id (гость).
  send                — POST отправить сообщение: body {text?, file_base64?, file_name?, doc_id?}. Файлы и документы — только клиенту (не гостю).
                        doc_id: сотрудник отправляет документ-ярлык в чат; клиент с file_base64 возвращает подписанный файл (статус returned).
                        Клиент — X-Client-Token. Гость — X-Guest-Token (создаётся автоматически, если нет).
                        Сотрудник — X-Staff-Token + body.client_id ИЛИ body.guest_id.
  start-guest         — POST создать гостевую сессию (если у посетителя ещё нет токена): body {name?}
  list-conversations  — GET (только сотрудник) список клиентов с последним сообщением и счётчиком непрочитанных
  list-guest-conversations — GET (только сотрудник) список гостевых диалогов
"""
import json
import os
import base64
import re
import secrets
import uuid
import urllib.request
import boto3
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Action, X-Client-Token, X-Staff-Token, X-Client-Id, X-Guest-Token, X-Guest-Id",
}
SCHEMA = "t_p21475602_quantum_innovation_l"


AWS_KEY = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SEC = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
CDN_BASE = f"https://cdn.poehali.dev/projects/{AWS_KEY}/bucket"
MAX_FILE_BYTES = 10 * 1024 * 1024
CONTENT_TYPES = {
    "pdf": "application/pdf", "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
    "doc": "application/msword", "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xls": "application/vnd.ms-excel", "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "zip": "application/zip", "txt": "text/plain",
}

MSG_COLS = """m.id, m.sender_type, m.staff_id, s.name, m.body, m.created_at, m.read_at,
       m.kind, m.file_url, m.file_name, m.doc_id, d.title, d.status, d.deal_id, d.signed_file_url, d.signed_file_name,
       d.file_url, d.file_name"""
MSG_JOIN = f"""LEFT JOIN {{schema}}.staff_users s ON s.id = m.staff_id
       LEFT JOIN {{schema}}.deal_documents d ON d.id = m.doc_id"""


def msg_dict(r) -> dict:
    out = {
        "id": r[0], "sender_type": r[1], "staff_id": r[2], "staff_name": r[3],
        "text": r[4], "created_at": str(r[5]), "read_at": str(r[6]) if r[6] else None,
        "kind": "text", "file_url": None, "file_name": None, "doc": None,
    }
    if len(r) > 7:
        out["kind"] = r[7] or "text"
        if out["kind"] == "doc" and (not r[10] or r[12] == "removed"):
            out["kind"] = "text"
            out["text"] = out["text"] or "Документ удалён из сделки"
        out["file_url"] = r[8]
        out["file_name"] = r[9]
        if r[10] and r[12] != "removed":
            out["doc"] = {
                "id": r[10], "title": r[11], "status": r[12], "deal_id": r[13],
                "signed_file_url": r[14], "signed_file_name": r[15],
                "file_url": r[16], "file_name": r[17],
            }
    return out


def upload_file(b64: str, file_name: str):
    data = base64.b64decode(b64)
    if len(data) > MAX_FILE_BYTES:
        return None, "Файл больше 10 МБ"
    ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "bin"
    ext = re.sub(r"[^a-z0-9]", "", ext)[:8] or "bin"
    key = f"chat/{uuid.uuid4()}.{ext}"
    boto3.client(
        "s3", endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=AWS_KEY, aws_secret_access_key=AWS_SEC,
    ).put_object(Bucket="files", Key=key, Body=data, ContentType=CONTENT_TYPES.get(ext, "application/octet-stream"))
    return f"{CDN_BASE}/{key}", None


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(body, status=200):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False)}


def err(msg, status=400):
    return {"statusCode": status, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def get_client(cur, token: str):
    if not token:
        return None
    cur.execute(f"""
        SELECT c.id, c.name FROM {SCHEMA}.client_sessions cs
        JOIN {SCHEMA}.clients c ON lower(c.email) = lower(cs.email)
        WHERE cs.token=%s AND cs.expires_at > NOW()
    """, (token,))
    row = cur.fetchone()
    return {"id": row[0], "name": row[1]} if row else None


def get_guest(cur, token: str):
    if not token:
        return None
    cur.execute(f"SELECT id, name FROM {SCHEMA}.guest_sessions WHERE token=%s", (token,))
    row = cur.fetchone()
    return {"id": row[0], "name": row[1]} if row else None


def get_staff(cur, token: str):
    if not token:
        return None
    cur.execute(f"""
        SELECT s.id, s.name, COALESCE(ss.preview_role, s.role) FROM {SCHEMA}.staff_sessions ss
        JOIN {SCHEMA}.staff_users s ON s.id = ss.staff_id
        WHERE ss.token=%s AND ss.expires_at > NOW() AND s.active=TRUE
    """, (token,))
    row = cur.fetchone()
    return {"id": row[0], "name": row[1], "role": row[2]} if row else None


def notify_max(cur, conn, who: str, text: str, client_id=None, guest_id=None):
    cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key='max_bot_token'")
    row = cur.fetchone()
    token = (row[0] if row else "") or os.environ.get("MAX_BOT_TOKEN", "")
    if not token:
        return
    cur.execute(f"SELECT user_id FROM {SCHEMA}.max_subscribers")
    users = [r[0] for r in cur.fetchall()]
    msg = f"{who}:\n{text or 'Прислал(а) файл'}\n\nОтветьте реплаем на это сообщение — ответ уйдёт клиенту на сайт."
    for user_id in users:
        req = urllib.request.Request(
            f"https://platform-api.max.ru/messages?user_id={user_id}",
            data=json.dumps({"text": msg[:4000]}).encode(),
            headers={"Content-Type": "application/json", "Authorization": token},
        )
        try:
            with urllib.request.urlopen(req, timeout=4) as r:
                mid = json.loads(r.read())["message"]["body"]["mid"]
            cur.execute(f"""
                INSERT INTO {SCHEMA}.max_message_map (mid, client_id, guest_id) VALUES (%s,%s,%s)
                ON CONFLICT DO NOTHING
            """, (mid, client_id, guest_id))
        except Exception:
            continue
    conn.commit()


def handler(event: dict, context) -> dict:
    """Обработчик чата между посетителями (клиент/гость) и сотрудниками."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    action = headers.get("x-action", "")
    client_token = headers.get("x-client-token", "")
    guest_token = headers.get("x-guest-token", "")
    staff_token = headers.get("x-staff-token", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        client = get_client(cur, client_token) if client_token else None
        guest = get_guest(cur, guest_token) if guest_token else None
        staff = get_staff(cur, staff_token) if staff_token else None

        # ── start-guest ───────────────────────────────────────────
        if action == "start-guest":
            body = json.loads(event.get("body") or "{}")
            token = secrets.token_urlsafe(24)
            cur.execute(f"""
                INSERT INTO {SCHEMA}.guest_sessions (token, name) VALUES (%s, %s) RETURNING id
            """, (token, body.get("name")))
            guest_id = cur.fetchone()[0]
            conn.commit()
            return ok({"ok": True, "token": token, "guest_id": guest_id}, 201)

        # ── list ──────────────────────────────────────────────────
        if action == "list":
            if staff:
                client_id = headers.get("x-client-id", "")
                guest_id = headers.get("x-guest-id", "")
                if client_id:
                    cur.execute(f"""
                        UPDATE {SCHEMA}.messages SET read_at=NOW()
                        WHERE client_id=%s AND sender_type='client' AND read_at IS NULL
                    """, (client_id,))
                    conn.commit()
                    cur.execute(f"""
                        SELECT {MSG_COLS}
                        FROM {SCHEMA}.messages m
                        {MSG_JOIN.format(schema=SCHEMA)}
                        WHERE m.client_id=%s ORDER BY m.created_at
                    """, (client_id,))
                elif guest_id:
                    cur.execute(f"""
                        UPDATE {SCHEMA}.guest_messages SET read_at=NOW()
                        WHERE guest_id=%s AND sender_type='guest' AND read_at IS NULL
                    """, (guest_id,))
                    conn.commit()
                    cur.execute(f"""
                        SELECT m.id, m.sender_type, m.staff_id, s.name, m.body, m.created_at, m.read_at
                        FROM {SCHEMA}.guest_messages m
                        LEFT JOIN {SCHEMA}.staff_users s ON s.id = m.staff_id
                        WHERE m.guest_id=%s ORDER BY m.created_at
                    """, (guest_id,))
                else:
                    return err("X-Client-Id or X-Guest-Id required")
            elif client:
                cur.execute(f"""
                    SELECT {MSG_COLS}
                    FROM {SCHEMA}.messages m
                    {MSG_JOIN.format(schema=SCHEMA)}
                    WHERE m.client_id=%s ORDER BY m.created_at
                """, (client["id"],))
            elif guest:
                cur.execute(f"""
                    SELECT m.id, m.sender_type, m.staff_id, s.name, m.body, m.created_at, m.read_at
                    FROM {SCHEMA}.guest_messages m
                    LEFT JOIN {SCHEMA}.staff_users s ON s.id = m.staff_id
                    WHERE m.guest_id=%s ORDER BY m.created_at
                """, (guest["id"],))
            else:
                return err("Unauthorized", 401)

            messages = [msg_dict(r) for r in cur.fetchall()]
            return ok({"messages": messages})

        # ── send ──────────────────────────────────────────────────
        if action == "send":
            body = json.loads(event.get("body") or "{}")
            text = (body.get("text") or "").strip()
            file_b64 = body.get("file_base64") or ""
            file_name = (body.get("file_name") or "file").strip()[:120]
            doc_id = body.get("doc_id")
            if not text and not file_b64 and not doc_id:
                return err("text required")

            file_url = None
            if file_b64:
                file_url, upload_err = upload_file(file_b64, file_name)
                if upload_err:
                    return err(upload_err)

            kind = "file" if file_url else "text"
            doc_title = None
            target_client_id = None
            new_row = None

            if doc_id:
                cur.execute(f"SELECT client_id, title FROM {SCHEMA}.deal_documents WHERE id=%s", (doc_id,))
                drow = cur.fetchone()
                if not drow:
                    return err("Документ не найден", 404)
                doc_title = drow[1]
                owner_id = client["id"] if client else body.get("client_id")
                if owner_id is None or int(owner_id) != drow[0]:
                    return err("Документ принадлежит другому клиенту", 403)

            if staff:
                target_client_id = body.get("client_id")
                target_guest_id = body.get("guest_id")
                if target_client_id:
                    if doc_id:
                        kind = "doc"
                        if file_url:
                            cur.execute(f"""
                                UPDATE {SCHEMA}.deal_documents SET file_url=%s, file_name=%s, updated_at=NOW() WHERE id=%s
                            """, (file_url, file_name, doc_id))
                            file_url = None
                        cur.execute(f"""
                            UPDATE {SCHEMA}.deal_documents
                            SET status = CASE WHEN status IN ('todo','sent') THEN 'sent' ELSE status END,
                                sent_at = COALESCE(sent_at, NOW()), updated_at=NOW()
                            WHERE id=%s
                        """, (doc_id,))
                    cur.execute(f"""
                        INSERT INTO {SCHEMA}.messages (client_id, sender_type, staff_id, body, kind, doc_id, file_url, file_name)
                        VALUES (%s, 'staff', %s, %s, %s, %s, %s, %s) RETURNING id, created_at
                    """, (target_client_id, staff["id"], text, kind, doc_id, file_url, file_name if file_url else None))
                    new_row = cur.fetchone()
                    note_title = f"Документ на подпись: {doc_title}" if kind == "doc" else f"Новое сообщение от {staff['name']}"
                    note_body = (text or (f"Файл: {file_name}" if file_url else "Откройте чат, чтобы посмотреть"))[:200]
                    cur.execute(f"""
                        INSERT INTO {SCHEMA}.client_notifications (client_id, type, title, body)
                        VALUES (%s, 'message', %s, %s)
                    """, (target_client_id, note_title, note_body))
                elif target_guest_id:
                    if file_url or doc_id:
                        return err("Гостям файлы не отправляются")
                    cur.execute(f"""
                        INSERT INTO {SCHEMA}.guest_messages (guest_id, sender_type, staff_id, body)
                        VALUES (%s, 'staff', %s, %s) RETURNING id, created_at
                    """, (target_guest_id, staff["id"], text))
                else:
                    return err("client_id or guest_id required")
            elif client:
                if doc_id and file_url:
                    cur.execute(f"""
                        UPDATE {SCHEMA}.deal_documents
                        SET signed_file_url=%s, signed_file_name=%s, status='returned', updated_at=NOW()
                        WHERE id=%s AND status <> 'done'
                    """, (file_url, file_name, doc_id))
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.messages (client_id, sender_type, body, kind, doc_id, file_url, file_name)
                    VALUES (%s, 'client', %s, %s, %s, %s, %s) RETURNING id, created_at
                """, (client["id"], text, kind, doc_id, file_url, file_name if file_url else None))
            elif guest:
                if file_url or doc_id:
                    return err("Войдите в личный кабинет, чтобы отправлять файлы", 401)
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.guest_messages (guest_id, sender_type, body)
                    VALUES (%s, 'guest', %s) RETURNING id, created_at
                """, (guest["id"], text))
            else:
                return err("Unauthorized", 401)

            new_row = new_row if (staff and target_client_id) else cur.fetchone()
            new_id, created_at = new_row
            conn.commit()
            if client and not staff:
                notify_max(cur, conn, f"Клиент (авторизован): {client['name']}", text, client_id=client["id"])
            elif guest and not staff:
                notify_max(cur, conn, f"Аноним (не авторизован): гость {guest['name'] or '№' + str(guest['id'])}", text, guest_id=guest["id"])
            return ok({"ok": True, "id": new_id, "created_at": str(created_at)}, 201)

        # ── list-conversations (клиенты) ──────────────────────────
        if action == "list-conversations":
            if not staff:
                return err("Unauthorized", 401)
            cur.execute(f"""
                SELECT c.id, c.name, c.company,
                       lm.body, lm.created_at, lm.sender_type,
                       COALESCE(uc.unread, 0)
                FROM {SCHEMA}.clients c
                LEFT JOIN LATERAL (
                    SELECT COALESCE(NULLIF(body,''), CASE kind WHEN 'doc' THEN 'Документ' ELSE 'Вложение' END) AS body, created_at, sender_type FROM {SCHEMA}.messages
                    WHERE client_id = c.id ORDER BY created_at DESC LIMIT 1
                ) lm ON TRUE
                LEFT JOIN LATERAL (
                    SELECT COUNT(*) AS unread FROM {SCHEMA}.messages
                    WHERE client_id = c.id AND sender_type='client' AND read_at IS NULL
                ) uc ON TRUE
                WHERE lm.body IS NOT NULL
                ORDER BY lm.created_at DESC
            """)
            conversations = [
                {
                    "client_id": r[0], "client_name": r[1], "client_company": r[2],
                    "last_message": r[3], "last_at": str(r[4]) if r[4] else None,
                    "last_sender": r[5], "unread": r[6],
                }
                for r in cur.fetchall()
            ]
            return ok({"conversations": conversations})

        # ── list-guest-conversations ───────────────────────────────
        if action == "list-guest-conversations":
            if not staff:
                return err("Unauthorized", 401)
            cur.execute(f"""
                SELECT g.id, g.name,
                       lm.body, lm.created_at, lm.sender_type,
                       COALESCE(uc.unread, 0)
                FROM {SCHEMA}.guest_sessions g
                JOIN LATERAL (
                    SELECT body, created_at, sender_type FROM {SCHEMA}.guest_messages
                    WHERE guest_id = g.id ORDER BY created_at DESC LIMIT 1
                ) lm ON TRUE
                LEFT JOIN LATERAL (
                    SELECT COUNT(*) AS unread FROM {SCHEMA}.guest_messages
                    WHERE guest_id = g.id AND sender_type='guest' AND read_at IS NULL
                ) uc ON TRUE
                ORDER BY lm.created_at DESC
            """)
            conversations = [
                {
                    "guest_id": r[0], "guest_name": r[1] or f"Гость #{r[0]}",
                    "last_message": r[2], "last_at": str(r[3]) if r[3] else None,
                    "last_sender": r[4], "unread": r[5],
                }
                for r in cur.fetchall()
            ]
            return ok({"conversations": conversations})

        return err(f"Unknown action: {action}", 400)
    finally:
        cur.close()
        conn.close()