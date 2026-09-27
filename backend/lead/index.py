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
        return {"statusCode": 405, "headers": cors, "body": json.dumps({"error": "Method not allowed"})}

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
            "body": json.dumps({"error": "name and phone are required"}),
        }

    # 1. Сохраняем заявку в БД
    schema = "t_p21475602_quantum_innovation_l"
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(
        f'INSERT INTO {schema}.leads (name, phone, city, email, brief) VALUES (%s, %s, %s, %s, %s) RETURNING id',
        (name, phone or None, city or None, email or None, json.dumps(brief) if brief else None),
    )
    lead_id = cur.fetchone()[0]

    # 1.1 Автоматически создаём клиента и сделку на первом этапе воронки
    cur.execute(
        f'INSERT INTO {schema}.clients (name, phone, email, city) VALUES (%s, %s, %s, %s) RETURNING id',
        (name, phone or None, email or None, city or None),
    )
    client_id = cur.fetchone()[0]

    cur.execute(f'SELECT id FROM {schema}.deal_stages ORDER BY sort_order LIMIT 1')
    first_stage = cur.fetchone()
    if first_stage:
        stage_id = first_stage[0]
        cur.execute(
            f'''INSERT INTO {schema}.deals (client_id, lead_id, stage_id)
                VALUES (%s, %s, %s) RETURNING id''',
            (client_id, lead_id, stage_id),
        )
        deal_id = cur.fetchone()[0]
        cur.execute(
            f'''INSERT INTO {schema}.deal_stage_log (deal_id, from_stage_id, to_stage_id, staff_id, staff_name)
                VALUES (%s, NULL, %s, NULL, %s)''',
            (deal_id, stage_id, "Автоматически (новая заявка)"),
        )

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