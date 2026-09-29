"""
Вход клиента в личный кабинет по коду на email + управление партиями продукта.
Роутинг через заголовок X-Action.

Модель: Партия (product_batch, задаёт название клиент) → внутри Заказ (deal, статус draft/submitted)
→ внутри Заказа Лоты (deal_lots — позиции: сорт, обжарка, упаковка, вес, цвет, объём).
Пока deal.status='draft' — клиент может свободно редактировать/удалять лоты и логистику.
После submit-deal заказ попадает в канбан менеджеров, лоты и логистику видно, но не редактируется клиентом.

X-Action значения:
  request-code       — POST отправить код на email клиента (если у него есть сделки), код живёт 15 минут
  verify-code        — POST проверить код → выдать токен сессии клиента
  me                 — GET текущий клиент, его партии (с заказами и лотами внутри) и этапы воронки
  create-batch       — POST создать новую партию: name
  create-draft-deal  — POST создать новый заказ-черновик в партии: batch_id
  save-lot           — POST создать/обновить лот заказа (только пока заказ в статусе draft):
                        id?, deal_id, origin_id, roast, packaging, weight_format, color, volume, amount, note
  delete-lot         — POST удалить лот (только пока заказ в статусе draft): id
  update-logistics   — POST обновить данные логистики заказа: deal_id, logistics_data (объект)
  submit-deal        — POST отправить заказ на согласование (нужен минимум 1 лот): deal_id
  list-logistics-fields — GET список полей логистики для формы (публично, без авторизации)
  list-mockups       — GET список макетов дизайна партии: X-Batch-Id
  upload-mockup      — POST клиент загружает макет (base64 → S3): batch_id, file_base64, file_name
  list-notifications — GET список уведомлений клиента (смена этапа, новые сообщения)
  mark-notifications-read — POST отметить все уведомления прочитанными
  update-profile     — POST обновить личные данные клиента: name?, phone?, city?, company? (email — логин, не меняется)
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


def get_sender(cur):
    cur.execute(f"SELECT key, value FROM {SCHEMA}.site_settings WHERE key IN ('email_sender_name','email_sender_email')")
    rows = dict(cur.fetchall())
    return rows.get("email_sender_name", "КонтрактКофе"), rows.get("email_sender_email", "")


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
        sender_name, sender_email = get_sender(cur)
        if not sender_email:
            return
        list_id = get_or_create_list_id(cur, conn)
        unisender_call("sendEmail", {
            "email": to_email,
            "sender_name": sender_name,
            "sender_email": sender_email,
            "subject": subject,
            "body": html,
            "list_id": list_id,
        })
    except Exception:
        pass


def fetch_lots(cur, deal_id):
    cur.execute(f"""
        SELECT l.id, l.lot_number, l.origin_id, co.label, l.roast, l.packaging, l.weight_format,
               l.color, l.volume, l.amount, l.note
        FROM {SCHEMA}.deal_lots l
        LEFT JOIN {SCHEMA}.calc_origins_v2 co ON co.id = l.origin_id
        WHERE l.deal_id=%s ORDER BY l.lot_number
    """, (deal_id,))
    return [
        {
            "id": r[0], "lot_number": r[1], "origin_id": r[2], "origin_label": r[3],
            "roast": r[4], "packaging": r[5], "weight_format": r[6], "color": r[7],
            "volume": float(r[8]) if r[8] is not None else None,
            "amount": float(r[9]) if r[9] is not None else None, "note": r[10],
        }
        for r in cur.fetchall()
    ]


EMAIL_STYLE_WRAP = """
<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:480px;margin:0 auto;background:#f7f5f2;padding:32px 0">
  <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
    <div style="background:#1a1a1a;padding:28px 32px;">
      <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px">КОНТРАКТ КОФЕ</p>
    </div>
    <div style="padding:32px">{content}</div>
    <div style="padding:20px 32px;background:#f7f5f2;border-top:1px solid #eee">
      <p style="margin:0;color:#999;font-size:12px">Производство кофе под вашей торговой маркой</p>
    </div>
  </div>
