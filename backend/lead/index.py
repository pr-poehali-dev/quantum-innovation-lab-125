import json
import os
import urllib.request
import urllib.error
import psycopg2


def handler(event: dict, context) -> dict:
    """Приём заявки с сайта, сохранение в БД и отправка в Albato → AmoCRM"""

    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "headers": cors, "body": {"error": "Method not allowed"}}

    # Парсим тело
    raw_body = event.get("body") or "{}"
    if isinstance(raw_body, str):
        body = json.loads(raw_body)
    else:
        body = raw_body

    name  = (body.get("name")  or "").strip()
    phone = (body.get("phone") or "").strip()
    city  = (body.get("city")  or "").strip()
    email = (body.get("email") or "").strip()
    brief = body.get("brief")

    if not name or not phone:
        return {
            "statusCode": 400,
            "headers": cors,
            "body": {"error": "name and phone are required"},
        }

    # 1. Сохраняем заявку в БД
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        f'INSERT INTO {schema}.leads (name, phone, city, email, brief) VALUES (%s, %s, %s, %s, %s) RETURNING id',
        (name, phone or None, city or None, email or None, json.dumps(brief) if brief else None),
    )
    lead_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    # 2. Отправляем вебхук в Albato
    albato_url = os.environ.get("ALBATO_WEBHOOK_URL", "")
    if albato_url:
        payload = {
            "lead_id": lead_id,
            "name":    name,
            "phone":   phone,
            "city":    city,
            "email":   email,
            "source":  "kontraktkafe.ru",
            "brief":   brief or {},
        }
        req = urllib.request.Request(
            albato_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            urllib.request.urlopen(req, timeout=5)
        except urllib.error.URLError:
            pass

    return {
        "statusCode": 200,
        "headers": cors,
        "body": {"ok": True, "lead_id": lead_id},
    }
