"""
Чат между клиентом (личный кабинет) и сотрудниками (менеджер/поддержка).
Роутинг через заголовок X-Action. Авторизация — X-Client-Token (клиент) либо X-Staff-Token (сотрудник).

Канал сообщений сейчас всегда 'cabinet' (переписка в личном кабинете).
Поле channel зарезервировано под будущие каналы (telegram, whatsapp и т.д.) —
все они будут стекаться в этот же диалог клиента, который видят сотрудники.

X-Action значения:
  list             — GET история сообщений диалога.
                      Клиент передаёт X-Client-Token — получает свой диалог.
                      Сотрудник передаёт X-Staff-Token + X-Client-Id — получает диалог клиента
                      (и отмечает входящие от клиента сообщения прочитанными).
  send             — POST отправить сообщение: body {text, deal_id?}.
                      Клиент — X-Client-Token. Сотрудник — X-Staff-Token + body.client_id.
  list-conversations — GET (только сотрудник) список клиентов с последним сообщением и
                        счётчиком непрочитанных — основа для очереди поддержки 24/7.
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Action, X-Client-Token, X-Staff-Token, X-Client-Id",
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


def get_staff(cur, token: str):
    if not token:
        return None
    cur.execute(f"""
        SELECT s.id, s.name, s.role FROM {SCHEMA}.staff_sessions ss
        JOIN {SCHEMA}.staff_users s ON s.id = ss.staff_id
        WHERE ss.token=%s AND ss.expires_at > NOW() AND s.active=TRUE
    """, (token,))
    row = cur.fetchone()
    return {"id": row[0], "name": row[1], "role": row[2]} if row else None


def handler(event: dict, context) -> dict:
    """Обработчик чата между клиентом и сотрудниками."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    action = headers.get("x-action", "")
    client_token = headers.get("x-client-token", "")
    staff_token = headers.get("x-staff-token", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        client = get_client(cur, client_token) if client_token else None
        staff = get_staff(cur, staff_token) if staff_token else None

        # ── list ──────────────────────────────────────────────────
        if action == "list":
            if staff:
                client_id = headers.get("x-client-id", "")
                if not client_id:
                    return err("X-Client-Id required")
                cur.execute(f"""
                    UPDATE {SCHEMA}.messages SET read_at=NOW()
                    WHERE client_id=%s AND sender_type='client' AND read_at IS NULL
                """, (client_id,))
                conn.commit()
                target_client_id = client_id
            elif client:
                target_client_id = client["id"]
            else:
                return err("Unauthorized", 401)

            cur.execute(f"""
                SELECT m.id, m.sender_type, m.staff_id, s.name, m.body, m.created_at, m.read_at
                FROM {SCHEMA}.messages m
                LEFT JOIN {SCHEMA}.staff_users s ON s.id = m.staff_id
                WHERE m.client_id=%s ORDER BY m.created_at
            """, (target_client_id,))
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
                if not target_client_id:
                    return err("client_id required")
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.messages (client_id, deal_id, sender_type, staff_id, body)
                    VALUES (%s, %s, 'staff', %s, %s) RETURNING id, created_at
                """, (target_client_id, body.get("deal_id"), staff["id"], text))
            elif client:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.messages (client_id, deal_id, sender_type, body)
                    VALUES (%s, %s, 'client', %s) RETURNING id, created_at
                """, (client["id"], body.get("deal_id"), text))
            else:
                return err("Unauthorized", 401)

            new_id, created_at = cur.fetchone()
            conn.commit()
            return ok({"ok": True, "id": new_id, "created_at": str(created_at)}, 201)

        # ── list-conversations ────────────────────────────────────
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

        return err(f"Unknown action: {action}", 400)
    finally:
        cur.close()
        conn.close()
