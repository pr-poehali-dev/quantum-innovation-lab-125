"""
Авторизация сотрудников закрытой админки (CRM).
Роутинг через заголовок X-Action.

X-Action значения:
  create-invite   — POST создать ссылку-приглашение (нужна сессия, либо это первый сотрудник)
  accept-invite    — POST принять приглашение: задать имя и пароль → создаётся аккаунт
  check-invite     — GET проверить токен приглашения (валиден/email)
  login            — POST вход по email+паролю → токен сессии
  me               — GET текущий сотрудник по X-Staff-Token
  logout           — POST удалить сессию
  list-staff       — GET список сотрудников (нужна сессия)
"""
import json
import os
import hashlib
import secrets
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timedelta
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Action, X-Staff-Token, X-Invite-Token",
}
SCHEMA = "t_p21475602_quantum_innovation_l"
RESEND_KEY = os.environ.get("RESEND_API_KEY", "")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(body, status=200):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False)}


def err(msg, status=400):
    return {"statusCode": status, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000).hex()


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


def get_staff_by_token(cur, token: str):
    if not token:
        return None
    cur.execute(f"""
        SELECT s.id, s.email, s.name, s.is_owner
        FROM {SCHEMA}.staff_sessions ss
        JOIN {SCHEMA}.staff_users s ON s.id = ss.staff_id
        WHERE ss.token=%s AND ss.expires_at > NOW() AND s.active=TRUE
    """, (token,))
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "email": row[1], "name": row[2], "is_owner": row[3]}


