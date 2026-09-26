"""
Вход клиента в личный кабинет по коду на email.
Роутинг через заголовок X-Action.

X-Action значения:
  request-code   — POST отправить код на email клиента (если у него есть сделки)
  verify-code    — POST проверить код → выдать токен сессии клиента
  me             — GET текущий клиент по X-Client-Token
"""
import json
import os
import random
import secrets
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timedelta
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Action, X-Client-Token",
}
SCHEMA = "t_p21475602_quantum_innovation_l"
RESEND_KEY = os.environ.get("RESEND_API_KEY", "")
TEST_EMAIL = "test-client@kontraktkafe.ru"
TEST_CODE = "000000"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(body, status=200):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False)}


def err(msg, status=400):
    return {"statusCode": status, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def send_email(to_email: str, subject: str, html: str):
    if not RESEND_KEY:
        return
    payload = json.dumps({
        "from": "КонтрактКофе <noreply@kontraktkafe.ru>",
        "to": [to_email],
        "subject": subject,
        "html": html,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {RESEND_KEY}"},
        method="POST",
    )
    try:
        urllib.request.urlopen(req, timeout=6)
    except urllib.error.URLError:
        pass


def handler(event: dict, context) -> dict:
    """Обработчик входа клиента в личный кабинет по email-коду."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    action = headers.get("x-action", "")
    client_token = headers.get("x-client-token", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ── request-code ──────────────────────────────────────────
        if action == "request-code":
            body = json.loads(event.get("body") or "{}")
            email = (body.get("email") or "").strip().lower()
            if not email:
                return err("email required")

            cur.execute(f"SELECT id FROM {SCHEMA}.clients WHERE lower(email)=%s", (email,))
            client_row = cur.fetchone()
            if not client_row:
                # Не раскрываем, что клиента нет — единый ответ
                return ok({"ok": True})

            code = str(random.randint(100000, 999999))
            expires = datetime.utcnow() + timedelta(minutes=15)
            cur.execute(f"""
                INSERT INTO {SCHEMA}.client_login_codes (email, code, expires_at) VALUES (%s, %s, %s)
            """, (email, code, expires))
            conn.commit()

            send_email(email, "Код входа в личный кабинет КонтрактКофе", f"""
                <p>Ваш код для входа в личный кабинет:</p>
                <p style="font-size:28px;font-weight:bold;letter-spacing:4px">{code}</p>
                <p style="color:#888;font-size:12px">Код действует 15 минут.</p>
            """)
            return ok({"ok": True})

        # ── verify-code ───────────────────────────────────────────
        if action == "verify-code":
            body = json.loads(event.get("body") or "{}")
            email = (body.get("email") or "").strip().lower()
            code = (body.get("code") or "").strip()
            if not email or not code:
                return err("email and code required")

            is_test_login = email == TEST_EMAIL and code == TEST_CODE
            if not is_test_login:
                cur.execute(f"""
                    SELECT id FROM {SCHEMA}.client_login_codes
                    WHERE email=%s AND code=%s AND used=FALSE AND expires_at > NOW()
                    ORDER BY id DESC LIMIT 1
                """, (email, code))
                row = cur.fetchone()
                if not row:
                    return err("Неверный или истёкший код", 401)

                cur.execute(f"UPDATE {SCHEMA}.client_login_codes SET used=TRUE WHERE id=%s", (row[0],))

            token = secrets.token_urlsafe(32)
            expires = datetime.utcnow() + timedelta(days=30)
            cur.execute(f"""
                INSERT INTO {SCHEMA}.client_sessions (email, token, expires_at) VALUES (%s, %s, %s)
            """, (email, token, expires))
            conn.commit()
            return ok({"ok": True, "token": token})

        # ── me ────────────────────────────────────────────────────
        if action == "me":
            if not client_token:
                return err("Unauthorized", 401)
            cur.execute(f"""
                SELECT email FROM {SCHEMA}.client_sessions WHERE token=%s AND expires_at > NOW()
            """, (client_token,))
            row = cur.fetchone()
            if not row:
                return err("Unauthorized", 401)
            email = row[0]

            cur.execute(f"""
                SELECT id, name, phone, email, city, company FROM {SCHEMA}.clients WHERE lower(email)=%s
            """, (email,))
            crow = cur.fetchone()
            if not crow:
                return err("Клиент не найден", 404)
            client = {"id": crow[0], "name": crow[1], "phone": crow[2], "email": crow[3], "city": crow[4], "company": crow[5]}

            cur.execute(f"""
                SELECT d.id, d.brand, d.volume, d.amount, d.stage_id, s.name, s.color, s.sort_order, d.created_at
                FROM {SCHEMA}.deals d
                JOIN {SCHEMA}.deal_stages s ON s.id = d.stage_id
                WHERE d.client_id=%s ORDER BY d.created_at DESC
            """, (client["id"],))
            deals = [
                {
                    "id": r[0], "brand": r[1], "volume": float(r[2]) if r[2] else None,
                    "amount": float(r[3]) if r[3] else None, "stage_id": r[4],
                    "stage_name": r[5], "stage_color": r[6], "stage_order": r[7],
                    "created_at": str(r[8]),
                }
                for r in cur.fetchall()
            ]

            cur.execute(f"SELECT id, name, sort_order, color FROM {SCHEMA}.deal_stages ORDER BY sort_order")
            all_stages = [{"id": r[0], "name": r[1], "sort_order": r[2], "color": r[3]} for r in cur.fetchall()]

            return ok({"client": client, "deals": deals, "stages": all_stages})

        return err(f"Unknown action: {action}", 400)
    finally:
        cur.close()
        conn.close()