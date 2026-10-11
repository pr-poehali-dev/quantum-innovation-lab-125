import json
import os
import urllib.request
import urllib.error
import psycopg2


def handler(event: dict, context) -> dict:
    """Приём заявки с сайта (телефон и почта обязательны): сохраняется как неавторизованная заявка и уходит в Albato → AmoCRM"""

    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "headers": cors, "body": json.dumps({"error": "Method not allowed"})}

    # Парсим тело
    raw_body = event.get("body") or "{}"
    if isinstance(raw_body, str):
        body = json.loads(raw_body)
    else:
        body = raw_body

    name  = (body.get("name")  or "").strip() or "Без имени"
    phone = (body.get("phone") or "").strip()
    city  = (body.get("city")  or "").strip()
    email = (body.get("email") or "").strip()
    brief = body.get("brief")

    if not phone or not email:
        return {
            "statusCode": 400,
            "headers": cors,
            "body": json.dumps({"error": "phone and email are required"}),
        }

    schema = "t_p21475602_quantum_innovation_l"
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        f'INSERT INTO {schema}.leads (name, phone, city, email, brief, status) VALUES (%s, %s, %s, %s, %s, \'new\') RETURNING id',
        (name, phone, city or None, email, json.dumps(brief, ensure_ascii=False) if brief else None),
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
        "body": json.dumps({"ok": True, "lead_id": lead_id}),
    }