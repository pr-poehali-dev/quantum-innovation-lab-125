"""
API документов и их категорий. Роутинг через заголовок X-Action (URL-суффиксы на этой платформе ненадёжны).

X-Action значения:
  list             — GET список видимых документов (публично)
  list-all         — GET все документы для админки (владелец, менеджер)
  upload           — POST загрузить файл base64 → S3 → создать запись (владелец, менеджер)
  update           — PUT обновить метаданные документа: id, title, description, category, is_visible (владелец, менеджер)
  delete           — DELETE удалить документ + файл из S3: X-Doc-Id (владелец, менеджер)
  reorder          — PUT изменить порядок документов: order=[{id, sort_order}] (владелец, менеджер)
  list-categories  — GET список категорий (публично)
  create-category  — POST создать категорию: key, label, icon (только владелец)
  update-category  — PUT переименовать/сменить иконку категории: id, label, icon (только владелец)
  delete-category  — DELETE удалить категорию: X-Category-Id, только если в ней нет документов (только владелец)
  reorder-categories — PUT изменить порядок категорий: order=[{id, sort_order}] (только владелец)

Авторизация редактирования — X-Staff-Token (сессия сотрудника с ролью owner/manager).
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
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key, X-Staff-Token, X-Action, X-Doc-Id, X-Category-Id",
}
SCHEMA    = os.environ.get("MAIN_DB_SCHEMA", "t_p21475602_quantum_innovation_l")
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


def get_role(cur, headers: dict):
    token = headers.get("x-staff-token") or headers.get("X-Staff-Token") or ""
    if not token:
        return None
    cur.execute(f"""
        SELECT COALESCE(ss.preview_role, s.role) FROM {SCHEMA}.staff_sessions ss
        JOIN {SCHEMA}.staff_users s ON s.id = ss.staff_id
        WHERE ss.token=%s AND ss.expires_at > NOW() AND s.active=TRUE
    """, (token,))
    row = cur.fetchone()
    return row[0] if row else None


def check_admin(cur, headers: dict) -> bool:
    return get_role(cur, headers) in ("owner", "manager")


def check_owner(cur, headers: dict) -> bool:
    return get_role(cur, headers) == "owner"


def handler(event: dict, context) -> dict:
    """Обработчик документов и категорий документов."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    action = headers.get("x-action", "list")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ── list: публичный список видимых документов ────────────
        if action == "list":
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

        # ── list-all: все документы для админки ───────────────────
        if action == "list-all":
            if not check_admin(cur, headers):
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

        # ── list-categories: список категорий (публично) ─────────
        if action == "list-categories":
            cur.execute(f"""
                SELECT id, key, label, icon, sort_order
                FROM {SCHEMA}.document_categories ORDER BY sort_order, id
            """)
            categories = [
                {"id": r[0], "key": r[1], "label": r[2], "icon": r[3], "sort_order": r[4]}
                for r in cur.fetchall()
            ]
            return ok({"categories": categories})

        # ── create-category: создать категорию (владелец) ────────
        if action == "create-category":
            if not check_owner(cur, headers):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            key = (body.get("key") or "").strip().lower().replace(" ", "_")
            label = (body.get("label") or "").strip()
            icon = body.get("icon") or "Folder"
            if not key or not label:
                return err("key and label required")
            cur.execute(f"SELECT id FROM {SCHEMA}.document_categories WHERE key=%s", (key,))
            if cur.fetchone():
                return err("Категория с таким ключом уже существует")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.document_categories (key, label, icon, sort_order)
                VALUES (%s, %s, %s, (SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.document_categories))
                RETURNING id
            """, (key, label, icon))
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({"id": new_id, "ok": True}, 201)

        # ── update-category: переименовать категорию ──────────────
        if action == "update-category":
            if not check_owner(cur, headers):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            cat_id = body.get("id")
            if not cat_id:
                return err("id required")
            cur.execute(f"""
                UPDATE {SCHEMA}.document_categories SET label=%s, icon=%s WHERE id=%s
            """, (body.get("label"), body.get("icon", "Folder"), cat_id))
            conn.commit()
            return ok({"ok": True})

        # ── delete-category: удалить категорию ────────────────────
        if action == "delete-category":
            if not check_owner(cur, headers):
                return err("Unauthorized", 401)
            cat_id = int(headers.get("x-category-id", "0"))
            if not cat_id:
                return err("X-Category-Id required")
            cur.execute(f"SELECT key FROM {SCHEMA}.document_categories WHERE id=%s", (cat_id,))
            row = cur.fetchone()
            if not row:
                return err("Категория не найдена", 404)
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.documents WHERE category=%s", (row[0],))
            if cur.fetchone()[0] > 0:
                return err("Нельзя удалить категорию — в ней есть документы")
            cur.execute(f"DELETE FROM {SCHEMA}.document_categories WHERE id=%s", (cat_id,))
            conn.commit()
            return ok({"ok": True})

        # ── reorder-categories: порядок категорий ─────────────────
        if action == "reorder-categories":
            if not check_owner(cur, headers):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            for item in body.get("order", []):
                cur.execute(f"UPDATE {SCHEMA}.document_categories SET sort_order=%s WHERE id=%s",
                            (item["sort_order"], item["id"]))
            conn.commit()
            return ok({"ok": True})

        # ── upload: загрузить файл + создать запись ───────────────
        if action == "upload":
            if not check_admin(cur, headers):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")

            title       = body.get("title", "Документ")
            description = body.get("description", "")
            category    = body.get("category", "other")
            file_name   = body.get("file_name", "document.pdf")
            file_b64    = body.get("file_base64", "")

            if not file_b64:
                file_url  = body.get("file_url", "#")
                file_size = 0
            else:
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

        # ── reorder: порядок документов ────────────────────────────
        if action == "reorder":
            if not check_admin(cur, headers):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            for item in body.get("order", []):
                cur.execute(f"UPDATE {SCHEMA}.documents SET sort_order=%s WHERE id=%s",
                            (item["sort_order"], item["id"]))
            conn.commit()
            return ok({"ok": True})

        # ── update: обновить метаданные документа ──────────────────
        if action == "update":
            if not check_admin(cur, headers):
                return err("Unauthorized", 401)
            body   = json.loads(event.get("body") or "{}")
            doc_id = body.get("id")
            if not doc_id:
                return err("id required")
            cur.execute(f"""
                UPDATE {SCHEMA}.documents
                SET title=%s, description=%s, category=%s, is_visible=%s, updated_at=NOW()
                WHERE id=%s
            """, (body.get("title"), body.get("description"),
                  body.get("category"), body.get("is_visible", True), doc_id))
            conn.commit()
            return ok({"ok": True})

        # ── delete: удалить документ ────────────────────────────────
        if action == "delete":
            if not check_admin(cur, headers):
                return err("Unauthorized", 401)
            doc_id = int(headers.get("x-doc-id", "0"))
            if not doc_id:
                return err("X-Doc-Id required")
            cur.execute(f"SELECT file_url FROM {SCHEMA}.documents WHERE id=%s", (doc_id,))
            row = cur.fetchone()
            if row:
                file_url = row[0]
                if CDN_BASE in file_url and "documents/" in file_url:
                    s3_key = "documents/" + file_url.split("documents/")[-1].split("?")[0]
                    try:
                        get_s3().delete_object(Bucket="files", Key=s3_key)
                    except Exception:
                        pass
                cur.execute(f"DELETE FROM {SCHEMA}.documents WHERE id=%s", (doc_id,))
                conn.commit()
            return ok({"ok": True})

        return err(f"Unknown action: {action}", 400)

    finally:
        cur.close()
        conn.close()
