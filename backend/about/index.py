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
  get-calc         — GET публичные данные калькулятора v2 (сорта, параметры, курс+дата, мин.объём, шаг, сроки производства)
  save-calc        — POST сохранить калькулятор v2 (владелец и менеджер)
  get-rate         — GET курс доллара (+ дата обновления)
  save-rate        — POST сохранить курс доллара (владелец и менеджер)
  get-email-settings  — GET настройки email-отправителя (владелец и менеджер)
  save-email-settings — POST сохранить email-отправителя: sender_name, sender_email (только владелец)
  get-site-pages      — GET публичный список опубликованных страниц с файлами (без авторизации)
  get-site-page       — GET одна страница по X-Page-Slug (публично)
  list-site-pages     — GET все страницы для админки (только владелец)
  save-site-page      — POST создать/обновить страницу (только владелец)
  delete-site-page    — DELETE удалить страницу: X-Page-Id (только владелец)
  reorder-site-pages  — POST порядок страниц: order=[{id, sort_order}] (только владелец)
  upload-page-file    — POST прикрепить файл к странице (base64 → S3): page_id, file_base64, file_name (только владелец)
  delete-page-file    — DELETE открепить файл: X-File-Id (только владелец)
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
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key, X-Staff-Token, X-Action, X-Photo-Id, X-Section-Key, X-Testimonial-Id, X-Page-Slug, X-Page-Id, X-File-Id",
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
            if not check_role(cur, headers, ("owner", "super_admin")):
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
            if not check_role(cur, headers, ("owner", "super_admin")):
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
            if not check_role(cur, headers, ("owner", "super_admin")):
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
            if not check_role(cur, headers, ("owner", "super_admin")):
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
            if not check_role(cur, headers, ("owner", "super_admin")):
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

        # ── get-calc: публичные данные калькулятора v2 ────────────
        if action == "get-calc":
            cur.execute(f"""
                SELECT id, label, price_usd_per_kg, sort_order
                FROM {SCHEMA}.calc_origins_v2 WHERE active=TRUE ORDER BY sort_order, id
            """)
            origins = [
                {"id": r[0], "label": r[1], "price_usd_per_kg": float(r[2]), "sort_order": r[3]}
                for r in cur.fetchall()
            ]
            cur.execute(f"SELECT key, value, label FROM {SCHEMA}.calc_params_v2 ORDER BY key")
            params = {r[0]: {"value": float(r[1]), "label": r[2]} for r in cur.fetchall()}
            cur.execute(f"SELECT value, updated_at FROM {SCHEMA}.site_settings WHERE key='usd_rate'")
            rate_row = cur.fetchone()
            usd_rate = float(rate_row[0]) if rate_row else 85.0
            rate_updated_at = str(rate_row[1]) if rate_row and rate_row[1] else None
            cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key='calc_min_volume'")
            min_row = cur.fetchone()
            min_volume = int(float(min_row[0])) if min_row else 500
            cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key='calc_volume_step'")
            step_row = cur.fetchone()
            volume_step = int(float(step_row[0])) if step_row else 5
            cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key='calc_lead_time_tiers'")
            lt_row = cur.fetchone()
            lead_time_tiers = json.loads(lt_row[0]) if lt_row else [
                {"max_volume": 1000, "days": 14}, {"max_volume": 2000, "days": 18}, {"max_volume": None, "days": 25},
            ]
            return ok({
                "origins": origins, "params": params, "usd_rate": usd_rate, "usd_rate_updated_at": rate_updated_at,
                "min_volume": min_volume, "volume_step": volume_step, "lead_time_tiers": lead_time_tiers,
            })

        # ── save-calc: сохранить данные калькулятора v2 ───────────
        if action == "save-calc":
            if not check_role(cur, headers, ("owner", "super_admin", "manager")):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")

            if "origins" in body:
                for o in body["origins"]:
                    oid = o.get("id")
                    if oid:
                        cur.execute(f"""
                            UPDATE {SCHEMA}.calc_origins_v2
                            SET label=%s, price_usd_per_kg=%s, sort_order=%s
                            WHERE id=%s
                        """, (o["label"], float(o["price_usd_per_kg"]), o.get("sort_order", 0), oid))
                    else:
                        cur.execute(f"""
                            INSERT INTO {SCHEMA}.calc_origins_v2 (label, price_usd_per_kg, sort_order)
                            VALUES (%s, %s, (SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.calc_origins_v2))
                            RETURNING id
                        """, (o["label"], float(o["price_usd_per_kg"])))

            if "delete_origin_ids" in body:
                for did in body["delete_origin_ids"]:
                    cur.execute(f"UPDATE {SCHEMA}.calc_origins_v2 SET active=FALSE WHERE id=%s", (did,))

            if "params" in body:
                for key, val in body["params"].items():
                    cur.execute(f"UPDATE {SCHEMA}.calc_params_v2 SET value=%s WHERE key=%s", (float(val), key))

            if "min_volume" in body:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.site_settings (key, value, updated_at) VALUES ('calc_min_volume', %s, NOW())
                    ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()
                """, (str(int(body["min_volume"])),))

            if "volume_step" in body:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.site_settings (key, value, updated_at) VALUES ('calc_volume_step', %s, NOW())
                    ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()
                """, (str(int(body["volume_step"])),))

            if "lead_time_tiers" in body:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.site_settings (key, value, updated_at) VALUES ('calc_lead_time_tiers', %s, NOW())
                    ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()
                """, (json.dumps(body["lead_time_tiers"]),))

            conn.commit()
            return ok({"ok": True})

        # ── get-rate: получить курс доллара + дату обновления ─────
        if action == "get-rate":
            cur.execute(f"SELECT value, updated_at FROM {SCHEMA}.site_settings WHERE key='usd_rate'")
            row = cur.fetchone()
            if row:
                return ok({"rate": float(row[0]), "updated_at": str(row[1])})
            return ok({"rate": None, "updated_at": None})

        # ── save-rate: сохранить курс доллара ─────────────────────
        if action == "save-rate":
            if not check_role(cur, headers, ("owner", "super_admin", "manager")):
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
            if not check_role(cur, headers, ("owner", "super_admin")):
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
            if not check_role(cur, headers, ("owner", "super_admin")):
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
            if not check_role(cur, headers, ("owner", "super_admin")):
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
            if not check_role(cur, headers, ("owner", "super_admin")):
                return err("Unauthorized", 401)
            tid = int(headers.get("x-testimonial-id", "0"))
            if not tid:
                return err("X-Testimonial-Id required")
            cur.execute(f"DELETE FROM {SCHEMA}.testimonials WHERE id=%s", (tid,))
            conn.commit()
            return ok({"ok": True})

        # ── get-email-settings: настройки отправителя писем ───────
        if action == "get-email-settings":
            if not check_role(cur, headers, ("owner", "super_admin", "manager")):
                return err("Unauthorized", 401)
            cur.execute(f"""
                SELECT key, value FROM {SCHEMA}.site_settings
                WHERE key IN ('email_sender_name', 'email_sender_email')
            """)
            rows = dict(cur.fetchall())
            return ok({
                "sender_name": rows.get("email_sender_name", ""),
                "sender_email": rows.get("email_sender_email", ""),
            })

        # ── save-email-settings: сохранить отправителя писем ──────
        if action == "save-email-settings":
            if not check_role(cur, headers, ("owner", "super_admin")):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            sender_name = (body.get("sender_name") or "").strip()
            sender_email = (body.get("sender_email") or "").strip()
            if not sender_name or not sender_email:
                return err("sender_name and sender_email required")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.site_settings (key, value, updated_at) VALUES ('email_sender_name', %s, NOW())
                ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()
            """, (sender_name,))
            cur.execute(f"""
                INSERT INTO {SCHEMA}.site_settings (key, value, updated_at) VALUES ('email_sender_email', %s, NOW())
                ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()
            """, (sender_email,))
            conn.commit()
            return ok({"ok": True})

        # ── get-site-pages: публичный список опубликованных страниц ─
        if action == "get-site-pages":
            cur.execute(f"""
                SELECT id, slug, title, icon, sort_order, show_in_footer
                FROM {SCHEMA}.site_pages WHERE is_published=TRUE ORDER BY sort_order, id
            """)
            pages = [
                {"id": r[0], "slug": r[1], "title": r[2], "icon": r[3], "sort_order": r[4], "show_in_footer": r[5]}
                for r in cur.fetchall()
            ]
            return ok({"pages": pages})

        # ── get-site-page: одна страница по slug (публично) ───────
        if action == "get-site-page":
            slug = headers.get("x-page-slug", "")
            if not slug:
                return err("X-Page-Slug required")
            cur.execute(f"""
                SELECT id, slug, title, content, icon FROM {SCHEMA}.site_pages
                WHERE slug=%s AND is_published=TRUE
            """, (slug,))
            row = cur.fetchone()
            if not row:
                return err("Страница не найдена", 404)
            page = {"id": row[0], "slug": row[1], "title": row[2], "content": row[3], "icon": row[4]}
            cur.execute(f"""
                SELECT id, file_url, file_name FROM {SCHEMA}.site_page_files
                WHERE page_id=%s ORDER BY sort_order, id
            """, (page["id"],))
            page["files"] = [{"id": r[0], "file_url": r[1], "file_name": r[2]} for r in cur.fetchall()]
            return ok({"page": page})

        # ── list-site-pages: все страницы для админки ─────────────
        if action == "list-site-pages":
            if not check_role(cur, headers, ("owner", "super_admin")):
                return err("Unauthorized", 401)
            cur.execute(f"""
                SELECT id, slug, title, content, icon, sort_order, show_in_footer, is_published
                FROM {SCHEMA}.site_pages ORDER BY sort_order, id
            """)
            pages = []
            for r in cur.fetchall():
                page = {
                    "id": r[0], "slug": r[1], "title": r[2], "content": r[3], "icon": r[4],
                    "sort_order": r[5], "show_in_footer": r[6], "is_published": r[7],
                }
                cur.execute(f"""
                    SELECT id, file_url, file_name FROM {SCHEMA}.site_page_files
                    WHERE page_id=%s ORDER BY sort_order, id
                """, (page["id"],))
                page["files"] = [{"id": fr[0], "file_url": fr[1], "file_name": fr[2]} for fr in cur.fetchall()]
                pages.append(page)
            return ok({"pages": pages})

        # ── save-site-page: создать/обновить страницу ─────────────
        if action == "save-site-page":
            if not check_role(cur, headers, ("owner", "super_admin")):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            page_id = body.get("id")
            slug = (body.get("slug") or "").strip().lower().replace(" ", "-")
            title = (body.get("title") or "").strip()
            if not slug or not title:
                return err("slug and title required")
            if page_id:
                cur.execute(f"""
                    UPDATE {SCHEMA}.site_pages
                    SET slug=%s, title=%s, content=%s, icon=%s, show_in_footer=%s, is_published=%s, updated_at=NOW()
                    WHERE id=%s
                """, (
                    slug, title, body.get("content", ""), body.get("icon", "FileText"),
                    body.get("show_in_footer", True), body.get("is_published", True), page_id,
                ))
            else:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.site_pages (slug, title, content, icon, show_in_footer, is_published, sort_order)
                    VALUES (%s, %s, %s, %s, %s, %s, (SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.site_pages))
                    RETURNING id
                """, (
                    slug, title, body.get("content", ""), body.get("icon", "FileText"),
                    body.get("show_in_footer", True), body.get("is_published", True),
                ))
                page_id = cur.fetchone()[0]
            conn.commit()
            return ok({"ok": True, "id": page_id}, 201 if not body.get("id") else 200)

        # ── delete-site-page: удалить страницу ────────────────────
        if action == "delete-site-page":
            if not check_role(cur, headers, ("owner", "super_admin")):
                return err("Unauthorized", 401)
            page_id = int(headers.get("x-page-id", "0"))
            if not page_id:
                return err("X-Page-Id required")
            cur.execute(f"SELECT file_url FROM {SCHEMA}.site_page_files WHERE page_id=%s", (page_id,))
            for (file_url,) in cur.fetchall():
                if CDN_BASE in file_url:
                    s3_key = file_url.replace(f"{CDN_BASE}/", "").split("?")[0]
                    try:
                        get_s3().delete_object(Bucket="files", Key=s3_key)
                    except Exception:
                        pass
            cur.execute(f"DELETE FROM {SCHEMA}.site_page_files WHERE page_id=%s", (page_id,))
            cur.execute(f"DELETE FROM {SCHEMA}.site_pages WHERE id=%s", (page_id,))
            conn.commit()
            return ok({"ok": True})

        # ── reorder-site-pages ─────────────────────────────────────
        if action == "reorder-site-pages":
            if not check_role(cur, headers, ("owner", "super_admin")):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            for item in body.get("order", []):
                cur.execute(f"UPDATE {SCHEMA}.site_pages SET sort_order=%s WHERE id=%s", (item["sort_order"], item["id"]))
            conn.commit()
            return ok({"ok": True})

        # ── upload-page-file: прикрепить файл к странице ──────────
        if action == "upload-page-file":
            if not check_role(cur, headers, ("owner", "super_admin")):
                return err("Unauthorized", 401)
            body = json.loads(event.get("body") or "{}")
            page_id = body.get("page_id")
            b64 = body.get("file_base64", "")
            file_name = body.get("file_name", "file.pdf")
            if not page_id or not b64:
                return err("page_id and file_base64 required")
            data = base64.b64decode(b64)
            ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "pdf"
            s3_key = f"pages/{uuid.uuid4()}.{ext}"
            content_types = {
                "pdf": "application/pdf", "doc": "application/msword",
                "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
            }
            get_s3().put_object(Bucket="files", Key=s3_key, Body=data, ContentType=content_types.get(ext, "application/octet-stream"))
            file_url = f"{CDN_BASE}/{s3_key}"
            cur.execute(f"""
                INSERT INTO {SCHEMA}.site_page_files (page_id, file_url, file_name, sort_order)
                VALUES (%s, %s, %s, (SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.site_page_files WHERE page_id=%s))
                RETURNING id
            """, (page_id, file_url, file_name, page_id))
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({"id": new_id, "file_url": file_url, "ok": True}, 201)

        # ── delete-page-file: открепить файл от страницы ──────────
        if action == "delete-page-file":
            if not check_role(cur, headers, ("owner", "super_admin")):
                return err("Unauthorized", 401)
            file_id = int(headers.get("x-file-id", "0"))
            if not file_id:
                return err("X-File-Id required")
            cur.execute(f"SELECT file_url FROM {SCHEMA}.site_page_files WHERE id=%s", (file_id,))
            row = cur.fetchone()
            if row and CDN_BASE in row[0]:
                s3_key = row[0].replace(f"{CDN_BASE}/", "").split("?")[0]
                try:
                    get_s3().delete_object(Bucket="files", Key=s3_key)
                except Exception:
                    pass
            cur.execute(f"DELETE FROM {SCHEMA}.site_page_files WHERE id=%s", (file_id,))
            conn.commit()
            return ok({"ok": True})

        return err(f"Unknown action: {action}", 400)

    finally:
        cur.close()
        conn.close()