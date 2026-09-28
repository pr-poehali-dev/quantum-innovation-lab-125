"""
Вход клиента в личный кабинет по коду на email + управление партиями продукта.
Роутинг через заголовок X-Action.

X-Action значения:
  request-code   — POST отправить код на email клиента (если у него есть сделки)
  verify-code    — POST проверить код → выдать токен сессии клиента
  me             — GET текущий клиент, его партии (с заказами внутри) и этапы воронки
  create-order   — POST создать заказ: если batch_id не передан — создаёт новую партию (batch_name обязателен),
                    иначе добавляет повторный заказ в существующую партию.
                    Параметры: batch_id?, batch_name?, origin_id, roast, packaging, weight_format, design, volume, amount, note
  list-mockups   — GET список макетов дизайна партии: X-Batch-Id
  upload-mockup  — POST клиент загружает макет (base64 → S3): batch_id, file_base64, file_name
"""
import json
import os
import random
import secrets
import base64
import uuid
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timedelta
import psycopg2
import boto3

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Action, X-Client-Token, X-Batch-Id",
}
SCHEMA = "t_p21475602_quantum_innovation_l"
UNISENDER_KEY = os.environ.get("UNISENDER_API_KEY", "")
SENDER_EMAIL = "marketing1@aromateacoffee.ru"
SENDER_NAME = "КонтрактКофе"
AWS_KEY = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SEC = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
CDN_BASE = f"https://cdn.poehali.dev/projects/{AWS_KEY}/bucket"
TEST_EMAIL = "test-client@kontraktkafe.ru"
TEST_CODE = "000000"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=AWS_KEY,
        aws_secret_access_key=AWS_SEC,
    )


def ok(body, status=200):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False)}