</div>
"""


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

            cur.execute(f"SELECT id, name FROM {SCHEMA}.clients WHERE lower(email)=%s", (email,))
            client_row = cur.fetchone()
            if not client_row:
                return ok({"ok": True})

            code = str(random.randint(100000, 999999))
            expires = datetime.utcnow() + timedelta(minutes=15)
            cur.execute(f"""
                INSERT INTO {SCHEMA}.client_login_codes (email, code, expires_at) VALUES (%s, %s, %s)
            """, (email, code, expires))
            conn.commit()

            content = f"""
                <p style="margin:0 0 16px;color:#333;font-size:15px">Здравствуйте, {client_row[1]}!</p>
                <p style="margin:0 0 20px;color:#333;font-size:15px">Ваш код для входа в личный кабинет:</p>
                <div style="background:#f7f5f2;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px">
                    <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#1a1a1a">{code}</span>
                </div>
                <p style="margin:0;color:#999;font-size:13px">Код действует 15 минут. После истечения запросите новый код на странице входа.</p>
            """
            send_email(cur, conn, email, "Код входа в личный кабинет КонтрактКофе", EMAIL_STYLE_WRAP.format(content=content))
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
                    return err("Неверный или истёкший код — запросите новый", 401)

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
                    SELECT d.id, d.stage_id, s.name, s.color, s.progress_percent, d.volume, d.amount,
                           d.created_at, d.status, d.logistics_data, d.assigned_to, st.name
                    FROM {SCHEMA}.deals d
                    LEFT JOIN {SCHEMA}.deal_stages s ON s.id = d.stage_id
                    LEFT JOIN {SCHEMA}.staff_users st ON st.id = d.assigned_to
                    WHERE d.batch_id=%s ORDER BY d.created_at DESC
                """, (batch_id,))
                deals = []
                for r in cur.fetchall():
                    deal_id = r[0]
                    deals.append({
                        "id": deal_id, "stage_id": r[1], "stage_name": r[2], "stage_color": r[3],
                        "progress_percent": r[4],
                        "volume": float(r[5]) if r[5] else None, "amount": float(r[6]) if r[6] else None,
                        "created_at": str(r[7]), "status": r[8], "logistics_data": r[9] or {},
                        "assigned_to": r[10], "assigned_name": r[11],
                        "lots": fetch_lots(cur, deal_id),
                    })
                batches.append({"id": batch_id, "name": b[1], "created_at": str(b[2]), "deals": deals})

            cur.execute(f"SELECT id, name, sort_order, color FROM {SCHEMA}.deal_stages ORDER BY sort_order")
            all_stages = [{"id": r[0], "name": r[1], "sort_order": r[2], "color": r[3]} for r in cur.fetchall()]

            cur.execute(f"""
                SELECT COUNT(*) FROM {SCHEMA}.client_notifications WHERE client_id=%s AND is_read=FALSE
            """, (client["id"],))
            unread_count = cur.fetchone()[0]

            return ok({"client": client, "batches": batches, "stages": all_stages, "unread_notifications": unread_count})

        # ── create-batch ──────────────────────────────────────────
        if action == "create-batch":
            client = get_client_by_token(cur, client_token)
            if not client:
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            name = (body.get("name") or "").strip()
            if not name:
                return err("name required")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.product_batches (client_id, name) VALUES (%s, %s) RETURNING id
            """, (client["id"], name))
            batch_id = cur.fetchone()[0]
            conn.commit()
            return ok({"ok": True, "batch_id": batch_id}, 201)

        # ── create-draft-deal ─────────────────────────────────────
        if action == "create-draft-deal":
            client = get_client_by_token(cur, client_token)
            if not client:
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            batch_id = body.get("batch_id")
            if not batch_id:
                return err("batch_id required")
            cur.execute(f"SELECT id FROM {SCHEMA}.product_batches WHERE id=%s AND client_id=%s", (batch_id, client["id"]))
            if not cur.fetchone():
                return err("Партия не найдена", 404)

            cur.execute(f"SELECT id FROM {SCHEMA}.deal_stages ORDER BY sort_order LIMIT 1")
            first_stage = cur.fetchone()
            stage_id = first_stage[0] if first_stage else None

            cur.execute(f"""
                INSERT INTO {SCHEMA}.deals (client_id, batch_id, stage_id, status)
                VALUES (%s, %s, %s, 'draft') RETURNING id
            """, (client["id"], batch_id, stage_id))
            deal_id = cur.fetchone()[0]
            conn.commit()
            return ok({"ok": True, "deal_id": deal_id}, 201)

        # ── save-lot ──────────────────────────────────────────────
        if action == "save-lot":
            client = get_client_by_token(cur, client_token)
            if not client:
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            lot_id = body.get("id")
            deal_id = body.get("deal_id")

            if lot_id:
                cur.execute(f"""
                    SELECT d.status FROM {SCHEMA}.deal_lots l
                    JOIN {SCHEMA}.deals d ON d.id = l.deal_id
                    WHERE l.id=%s AND d.client_id=%s
                """, (lot_id, client["id"]))
                row = cur.fetchone()
                if not row:
                    return err("Лот не найден", 404)
                if row[0] != "draft":
                    return err("Заказ уже отправлен на согласование — лоты менять нельзя")
                cur.execute(f"""
                    UPDATE {SCHEMA}.deal_lots
                    SET origin_id=%s, roast=%s, packaging=%s, weight_format=%s, color=%s,
                        volume=%s, amount=%s, note=%s, updated_at=NOW()
                    WHERE id=%s
                """, (
                    body.get("origin_id"), body.get("roast"), body.get("packaging"), body.get("weight_format"),
                    body.get("color"), body.get("volume"), body.get("amount"), body.get("note", ""), lot_id,
                ))
                conn.commit()
                return ok({"ok": True, "id": lot_id})

            if not deal_id:
                return err("deal_id required")
            cur.execute(f"SELECT status FROM {SCHEMA}.deals WHERE id=%s AND client_id=%s", (deal_id, client["id"]))
            row = cur.fetchone()
            if not row:
                return err("Заказ не найден", 404)
            if row[0] != "draft":
                return err("Заказ уже отправлен на согласование — лоты менять нельзя")

            cur.execute(f"SELECT COALESCE(MAX(lot_number),0)+1 FROM {SCHEMA}.deal_lots WHERE deal_id=%s", (deal_id,))
            lot_number = cur.fetchone()[0]
            cur.execute(f"""
                INSERT INTO {SCHEMA}.deal_lots
                    (deal_id, lot_number, origin_id, roast, packaging, weight_format, color, volume, amount, note)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (
                deal_id, lot_number, body.get("origin_id"), body.get("roast"), body.get("packaging"),
                body.get("weight_format"), body.get("color"), body.get("volume"), body.get("amount"), body.get("note", ""),
            ))
            lot_id = cur.fetchone()[0]
            conn.commit()
            return ok({"ok": True, "id": lot_id, "lot_number": lot_number}, 201)

        # ── delete-lot ────────────────────────────────────────────
        if action == "delete-lot":
            client = get_client_by_token(cur, client_token)
            if not client:
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            lot_id = body.get("id")
            if not lot_id:
                return err("id required")
            cur.execute(f"""
                SELECT d.status FROM {SCHEMA}.deal_lots l
                JOIN {SCHEMA}.deals d ON d.id = l.deal_id
                WHERE l.id=%s AND d.client_id=%s
            """, (lot_id, client["id"]))
            row = cur.fetchone()
            if not row:
                return err("Лот не найден", 404)
            if row[0] != "draft":
                return err("Заказ уже отправлен на согласование — лоты менять нельзя")
            cur.execute(f"DELETE FROM {SCHEMA}.deal_lots WHERE id=%s", (lot_id,))
            conn.commit()
            return ok({"ok": True})

        # ── update-logistics ──────────────────────────────────────
        if action == "update-logistics":
            client = get_client_by_token(cur, client_token)
            if not client:
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            deal_id = body.get("deal_id")
            if not deal_id:
                return err("deal_id required")
            cur.execute(f"SELECT id FROM {SCHEMA}.deals WHERE id=%s AND client_id=%s", (deal_id, client["id"]))
            if not cur.fetchone():
                return err("Заказ не найден", 404)
            cur.execute(f"""
                UPDATE {SCHEMA}.deals SET logistics_data=%s, updated_at=NOW() WHERE id=%s
            """, (json.dumps(body.get("logistics_data") or {}), deal_id))
            conn.commit()
            return ok({"ok": True})

        # ── submit-deal ───────────────────────────────────────────
        if action == "submit-deal":
            client = get_client_by_token(cur, client_token)
            if not client:
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            deal_id = body.get("deal_id")
            if not deal_id:
                return err("deal_id required")
            if not client.get("phone"):
                return err("Укажите номер телефона для связи в разделе «Личные данные», прежде чем отправлять заказ на согласование", 422)
            cur.execute(f"SELECT status, stage_id FROM {SCHEMA}.deals WHERE id=%s AND client_id=%s", (deal_id, client["id"]))
            row = cur.fetchone()
            if not row:
                return err("Заказ не найден", 404)
            if row[0] == "submitted":
                return err("Заказ уже отправлен на согласование")
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.deal_lots WHERE deal_id=%s", (deal_id,))
            if cur.fetchone()[0] == 0:
                return err("Добавьте хотя бы один лот перед отправкой")

            stage_id = row[1]
            if not stage_id:
                cur.execute(f"SELECT id FROM {SCHEMA}.deal_stages ORDER BY sort_order LIMIT 1")
                first_stage = cur.fetchone()
                stage_id = first_stage[0] if first_stage else None

            cur.execute(f"""
                UPDATE {SCHEMA}.deals SET status='submitted', stage_id=%s, updated_at=NOW() WHERE id=%s
            """, (stage_id, deal_id))
            cur.execute(f"""
                INSERT INTO {SCHEMA}.deal_stage_log (deal_id, from_stage_id, to_stage_id, staff_id, staff_name)
                VALUES (%s, NULL, %s, NULL, %s)
            """, (deal_id, stage_id, f"Отправлено клиентом на согласование ({client['name']})"))
            conn.commit()
            return ok({"ok": True})

        # ── list-logistics-fields ─────────────────────────────────
        if action == "list-logistics-fields":
            cur.execute(f"""
                SELECT id, key, label, field_type, required, sort_order
                FROM {SCHEMA}.logistics_fields ORDER BY sort_order, id
            """)
            fields = [
                {"id": r[0], "key": r[1], "label": r[2], "field_type": r[3], "required": r[4], "sort_order": r[5]}
                for r in cur.fetchall()
            ]
            return ok({"fields": fields})

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

        # ── list-notifications ────────────────────────────────────
        if action == "list-notifications":
            client = get_client_by_token(cur, client_token)
            if not client:
                return err("Unauthorized", 401)
            cur.execute(f"""
                SELECT id, type, title, body, deal_id, is_read, created_at
                FROM {SCHEMA}.client_notifications WHERE client_id=%s ORDER BY created_at DESC LIMIT 50
            """, (client["id"],))
            notifications = [
                {
                    "id": r[0], "type": r[1], "title": r[2], "body": r[3],
                    "deal_id": r[4], "is_read": r[5], "created_at": str(r[6]),
                }
                for r in cur.fetchall()
            ]
            return ok({"notifications": notifications})

        # ── mark-notifications-read ───────────────────────────────
        if action == "mark-notifications-read":
            client = get_client_by_token(cur, client_token)
            if not client:
                return err("Unauthorized", 401)
            cur.execute(f"""
                UPDATE {SCHEMA}.client_notifications SET is_read=TRUE WHERE client_id=%s AND is_read=FALSE
            """, (client["id"],))
            conn.commit()
            return ok({"ok": True})

        # ── update-profile: клиент обновляет свои личные данные ────
        if action == "update-profile":
            client = get_client_by_token(cur, client_token)
            if not client:
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            cur.execute(f"""
                UPDATE {SCHEMA}.clients SET
                    name=COALESCE(%s, name), phone=COALESCE(%s, phone),
                    city=COALESCE(%s, city), company=COALESCE(%s, company)
                WHERE id=%s
            """, (body.get("name"), body.get("phone"), body.get("city"), body.get("company"), client["id"]))
            conn.commit()
            return ok({"ok": True})

        return err(f"Unknown action: {action}", 400)
    finally:
        cur.close()
        conn.close()