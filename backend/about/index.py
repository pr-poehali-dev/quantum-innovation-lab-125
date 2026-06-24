"""
API для блока 'О компании': чтение и редактирование текстов, логотипа и фото.
GET  / — получить контент (публичный)
PUT  / — обновить тексты (требует X-Admin-Key)
POST /logo — загрузить PNG-логотип в S3 (требует X-Admin-Key)
POST /photos — добавить фото (URL + label + desc)
DELETE /photos/{id} — удалить фото
PUT /photos/reorder — изменить порядок
"""
import json
import os
import base64
import uuid
import psycopg2
import boto3

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
    return {"statusCode": status, "headers": CORS, "body": json.dumps({"error": msg})}


def check_admin(headers: dict) -> bool:
    key = headers.get("x-admin-key") or headers.get("X-Admin-Key") or ""
    return key == ADMIN_KEY


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method  = event.get("httpMethod", "GET")
    # Платформа передаёт путь через 'url', поле 'path' всегда пустое
    raw_url = event.get("url", "") or ""
    # Берём только pathname — всё после домена, убираем query string
    path = raw_url.split("?")[0]
    # Убираем базовый префикс функции (всё до третьего '/')
    # URL вида: https://functions.poehali.dev/{function-id}/logo
    parts = path.split("/")
    # parts: ['', 'function-id', 'logo'] → нам нужен суффикс после id
    suffix = "/" + "/".join(parts[2:]) if len(parts) > 2 else "/"
    suffix = suffix.rstrip("/") or "/"
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}

    conn = get_conn()
    cur  = conn.cursor()

    try:
        # ── GET / — публичное чтение ───────────────────────────
        if method == "GET" and suffix == "/":
            cur.execute(f"SELECT title, subtitle, bottom_text, logo_url FROM {SCHEMA}.about_content ORDER BY id DESC LIMIT 1")
            row = cur.fetchone()
            content = {"title": row[0], "subtitle": row[1], "bottom_text": row[2], "logo_url": row[3]} if row else {}

            cur.execute(f"SELECT id, url, label, description, sort_order FROM {SCHEMA}.about_photos ORDER BY sort_order, id")
            photos = [{"id": r[0], "url": r[1], "label": r[2], "description": r[3], "sort_order": r[4]} for r in cur.fetchall()]

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

        # ── POST /logo — загрузить PNG-логотип в S3 ──────────
        if method == "POST" and suffix == "/logo":
            if not check_admin(headers):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            file_b64 = body.get("file_base64", "")
            if not file_b64:
                return err("file_base64 is required")

            file_data = base64.b64decode(file_b64)
            s3_key = "brand/logo.png"
            get_s3().put_object(
                Bucket="files",
                Key=s3_key,
                Body=file_data,
                ContentType="image/png",
            )
            logo_url = f"{CDN_BASE}/{s3_key}?v={uuid.uuid4().hex[:8]}"

            cur.execute(f"""
                UPDATE {SCHEMA}.about_content
                SET logo_url=%s, updated_at=NOW()
                WHERE id=(SELECT id FROM {SCHEMA}.about_content ORDER BY id DESC LIMIT 1)
            """, (logo_url,))
            conn.commit()
            return ok({"logo_url": logo_url, "ok": True})

        # ── POST /photos — добавить фото ─────────────────────
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

        # ── DELETE /photos/{id} ──────────────────────────────
        if method == "DELETE" and suffix.startswith("/photos/"):
            if not check_admin(headers):
                return err("Unauthorized", 401)
            photo_id = int(suffix.split("/photos/")[-1])
            cur.execute(f"DELETE FROM {SCHEMA}.about_photos WHERE id=%s", (photo_id,))
            conn.commit()
            return ok({"ok": True})

        # ── PUT /photos/reorder — порядок ────────────────────
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