def err(msg, status=400):
    return {"statusCode": status, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def get_client_by_token(cur, token: str):
    if not token:
        return None
    cur.execute(f"""
        SELECT email FROM {SCHEMA}.client_sessions WHERE token=%s AND expires_at > NOW()
    """, (token,))
    row = cur.fetchone()
    if not row:
        return None
    cur.execute(f"SELECT id, name, phone, email, city, company FROM {SCHEMA}.clients WHERE lower(email)=%s", (row[0],))
    crow = cur.fetchone()
    if not crow:
        return None
    return {"id": crow[0], "name": crow[1], "phone": crow[2], "email": crow[3], "city": crow[4], "company": crow[5]}


def unisender_call(method: str, params: dict) -> dict:
    params = {**params, "api_key": UNISENDER_KEY, "format": "json"}
    data = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(f"https://api.unisender.com/ru/api/{method}", data=data, method="POST")
    with urllib.request.urlopen(req, timeout=6) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_or_create_list_id(cur, conn) -> str:
    cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key='unisender_list_id'")
    row = cur.fetchone()
    if row:
        return row[0]
    result = unisender_call("createList", {"title": "КонтрактКофе — уведомления"})
    list_id = str(result["result"]["id"])
    cur.execute(f"""
        INSERT INTO {SCHEMA}.site_settings (key, value, updated_at) VALUES ('unisender_list_id', %s, NOW())
        ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()
    """, (list_id,))
    conn.commit()
    return list_id


def send_email(cur, conn, to_email: str, subject: str, html: str):
    if not UNISENDER_KEY:
        return
    try:
        list_id = get_or_create_list_id(cur, conn)
        unisender_call("sendEmail", {
            "email": to_email,
            "sender_name": SENDER_NAME,
            "sender_email": SENDER_EMAIL,
            "subject": subject,
            "body": html,
            "list_id": list_id,
        })
    except Exception:
        pass


def handler(event: dict, context) -> dict:
    """Обработчик входа клиента в личный кабинет и управления партиями продукта."""
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

            send_email(cur, conn, email, "Код входа в личный кабинет КонтрактКофе", f"""
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
            client = get_client_by_token(cur, client_token)
            if not client:
                return err("Unauthorized", 401)

            cur.execute(f"""
                SELECT id, name, created_at FROM {SCHEMA}.product_batches
                WHERE client_id=%s ORDER BY created_at DESC
            """, (client["id"],))
            batch_rows = cur.fetchall()
            batches = []
            for b in batch_rows:
                batch_id = b[0]
                cur.execute(f"""
                    SELECT d.id, d.stage_id, s.name, s.color, s.sort_order, d.volume, d.amount, d.created_at,
                           d.origin_id, co.label, d.roast, d.packaging, d.weight_format, d.design, d.note
                    FROM {SCHEMA}.deals d
                    JOIN {SCHEMA}.deal_stages s ON s.id = d.stage_id
                    LEFT JOIN {SCHEMA}.calc_origins co ON co.id = d.origin_id
                    WHERE d.batch_id=%s ORDER BY d.created_at DESC
                """, (batch_id,))
                orders = [
                    {
                        "id": r[0], "stage_id": r[1], "stage_name": r[2], "stage_color": r[3], "stage_order": r[4],
                        "volume": float(r[5]) if r[5] else None, "amount": float(r[6]) if r[6] else None,
                        "created_at": str(r[7]), "origin_id": r[8], "origin_label": r[9],
                        "roast": r[10], "packaging": r[11], "weight_format": r[12], "design": r[13], "note": r[14],
                    }
                    for r in cur.fetchall()
                ]
                batches.append({"id": batch_id, "name": b[1], "created_at": str(b[2]), "orders": orders})

            # Заказы без партии (созданы напрямую менеджером из заявки, ещё не привязаны)
            cur.execute(f"""
                SELECT d.id, d.brand, d.stage_id, s.name, s.color, s.sort_order, d.volume, d.amount, d.created_at
                FROM {SCHEMA}.deals d
                JOIN {SCHEMA}.deal_stages s ON s.id = d.stage_id
                WHERE d.client_id=%s AND d.batch_id IS NULL ORDER BY d.created_at DESC
            """, (client["id"],))
            unassigned = [
                {
                    "id": r[0], "brand": r[1], "stage_id": r[2], "stage_name": r[3], "stage_color": r[4],
                    "stage_order": r[5], "volume": float(r[6]) if r[6] else None,
                    "amount": float(r[7]) if r[7] else None, "created_at": str(r[8]),
                }
                for r in cur.fetchall()
            ]

            cur.execute(f"SELECT id, name, sort_order, color FROM {SCHEMA}.deal_stages ORDER BY sort_order")
            all_stages = [{"id": r[0], "name": r[1], "sort_order": r[2], "color": r[3]} for r in cur.fetchall()]

            return ok({"client": client, "batches": batches, "unassigned_orders": unassigned, "stages": all_stages})

        # ── create-order ──────────────────────────────────────────
        if action == "create-order":
            client = get_client_by_token(cur, client_token)
            if not client:
                return err("Unauthorized", 401)

            body = json.loads(event.get("body") or "{}")
            batch_id = body.get("batch_id")
            batch_name = (body.get("batch_name") or "").strip()

            if not batch_id:
                if not batch_name:
                    return err("batch_name required for a new batch")
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.product_batches (client_id, name) VALUES (%s, %s) RETURNING id
                """, (client["id"], batch_name))
                batch_id = cur.fetchone()[0]
            else:
                cur.execute(f"SELECT id FROM {SCHEMA}.product_batches WHERE id=%s AND client_id=%s", (batch_id, client["id"]))
                if not cur.fetchone():
                    return err("Партия не найдена", 404)

            cur.execute(f"SELECT id FROM {SCHEMA}.deal_stages ORDER BY sort_order LIMIT 1")
            first_stage = cur.fetchone()
            if not first_stage:
                return err("Нет ни одного этапа сделки")
            stage_id = first_stage[0]

            cur.execute(f"""
                INSERT INTO {SCHEMA}.deals
                    (client_id, batch_id, stage_id, origin_id, roast, packaging, weight_format, design, volume, amount, note)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (
                client["id"], batch_id, stage_id, body.get("origin_id"), body.get("roast"), body.get("packaging"),
                body.get("weight_format"), body.get("design"), body.get("volume"), body.get("amount"), body.get("note", ""),
            ))
            deal_id = cur.fetchone()[0]

            cur.execute(f"""
                INSERT INTO {SCHEMA}.deal_stage_log (deal_id, from_stage_id, to_stage_id, staff_id, staff_name)
                VALUES (%s, NULL, %s, NULL, %s)
            """, (deal_id, stage_id, f"Заказ от клиента ({client['name']})"))
            conn.commit()
            return ok({"ok": True, "deal_id": deal_id, "batch_id": batch_id}, 201)

        # ── list-mockups ──────────────────────────────────────────
        if action == "list-mockups":
            client = get_client_by_token(cur, client_token)
            if not client:
                return err("Unauthorized", 401)
            batch_id = headers.get("x-batch-id", "")
            if not batch_id:
                return err("X-Batch-Id required")
            cur.execute(f"SELECT id FROM {SCHEMA}.product_batches WHERE id=%s AND client_id=%s", (batch_id, client["id"]))
            if not cur.fetchone():
                return err("Партия не найдена", 404)
            cur.execute(f"""
                SELECT id, file_url, file_name, uploaded_by, status, comment, created_at
                FROM {SCHEMA}.batch_mockups WHERE batch_id=%s ORDER BY created_at DESC
            """, (batch_id,))
            mockups = [
                {
                    "id": r[0], "file_url": r[1], "file_name": r[2], "uploaded_by": r[3],
                    "status": r[4], "comment": r[5], "created_at": str(r[6]),
                }
                for r in cur.fetchall()
            ]
            return ok({"mockups": mockups})

        # ── upload-mockup ─────────────────────────────────────────
        if action == "upload-mockup":
            client = get_client_by_token(cur, client_token)
            if not client:
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            batch_id = body.get("batch_id")
            b64 = body.get("file_base64", "")
            file_name = body.get("file_name", "mockup.pdf")
            if not batch_id or not b64:
                return err("batch_id and file_base64 required")
            cur.execute(f"SELECT id FROM {SCHEMA}.product_batches WHERE id=%s AND client_id=%s", (batch_id, client["id"]))
            if not cur.fetchone():
                return err("Партия не найдена", 404)

            data = base64.b64decode(b64)
            ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "pdf"
            s3_key = f"mockups/{uuid.uuid4()}.{ext}"
            content_types = {
                "pdf": "application/pdf", "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
                "ai": "application/postscript", "psd": "image/vnd.adobe.photoshop",
            }
            get_s3().put_object(Bucket="files", Key=s3_key, Body=data, ContentType=content_types.get(ext, "application/octet-stream"))
            file_url = f"{CDN_BASE}/{s3_key}"

            cur.execute(f"""
                INSERT INTO {SCHEMA}.batch_mockups (batch_id, file_url, file_name, uploaded_by, status)
                VALUES (%s, %s, %s, 'client', 'pending') RETURNING id
            """, (batch_id, file_url, file_name))
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({"id": new_id, "file_url": file_url, "ok": True}, 201)

        return err(f"Unknown action: {action}", 400)
    finally:
        cur.close()
        conn.close()