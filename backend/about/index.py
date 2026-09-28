"""
API для блока 'О компании', курса доллара и калькулятора.
Роутинг через заголовок X-Action (URL path недоступен на платформе).

X-Action значения:
  get-content      — GET публичное чтение (без авторизации)
  save-texts       — PUT сохранить тексты (только владелец)
  upload-logo      — POST загрузить логотип (только владелец)
  upload-photo     — POST загрузить фото (только владелец)
  add-photo-url    — POST добавить фото по URL (только владелец)
  delete-photo     — DELETE удалить фото (только владелец)
  get-calc         — GET публичные данные калькулятора
  save-calc        — POST сохранить калькулятор (владелец и менеджер)
  get-rate         — GET курс доллара
  save-rate        — POST сохранить курс доллара (владелец и менеджер)
  get-sections     — GET публичные данные секций лендинга (X-Section-Key: hero|workflow|features|footer, либо все сразу без заголовка)
  save-section     — POST сохранить секцию лендинга (только владелец): X-Section-Key, body = JSON-данные секции
  get-testimonials — GET публичный список активных отзывов
  list-testimonials — GET все отзывы для админки (только владелец)
  save-testimonial — POST создать/обновить отзыв (только владелец): id?, quote, author, role, sort_order, active
  delete-testimonial — DELETE удалить отзыв (только владелец): X-Testimonial-Id

Авторизация редактирования — X-Staff-Token (сессия сотрудника), не статичный ключ.
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
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key, X-Staff-Token, X-Action, X-Photo-Id, X-Section-Key, X-Testimonial-Id",
}
SCHEMA      = "t_p21475602_quantum_innovation_l"
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


def get_staff_role(cur, headers: dict):
    token = headers.get("x-staff-token", "")
    if not token:
        return None
    cur.execute(f"""
        SELECT COALESCE(ss.preview_role, s.role) FROM {SCHEMA}.staff_sessions ss
        JOIN {SCHEMA}.staff_users s ON s.id = ss.staff_id
        WHERE ss.token=%s AND ss.expires_at > NOW() AND s.active=TRUE
    """, (token,))
    row = cur.fetchone()
    return row[0] if row else None


def check_role(cur, headers: dict, allowed: tuple) -> bool:
    role = get_staff_role(cur, headers)
    return role in allowed


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
            if not check_role(cur, headers, ("owner",)):
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
            if not check_role(cur, headers, ("owner",)):
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
            if not check_role(cur, headers, ("owner",)):
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
            if not check_role(cur, headers, ("owner",)):
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
            if not check_role(cur, headers, ("owner",)):
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

        # ── get-calc: публичные данные калькулятора ───────────────
        if action == "get-calc":
            cur.execute(f"""
                SELECT id, label, desc_text, price_usd, sort_order
                FROM {SCHEMA}.calc_origins WHERE active=TRUE ORDER BY sort_order, id
            """)
            origins = [
                {"id": r[0], "label": r[1], "desc": r[2], "price_usd": float(r[3]), "sort_order": r[4]}
                for r in cur.fetchall()
            ]
            cur.execute(f"SELECT key, value, label FROM {SCHEMA}.calc_params ORDER BY key")
            params = {r[0]: {"value": float(r[1]), "label": r[2]} for r in cur.fetchall()}
            cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key='usd_rate'")
            rate_row = cur.fetchone()
            usd_rate = float(rate_row[0]) if rate_row else 85.0
            return ok({"origins": origins, "params": params, "usd_rate": usd_rate})

        # ── save-calc: сохранить данные калькулятора ──────────────
        if action == "save-calc":
            if not check_role(cur, headers, ("owner", "manager")):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")

            # Обновить сорта зерна
            if "origins" in body:
                for o in body["origins"]:
                    oid = o.get("id")
                    if oid:
                        cur.execute(f"""
                            UPDATE {SCHEMA}.calc_origins
                            SET label=%s, desc_text=%s, price_usd=%s, sort_order=%s
                            WHERE id=%s
                        """, (o["label"], o.get("desc",""), float(o["price_usd"]), o.get("sort_order", 0), oid))
                    else:
                        cur.execute(f"""
                            INSERT INTO {SCHEMA}.calc_origins (label, desc_text, price_usd, sort_order)
                            VALUES (%s, %s, %s, (SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.calc_origins))
                            RETURNING id
                        """, (o["label"], o.get("desc",""), float(o["price_usd"])))

            # Удалить сорта, которых нет в присланном списке (по id)
            if "delete_origin_ids" in body:
                for did in body["delete_origin_ids"]:
                    cur.execute(f"UPDATE {SCHEMA}.calc_origins SET active=FALSE WHERE id=%s", (did,))

            # Обновить параметры
            if "params" in body:
                for key, val in body["params"].items():
                    cur.execute(f"""
                        UPDATE {SCHEMA}.calc_params SET value=%s WHERE key=%s
                    """, (float(val), key))

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
            if not check_role(cur, headers, ("owner", "manager")):
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

        # ── get-sections: публичные данные секций лендинга ────────
        if action == "get-sections":
            section_key = headers.get("x-section-key", "")
            if section_key:
                cur.execute(f"SELECT data FROM {SCHEMA}.site_sections WHERE section_key=%s", (section_key,))
                row = cur.fetchone()
                return ok({"data": row[0] if row else None})
            cur.execute(f"SELECT section_key, data FROM {SCHEMA}.site_sections")
            sections = {r[0]: r[1] for r in cur.fetchall()}
            return ok({"sections": sections})

        # ── save-section: сохранить секцию лендинга ───────────────
        if action == "save-section":
            if not check_role(cur, headers, ("owner",)):
                return err("Unauthorized", 401)
            section_key = headers.get("x-section-key", "")
            if not section_key:
                return err("X-Section-Key required")
            body = json.loads(event.get("body") or "{}")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.site_sections (section_key, data, updated_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (section_key) DO UPDATE SET data=EXCLUDED.data, updated_at=NOW()
            """, (section_key, json.dumps(body, ensure_ascii=False)))
            conn.commit()
            return ok({"ok": True})

        # ── get-testimonials: публичный список активных отзывов ───
        if action == "get-testimonials":
            cur.execute(f"""
                SELECT id, quote, author, role, sort_order
                FROM {SCHEMA}.testimonials WHERE active=TRUE ORDER BY sort_order, id
            """)
            testimonials = [
                {"id": r[0], "quote": r[1], "author": r[2], "role": r[3], "sort_order": r[4]}
                for r in cur.fetchall()
            ]
            return ok({"testimonials": testimonials})

        # ── list-testimonials: все отзывы для админки ─────────────
        if action == "list-testimonials":
            if not check_role(cur, headers, ("owner",)):
                return err("Unauthorized", 401)
            cur.execute(f"""
                SELECT id, quote, author, role, sort_order, active
                FROM {SCHEMA}.testimonials ORDER BY sort_order, id
            """)
            testimonials = [
                {"id": r[0], "quote": r[1], "author": r[2], "role": r[3], "sort_order": r[4], "active": r[5]}
                for r in cur.fetchall()
            ]
            return ok({"testimonials": testimonials})

        # ── save-testimonial: создать/обновить отзыв ──────────────
        if action == "save-testimonial":
            if not check_role(cur, headers, ("owner",)):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            tid = body.get("id")
            quote = (body.get("quote") or "").strip()
            author = (body.get("author") or "").strip()
            role = body.get("role", "")
            sort_order = body.get("sort_order", 0)
            active = body.get("active", True)
            if not quote or not author:
                return err("quote and author required")
            if tid:
                cur.execute(f"""
                    UPDATE {SCHEMA}.testimonials
                    SET quote=%s, author=%s, role=%s, sort_order=%s, active=%s
                    WHERE id=%s
                """, (quote, author, role, sort_order, active, tid))
            else:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.testimonials (quote, author, role, sort_order, active)
                    VALUES (%s, %s, %s, %s, %s) RETURNING id
                """, (quote, author, role, sort_order, active))
                tid = cur.fetchone()[0]
            conn.commit()
            return ok({"ok": True, "id": tid}, 201 if not body.get("id") else 200)

        # ── delete-testimonial: удалить отзыв ─────────────────────
        if action == "delete-testimonial":
            if not check_role(cur, headers, ("owner",)):
                return err("Unauthorized", 401)
            tid = int(headers.get("x-testimonial-id", "0"))
            if not tid:
                return err("X-Testimonial-Id required")
            cur.execute(f"DELETE FROM {SCHEMA}.testimonials WHERE id=%s", (tid,))
            conn.commit()
            return ok({"ok": True})

        return err(f"Unknown action: {action}", 400)

    finally:
        cur.close()
        conn.close()