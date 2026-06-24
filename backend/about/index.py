"""
API для блока 'О компании'.
GET  /              — публичное чтение контента и фото
PUT  /              — обновить тексты (admin)
GET  /presign?key=  — получить presigned URL для прямой загрузки файла в S3 (admin)
POST /confirm-logo  — сохранить URL логотипа в БД после прямой загрузки (admin)
POST /confirm-photo — добавить запись фото после прямой загрузки (admin)
POST /photos        — добавить фото по внешнему URL (admin)
DELETE /photos/{id} — удалить фото (admin)
PUT  /photos/reorder — изменить порядок (admin)
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
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
}
SCHEMA    = "t_p21475602_quantum_innovation_l"
ADMIN_KEY = os.environ.get("ABOUT_ADMIN_KEY", "kontraktkafe-admin-2024")
AWS_KEY   = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SEC   = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
CDN_BASE  = f"https://cdn.poehali.dev/projects/{AWS_KEY}/bucket"
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
    key = headers.get("x-admin-key") or headers.get("X-Admin-Key") or ""
    return key == ADMIN_KEY


def get_suffix(event: dict) -> str:
    raw_url = event.get("url", "") or ""
    parts   = raw_url.split("?")[0].split("/")
    # URL: https://functions.poehali.dev/{func-id}/suffix
    suffix  = ("/" + "/".join(parts[3:])).rstrip("/") or "/"
    return suffix


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method  = event.get("httpMethod", "GET")
    suffix  = get_suffix(event)
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    params  = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur  = conn.cursor()

    try:
        # ── GET / — публичное чтение ───────────────────────────
        if method == "GET" and suffix == "/":
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

        # ── PUT / — обновить тексты ───────────────────────────
        if method == "PUT" and suffix == "/":
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

        # ── GET /presign — presigned URL для прямой загрузки в S3 ──
        if method == "GET" and suffix == "/presign":
            if not check_admin(headers):
                return err("Unauthorized", 401)

            # key: "logo" или "photo"
            file_type = params.get("type", "photo")
            ext       = params.get("ext", "png").lower()

            if file_type == "logo":
                s3_key = "brand/logo.png"
            else:
                s3_key = f"photos/{uuid.uuid4()}.{ext}"

            content_type_map = {
                "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
                "gif": "image/gif", "webp": "image/webp",
            }
            content_type = content_type_map.get(ext, "image/png")

            presigned = get_s3().generate_presigned_url(
                "put_object",
                Params={"Bucket": "files", "Key": s3_key, "ContentType": content_type},
                ExpiresIn=300,  # 5 минут
            )
            cdn_url = f"{CDN_BASE}/{s3_key}?v={uuid.uuid4().hex[:6]}"
            return ok({"upload_url": presigned, "cdn_url": cdn_url, "s3_key": s3_key})

        # ── POST /confirm-logo — сохранить URL логотипа в БД ──────
        if method == "POST" and suffix == "/confirm-logo":
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

        # ── POST /confirm-photo — сохранить фото в БД после загрузки ─
        if method == "POST" and suffix == "/confirm-photo":
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

        # ── POST /photos — добавить фото по внешнему URL ─────────
        if method == "POST" and suffix == "/photos":
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

        # ── DELETE /photos/{id} ───────────────────────────────
        if method == "DELETE" and suffix.startswith("/photos/"):
            if not check_admin(headers):
                return err("Unauthorized", 401)
            photo_id = int(suffix.split("/photos/")[-1])
            cur.execute(f"SELECT url FROM {SCHEMA}.about_photos WHERE id=%s", (photo_id,))
            row = cur.fetchone()
            if row:
                photo_url = row[0]
                # Удаляем из S3 если это наш CDN
                if CDN_BASE in photo_url:
                    s3_key = photo_url.replace(f"{CDN_BASE}/", "").split("?")[0]
                    try:
                        get_s3().delete_object(Bucket="files", Key=s3_key)
                    except Exception:
                        pass
            cur.execute(f"DELETE FROM {SCHEMA}.about_photos WHERE id=%s", (photo_id,))
            conn.commit()
            return ok({"ok": True})

        # ── PUT /photos/reorder ───────────────────────────────
        if method == "PUT" and suffix == "/photos/reorder":
            if not check_admin(headers):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            for item in body.get("order", []):
                cur.execute(f"UPDATE {SCHEMA}.about_photos SET sort_order=%s WHERE id=%s",
                            (item["sort_order"], item["id"]))
            conn.commit()
            return ok({"ok": True})

        return err(f"Not found: {method} {suffix}", 404)

    finally:
        cur.close()
        conn.close()
