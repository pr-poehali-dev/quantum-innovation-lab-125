"""
API документов: публичное чтение, загрузка/удаление через админку.
GET  /         — список документов (публично)
POST /upload   — загрузить файл base64 → S3 → сохранить в БД (admin)
PUT  /{id}     — обновить метаданные (admin)
DELETE /{id}   — удалить документ + файл из S3 (admin)
PUT  /reorder  — изменить порядок (admin)
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
SCHEMA    = os.environ.get("MAIN_DB_SCHEMA", "t_p21475602_quantum_innovation_l")
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
    path    = event.get("path", "/").rstrip("/")
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}

    conn = get_conn()
    cur  = conn.cursor()

    try:
        # ── GET / — публичный список ───────────────────────────────
        if method == "GET" and path in ("", "/"):
            cur.execute(f"""
                SELECT id, title, description, category, file_url, file_name, file_size_kb, sort_order
                FROM {SCHEMA}.documents
                WHERE is_visible = true
                ORDER BY sort_order, id
            """)
            docs = [
                {
                    "id": r[0], "title": r[1], "description": r[2],
                    "category": r[3], "file_url": r[4], "file_name": r[5],
                    "file_size_kb": r[6], "sort_order": r[7],
                }
                for r in cur.fetchall()
            ]
            return ok({"documents": docs})

        # ── GET /all — все документы для админки ─────────────────
        if method == "GET" and path.endswith("/all"):
            if not check_admin(headers):
                return err("Unauthorized", 401)
            cur.execute(f"""
                SELECT id, title, description, category, file_url, file_name, file_size_kb, sort_order, is_visible
                FROM {SCHEMA}.documents ORDER BY sort_order, id
            """)
            docs = [
                {
                    "id": r[0], "title": r[1], "description": r[2],
                    "category": r[3], "file_url": r[4], "file_name": r[5],
                    "file_size_kb": r[6], "sort_order": r[7], "is_visible": r[8],
                }
                for r in cur.fetchall()
            ]
            return ok({"documents": docs})

        # ── POST /upload — загрузить файл + создать запись ───────
        if method == "POST" and path.endswith("/upload"):
            if not check_admin(headers):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")

            title       = body.get("title", "Документ")
            description = body.get("description", "")
            category    = body.get("category", "other")
            file_name   = body.get("file_name", "document.pdf")
            file_b64    = body.get("file_base64", "")

            if not file_b64:
                # Если нет файла — просто ссылка
                file_url = body.get("file_url", "#")
                file_size = 0
            else:
                # Декодируем и заливаем в S3
                file_data = base64.b64decode(file_b64)
                file_size = len(file_data) // 1024
                ext       = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "pdf"
                s3_key    = f"documents/{uuid.uuid4()}.{ext}"
                content_types = {
                    "pdf": "application/pdf",
                    "doc": "application/msword",
                    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
                }
                ct = content_types.get(ext, "application/octet-stream")
                get_s3().put_object(Bucket="files", Key=s3_key, Body=file_data, ContentType=ct)
                file_url = f"{CDN_BASE}/{s3_key}"

            cur.execute(f"""
                INSERT INTO {SCHEMA}.documents
                  (title, description, category, file_url, file_name, file_size_kb, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s,
                  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM {SCHEMA}.documents))
                RETURNING id
            """, (title, description, category, file_url, file_name, file_size))
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({"id": new_id, "file_url": file_url, "ok": True}, 201)

        # ── PUT /{id} — обновить метаданные ──────────────────────
        if method == "PUT" and path not in ("", "/", "/reorder"):
            if not check_admin(headers):
                return err("Unauthorized", 401)
            doc_id = int(path.split("/")[-1])
            body   = json.loads(event.get("body") or "{}")
            cur.execute(f"""
                UPDATE {SCHEMA}.documents
                SET title=%s, description=%s, category=%s, is_visible=%s, updated_at=NOW()
                WHERE id=%s
            """, (body.get("title"), body.get("description"),
                  body.get("category"), body.get("is_visible", True), doc_id))
            conn.commit()
            return ok({"ok": True})

        # ── PUT /reorder — порядок ────────────────────────────────
        if method == "PUT" and path.endswith("/reorder"):
            if not check_admin(headers):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            for item in body.get("order", []):
                cur.execute(f"UPDATE {SCHEMA}.documents SET sort_order=%s WHERE id=%s",
                            (item["sort_order"], item["id"]))
            conn.commit()
            return ok({"ok": True})

        # ── DELETE /{id} — удалить ────────────────────────────────
        if method == "DELETE":
            if not check_admin(headers):
                return err("Unauthorized", 401)
            doc_id = int(path.split("/")[-1])
            cur.execute(f"SELECT file_url FROM {SCHEMA}.documents WHERE id=%s", (doc_id,))
            row = cur.fetchone()
            if row:
                file_url = row[0]
                # Удаляем из S3 если это наш файл
                if CDN_BASE in file_url and "documents/" in file_url:
                    s3_key = "documents/" + file_url.split("documents/")[-1]
                    try:
                        get_s3().delete_object(Bucket="files", Key=s3_key)
                    except Exception:
                        pass
                cur.execute(f"DELETE FROM {SCHEMA}.documents WHERE id=%s", (doc_id,))
                conn.commit()
            return ok({"ok": True})

        return err("Not found", 404)

    finally:
        cur.close()
        conn.close()
