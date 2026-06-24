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

        # ── presign-logo: presigned URL для логотипа ─────────────
        if action == "presign-logo":
            if not check_admin(headers):
                return err("Unauthorized", 401)
            s3_key       = "brand/logo.png"
            content_type = "image/png"
            upload_url   = get_s3().generate_presigned_url(
                "put_object",
                Params={"Bucket": "files", "Key": s3_key, "ContentType": content_type},
                ExpiresIn=300,
            )
            cdn_url = f"{CDN_BASE}/{s3_key}?v={uuid.uuid4().hex[:6]}"
            return ok({"upload_url": upload_url, "cdn_url": cdn_url})

        # ── presign-photo: presigned URL для фото производства ───
        if action == "presign-photo":
            if not check_admin(headers):
                return err("Unauthorized", 401)
            body         = json.loads(event.get("body") or "{}")
            ext          = body.get("ext", "jpg").lower()
            s3_key       = f"photos/{uuid.uuid4()}.{ext}"
            ct_map       = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp"}
            content_type = ct_map.get(ext, "image/jpeg")
            upload_url   = get_s3().generate_presigned_url(
                "put_object",
                Params={"Bucket": "files", "Key": s3_key, "ContentType": content_type},
                ExpiresIn=300,
            )
            cdn_url = f"{CDN_BASE}/{s3_key}"
            return ok({"upload_url": upload_url, "cdn_url": cdn_url, "content_type": content_type})

        # ── confirm-logo: сохранить URL логотипа в БД ────────────
        if action == "confirm-logo":
            if not check_admin(headers):
                return err("Unauthorized", 401)
            body     = json.loads(event.get("body") or "{}")
            logo_url = body.get("cdn_url", "")
            if not logo_url:
                return err("cdn_url required")
            cur.execute(f"""
                UPDATE {SCHEMA}.about_content
                SET logo_url=%s, updated_at=NOW()
                WHERE id=(SELECT id FROM {SCHEMA}.about_content ORDER BY id DESC LIMIT 1)
            """, (logo_url,))
            conn.commit()
            return ok({"logo_url": logo_url, "ok": True})

        # ── confirm-photo: добавить запись фото в БД ─────────────
        if action == "confirm-photo":
            if not check_admin(headers):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.about_photos (url, label, description, sort_order)
                VALUES (%s, %s, %s, (SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.about_photos))
                RETURNING id
            """, (body["cdn_url"], body.get("label", ""), body.get("description", "")))
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({"id": new_id, "ok": True}, 201)

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

        return err(f"Unknown action: {action}", 400)

    finally:
        cur.close()
        conn.close()
