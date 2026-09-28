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
  send                — POST отправить сообщение: body {text}.
                        Клиент — X-Client-Token. Гость — X-Guest-Token (создаётся автоматически, если нет).
                        Сотрудник — X-Staff-Token + body.client_id ИЛИ body.guest_id.
  start-guest         — POST создать гостевую сессию (если у посетителя ещё нет токена): body {name?}
  list-conversations  — GET (только сотрудник) список клиентов с последним сообщением и счётчиком непрочитанных
  list-guest-conversations — GET (только сотрудник) список гостевых диалогов
"""
import json
import os
import secrets
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Action, X-Client-Token, X-Staff-Token, X-Client-Id, X-Guest-Token, X-Guest-Id",
}
SCHEMA = "t_p21475602_quantum_innovation_l"


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
                        SELECT m.id, m.sender_type, m.staff_id, s.name, m.body, m.created_at, m.read_at
                        FROM {SCHEMA}.messages m
                        LEFT JOIN {SCHEMA}.staff_users s ON s.id = m.staff_id
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
                    SELECT m.id, m.sender_type, m.staff_id, s.name, m.body, m.created_at, m.read_at
                    FROM {SCHEMA}.messages m
                    LEFT JOIN {SCHEMA}.staff_users s ON s.id = m.staff_id
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

            messages = [
                {
                    "id": r[0], "sender_type": r[1], "staff_id": r[2], "staff_name": r[3],
                    "text": r[4], "created_at": str(r[5]), "read_at": str(r[6]) if r[6] else None,
                }
                for r in cur.fetchall()
            ]
            return ok({"messages": messages})

        # ── send ──────────────────────────────────────────────────
        if action == "send":
            body = json.loads(event.get("body") or "{}")
            text = (body.get("text") or "").strip()
            if not text:
                return err("text required")

            if staff:
                target_client_id = body.get("client_id")
                target_guest_id = body.get("guest_id")
                if target_client_id:
                    cur.execute(f"""
                        INSERT INTO {SCHEMA}.messages (client_id, sender_type, staff_id, body)
                        VALUES (%s, 'staff', %s, %s) RETURNING id, created_at
                    """, (target_client_id, staff["id"], text))
                elif target_guest_id:
                    cur.execute(f"""
                        INSERT INTO {SCHEMA}.guest_messages (guest_id, sender_type, staff_id, body)
                        VALUES (%s, 'staff', %s, %s) RETURNING id, created_at
                    """, (target_guest_id, staff["id"], text))
                else:
                    return err("client_id or guest_id required")
            elif client:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.messages (client_id, sender_type, body)
                    VALUES (%s, 'client', %s) RETURNING id, created_at
                """, (client["id"], text))
            elif guest:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.guest_messages (guest_id, sender_type, body)
                    VALUES (%s, 'guest', %s) RETURNING id, created_at
                """, (guest["id"], text))
            else:
                return err("Unauthorized", 401)

            new_id, created_at = cur.fetchone()
            conn.commit()
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
                    SELECT body, created_at, sender_type FROM {SCHEMA}.messages
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
