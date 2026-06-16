"""
API для блока 'О компании': чтение и редактирование текстов и фото.
GET  / — получить контент (публичный)
PUT  / — обновить тексты (требует X-Admin-Key)
POST /photos — добавить фото (URL + label + desc)
DELETE /photos/{id} — удалить фото
PUT /photos/reorder — изменить порядок
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
}
SCHEMA = "t_p21475602_quantum_innovation_l"
ADMIN_KEY = os.environ.get("ABOUT_ADMIN_KEY", "kontraktkafe-admin-2024")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


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

    method = event.get("httpMethod", "GET")
    path   = event.get("path", "/").rstrip("/")
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}

    conn = get_conn()
    cur  = conn.cursor()

    try:
        # ── GET / — публичное чтение ───────────────────────────
        if method == "GET" and path in ("", "/"):
            cur.execute(f"SELECT title, subtitle, bottom_text FROM {SCHEMA}.about_content ORDER BY id DESC LIMIT 1")
            row = cur.fetchone()
            content = {"title": row[0], "subtitle": row[1], "bottom_text": row[2]} if row else {}

            cur.execute(f"SELECT id, url, label, description, sort_order FROM {SCHEMA}.about_photos ORDER BY sort_order, id")
            photos = [{"id": r[0], "url": r[1], "label": r[2], "description": r[3], "sort_order": r[4]} for r in cur.fetchall()]

            return ok({"content": content, "photos": photos})

        # ── PUT / — обновить тексты ───────────────────────────
        if method == "PUT" and path in ("", "/"):
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

        # ── POST /photos — добавить фото ─────────────────────
        if method == "POST" and path.endswith("/photos"):
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
        if method == "DELETE" and "/photos/" in path:
            if not check_admin(headers):
                return err("Unauthorized", 401)
            photo_id = int(path.split("/photos/")[-1])
            cur.execute(f"DELETE FROM {SCHEMA}.about_photos WHERE id=%s", (photo_id,))
            conn.commit()
            return ok({"ok": True})

        # ── PUT /photos/reorder — порядок ────────────────────
        if method == "PUT" and path.endswith("/photos/reorder"):
            if not check_admin(headers):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            for item in body.get("order", []):
                cur.execute(f"UPDATE {SCHEMA}.about_photos SET sort_order=%s WHERE id=%s",
                            (item["sort_order"], item["id"]))
            conn.commit()
            return ok({"ok": True})

        return err("Not found", 404)

    finally:
        cur.close()
        conn.close()
