import json
import os
import urllib.request
import urllib.error
import psycopg2


SCHEMA = "t_p21475602_quantum_innovation_l"


def notify_max_lead(lead_id, name, phone, email, city, brief):
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT value FROM {SCHEMA}.site_settings WHERE key='max_bot_token'")
        row = cur.fetchone()
        token = (row[0] if row else "") or os.environ.get("MAX_BOT_TOKEN", "")
        if not token:
            return
        cur.execute(f"SELECT user_id FROM {SCHEMA}.max_subscribers")
        users = [r[0] for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()
    lines = [
        "\U0001F7E9\U0001F7E9\U0001F7E9\U0001F7E9\U0001F7E9\U0001F7E9\U0001F7E9\U0001F7E9",
        "\U0001F525 **НОВАЯ ЗАЯВКА** \U0001F525",
        "\U0001F7E9\U0001F7E9\U0001F7E9\U0001F7E9\U0001F7E9\U0001F7E9\U0001F7E9\U0001F7E9",
        f"\U0001F464 **{name}**",
        f"\U0001F4DE {phone}",
        f"\u2709\uFE0F {email}",
    ]
    if city:
        lines.append(f"\U0001F4CD {city}")
    if isinstance(brief, dict):
        for k, v in list(brief.items())[:8]:
            if v not in (None, "", [], {}):
                lines.append(f"\u2022 {k}: {v}")
    lines.append(f"\n\U0001F194 Заявка №{lead_id}. Свяжитесь с клиентом как можно скорее.")
    text = "\n".join(lines)[:3900]
    for user_id in users:
        req = urllib.request.Request(
            f"https://platform-api.max.ru/messages?user_id={user_id}",
            data=json.dumps({"text": text, "format": "markdown"}).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": token},
            method="POST",
        )
        try:
            urllib.request.urlopen(req, timeout=4)
        except Exception:
            continue


def handler(event: dict, context) -> dict:
    """Приём заявки с сайта (телефон и почта обязательны): сохраняется как неавторизованная заявка и уходит в Albato → AmoCRM"""

    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
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

    try:
        notify_max_lead(lead_id, name, phone, email, city, brief)
    except Exception:
        pass

    return {
        "statusCode": 200,
        "headers": cors,
        "body": json.dumps({"ok": True, "lead_id": lead_id}),
    }