def handler(event: dict, context) -> dict:
    """Обработчик авторизации сотрудников закрытой админки."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    action = headers.get("x-action", "")
    staff_token = headers.get("x-staff-token", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ── create-invite ─────────────────────────────────────────
        if action == "create-invite":
            body = json.loads(event.get("body") or "{}")
            email = (body.get("email") or "").strip().lower()
            if not email:
                return err("email required")

            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.staff_users")
            staff_count = cur.fetchone()[0]

            inviter = get_staff_by_token(cur, staff_token)
            if staff_count > 0 and not inviter:
                return err("Unauthorized", 401)

            cur.execute(f"SELECT id FROM {SCHEMA}.staff_users WHERE email=%s", (email,))
            if cur.fetchone():
                return err("Сотрудник с таким email уже зарегистрирован")

            token = secrets.token_urlsafe(24)
            expires = datetime.utcnow() + timedelta(days=7)
            cur.execute(f"""
                INSERT INTO {SCHEMA}.staff_invites (email, token, invited_by, expires_at)
                VALUES (%s, %s, %s, %s)
            """, (email, token, inviter["id"] if inviter else None, expires))
            conn.commit()

            invite_path = f"/admin/join?token={token}"
            origin = headers.get("origin") or headers.get("referer", "").rstrip("/")
            invite_link = f"{origin}{invite_path}" if origin else invite_path
            send_email(email, "Приглашение в админку КонтрактКофе", f"""
                <p>Вас пригласили в закрытую админ-панель КонтрактКофе.</p>
                <p><a href="{invite_link}">Перейти и задать пароль →</a></p>
                <p style="color:#888;font-size:12px">Ссылка действует 7 дней.</p>
            """)
            return ok({"ok": True, "invite_link": invite_link, "invite_path": invite_path}, 201)

        # ── check-invite ──────────────────────────────────────────
        if action == "check-invite":
            token = headers.get("x-invite-token", "")
            cur.execute(f"""
                SELECT email, expires_at, accepted_at FROM {SCHEMA}.staff_invites WHERE token=%s
            """, (token,))
            row = cur.fetchone()
            if not row:
                return err("Приглашение не найдено", 404)
            email, expires_at, accepted_at = row
            if accepted_at:
                return err("Приглашение уже использовано")
            if expires_at < datetime.utcnow().replace(tzinfo=expires_at.tzinfo):
                return err("Приглашение истекло")
            return ok({"email": email})

        # ── accept-invite ─────────────────────────────────────────
        if action == "accept-invite":
            body = json.loads(event.get("body") or "{}")
            token = body.get("token", "")
            name = (body.get("name") or "").strip()
            password = body.get("password") or ""
            if not name or len(password) < 6:
                return err("Укажите имя и пароль не короче 6 символов")

            cur.execute(f"""
                SELECT id, email, expires_at, accepted_at FROM {SCHEMA}.staff_invites WHERE token=%s
            """, (token,))
            row = cur.fetchone()
            if not row:
                return err("Приглашение не найдено", 404)
            invite_id, email, expires_at, accepted_at = row
            if accepted_at:
                return err("Приглашение уже использовано")
            if expires_at < datetime.utcnow().replace(tzinfo=expires_at.tzinfo):
                return err("Приглашение истекло")

            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.staff_users")
            is_first = cur.fetchone()[0] == 0

            salt = secrets.token_hex(16)
            pwd_hash = hash_password(password, salt)
            cur.execute(f"""
                INSERT INTO {SCHEMA}.staff_users (email, name, password_hash, password_salt, is_owner)
                VALUES (%s, %s, %s, %s, %s) RETURNING id
            """, (email, name, pwd_hash, salt, is_first))
            staff_id = cur.fetchone()[0]

            cur.execute(f"UPDATE {SCHEMA}.staff_invites SET accepted_at=NOW() WHERE id=%s", (invite_id,))

            session_token = secrets.token_urlsafe(32)
            session_expires = datetime.utcnow() + timedelta(days=30)
            cur.execute(f"""
                INSERT INTO {SCHEMA}.staff_sessions (staff_id, token, expires_at) VALUES (%s, %s, %s)
            """, (staff_id, session_token, session_expires))
            conn.commit()
            return ok({"ok": True, "token": session_token, "name": name, "email": email}, 201)

        # ── login ─────────────────────────────────────────────────
        if action == "login":
            body = json.loads(event.get("body") or "{}")
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            cur.execute(f"""
                SELECT id, name, password_hash, password_salt, active FROM {SCHEMA}.staff_users WHERE email=%s
            """, (email,))
            row = cur.fetchone()
            if not row:
                return err("Неверный email или пароль", 401)
            staff_id, name, pwd_hash, salt, active = row
            if not active:
                return err("Доступ отключён", 403)
            if hash_password(password, salt) != pwd_hash:
                return err("Неверный email или пароль", 401)

            session_token = secrets.token_urlsafe(32)
            session_expires = datetime.utcnow() + timedelta(days=30)
            cur.execute(f"""
                INSERT INTO {SCHEMA}.staff_sessions (staff_id, token, expires_at) VALUES (%s, %s, %s)
            """, (staff_id, session_token, session_expires))
            conn.commit()
            return ok({"ok": True, "token": session_token, "name": name, "email": email})

        # ── me ────────────────────────────────────────────────────
        if action == "me":
            staff = get_staff_by_token(cur, staff_token)
            if not staff:
                return err("Unauthorized", 401)
            return ok({"staff": staff})

        # ── logout ────────────────────────────────────────────────
        if action == "logout":
            cur.execute(f"UPDATE {SCHEMA}.staff_sessions SET expires_at=NOW() WHERE token=%s", (staff_token,))
            conn.commit()
            return ok({"ok": True})

        # ── list-staff ────────────────────────────────────────────
        if action == "list-staff":
            staff = get_staff_by_token(cur, staff_token)
            if not staff:
                return err("Unauthorized", 401)
            cur.execute(f"""
                SELECT id, email, name, is_owner, active, created_at FROM {SCHEMA}.staff_users ORDER BY created_at
            """)
            rows = [
                {"id": r[0], "email": r[1], "name": r[2], "is_owner": r[3], "active": r[4], "created_at": str(r[5])}
                for r in cur.fetchall()
            ]
            return ok({"staff": rows})

        return err(f"Unknown action: {action}", 400)
    finally:
        cur.close()
        conn.close()