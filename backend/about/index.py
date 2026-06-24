"""
API для блока 'О компании'.
Роутинг через заголовок X-Action (URL path недоступен на платформе).

X-Action значения:
  get-content      — GET публичное чтение (без авторизации)
  save-texts       — PUT сохранить тексты
  presign-logo     — GET presigned URL для логотипа
  presign-photo    — GET presigned URL для фото
  confirm-logo     — POST сохранить URL логотипа в БД
  confirm-photo    — POST сохранить URL фото в БД
  delete-photo     — DELETE удалить фото (X-Photo-Id в заголовке)
"""
import json
import os
import uuid
import base64
import psycopg2
import boto3
from botocore.config import Config

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key, X-Action, X-Photo-Id",
}
SCHEMA      = "t_p21475602_quantum_innovation_l"
ADMIN_KEY   = os.environ.get("ABOUT_ADMIN_KEY", "kontraktkafe-admin-2024")
AWS_KEY     = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SEC     = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
CDN_BASE    = f"https://cdn.poehali.dev/projects/{AWS_KEY}/bucket"
S3_ENDPOINT = "https://bucket.poehali.dev"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=AWS_KEY,
        aws_secret_access_key=AWS_SEC,
        config=Config(signature_version="s3v4"),
    )


def ok(body, status=200):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False)}


def err(msg, status=400):
    return {"statusCode": status, "headers": CORS, "body": json.dumps({"error": msg})}


def check_admin(headers: dict) -> bool:
    key = headers.get("x-admin-key", "")
    return key == ADMIN_KEY


def handler(event: dict, context) -> dict:
    """Обработчик API блока 'О компании'."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    action  = headers.get("x-action", "get-content")

    conn = get_conn()
    cur  = conn.cursor()

    try:
        # ── get-content: публичное чтение ────────────────────────
        if action == "get-content":
            cur.execute(f"""
                SELECT title, subtitle, bottom_text, logo_url
                FROM {SCHEMA}.about_content ORDER BY id DESC LIMIT 1
            """)
            row     = cur.fetchone()
            content = {"title": row[0], "subtitle": row[1], "bottom_text": row[2], "logo_url": row[3]} if row else {}
            cur.execute(f"""
                SELECT id, url, label, description, sort_order
                FROM {SCHEMA}.about_photos ORDER BY sort_order, id
            """)
            photos = [
                {"id": r[0], "url": r[1], "label": r[2], "description": r[3], "sort_order": r[4]}
                for r in cur.fetchall()
            ]
            return ok({"content": content, "photos": photos})

        # ── save-texts: обновить тексты ──────────────────────────
        if action == "save-texts":
            if not check_admin(headers):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            cur.execute(f"""
                UPDATE {SCHEMA}.about_content
                SET title=%s, subtitle=%s, bottom_text=%s, updated_at=NOW()
                WHERE id=(SELECT id FROM {SCHEMA}.about_content ORDER BY id DESC LIMIT 1)
            """, (body.get("title"), body.get("subtitle"), body.get("bottom_text")))
            conn.commit()
            return ok({"ok": True})

        # ── upload-logo: принять base64, залить в S3, сохранить URL ─
        if action == "upload-logo":
            if not check_admin(headers):
                return err("Unauthorized", 401)
            body    = json.loads(event.get("body") or "{}")
            b64     = body.get("file_base64", "")
            if not b64:
                return err("file_base64 required")
            data    = base64.b64decode(b64)
            s3_key  = "brand/logo.png"
            get_s3().put_object(Bucket="files", Key=s3_key, Body=data, ContentType="image/png")
            logo_url = f"{CDN_BASE}/{s3_key}?v={uuid.uuid4().hex[:6]}"
            cur.execute(f"""
                UPDATE {SCHEMA}.about_content
                SET logo_url=%s, updated_at=NOW()
                WHERE id=(SELECT id FROM {SCHEMA}.about_content ORDER BY id DESC LIMIT 1)
            """, (logo_url,))
            conn.commit()
            return ok({"logo_url": logo_url, "ok": True})

        # ── upload-photo: принять base64, залить в S3, сохранить запись ─
        if action == "upload-photo":
            if not check_admin(headers):
                return err("Unauthorized", 401)
            body  = json.loads(event.get("body") or "{}")
            b64   = body.get("file_base64", "")
            if not b64:
                return err("file_base64 required")
            data     = base64.b64decode(b64)
            s3_key   = f"photos/{uuid.uuid4()}.jpg"
            get_s3().put_object(Bucket="files", Key=s3_key, Body=data, ContentType="image/jpeg")
            cdn_url  = f"{CDN_BASE}/{s3_key}"
            cur.execute(f"""
                INSERT INTO {SCHEMA}.about_photos (url, label, description, sort_order)
                VALUES (%s, %s, %s, (SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.about_photos))
                RETURNING id
            """, (cdn_url, body.get("label", ""), body.get("description", "")))
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({"id": new_id, "cdn_url": cdn_url, "ok": True}, 201)

        # ── add-photo-url: добавить фото по внешнему URL ─────────
        if action == "add-photo-url":
            if not check_admin(headers):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.about_photos (url, label, description, sort_order)
                VALUES (%s, %s, %s, (SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.about_photos))
                RETURNING id
            """, (body["url"], body.get("label", ""), body.get("description", "")))
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({"id": new_id, "ok": True}, 201)

        # ── delete-photo: удалить фото ────────────────────────────
        if action == "delete-photo":
            if not check_admin(headers):
                return err("Unauthorized", 401)
            photo_id = int(headers.get("x-photo-id", "0"))
            if not photo_id:
                return err("x-photo-id required")
            cur.execute(f"SELECT url FROM {SCHEMA}.about_photos WHERE id=%s", (photo_id,))
            row = cur.fetchone()
            if row:
                photo_url = row[0]
                if CDN_BASE in photo_url:
                    s3_key = photo_url.replace(f"{CDN_BASE}/", "").split("?")[0]
                    try:
                        get_s3().delete_object(Bucket="files", Key=s3_key)
                    except Exception:
                        pass
            cur.execute(f"DELETE FROM {SCHEMA}.about_photos WHERE id=%s", (photo_id,))
            conn.commit()
            return ok({"ok": True})

        # ── get-rate: получить курс доллара ──────────────────────
        if action == "get-rate":
            cur.execute(f"SELECT value, updated_at FROM {SCHEMA}.site_settings WHERE key='usd_rate'")
            row = cur.fetchone()
            if row:
                return ok({"rate": float(row[0]), "updated_at": str(row[1])})
            return ok({"rate": None, "updated_at": None})

        # ── save-rate: сохранить курс доллара ─────────────────────
        if action == "save-rate":
            if not check_admin(headers):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            rate = body.get("rate")
            if rate is None:
                return err("rate required")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.site_settings (key, value, updated_at)
                VALUES ('usd_rate', %s, NOW())
                ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()
            """, (str(float(rate)),))
            conn.commit()
            return ok({"ok": True, "rate": float(rate)})

        return err(f"Unknown action: {action}", 400)

    finally:
        cur.close()
        conn.close()