"""
CRM для закрытой админки: заявки, клиенты, сделки, этапы, история.
Требует валидный X-Staff-Token (сессия сотрудника) на все действия.
Роутинг через заголовок X-Action.

X-Action значения:
  list-leads         — GET список новых заявок (leads)
  list-clients       — GET список клиентов с их сделками
  get-client         — GET карточка клиента (X-Client-Id) со сделками, историей
  create-client      — POST создать клиента
  update-client      — POST обновить данные клиента
  create-deal        — POST создать сделку (из заявки или вручную)
  list-deals         — GET список всех сделок с данными клиента (для канбана)
  update-deal-stage  — POST изменить этап сделки (+ запись в историю)
  update-deal        — POST обновить бренд/объём/сумму сделки
  assign-deal        — POST закрепить сотрудника за сделкой: deal_id, staff_id (или null — снять)
  list-stages        — GET список этапов
  create-stage       — POST создать этап
  update-stage       — POST переименовать/изменить порядок и цвет этапа
  delete-stage       — POST скрыть этап (архивировать, если не используется в сделках)
  list-assignable    — GET список сотрудников, которым можно назначить сделку (не support)
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Action, X-Staff-Token, X-Client-Id",
}
SCHEMA = "t_p21475602_quantum_innovation_l"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(body, status=200):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False)}


def err(msg, status=400):
    return {"statusCode": status, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def get_staff(cur, token: str):
    if not token:
        return None
    cur.execute(f"""
        SELECT s.id, s.email, s.name, s.is_owner, s.role
        FROM {SCHEMA}.staff_sessions ss
        JOIN {SCHEMA}.staff_users s ON s.id = ss.staff_id
        WHERE ss.token=%s AND ss.expires_at > NOW() AND s.active=TRUE
    """, (token,))
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "email": row[1], "name": row[2], "is_owner": row[3], "role": row[4]}


def handler(event: dict, context) -> dict:
    """Обработчик CRM: заявки, клиенты, сделки, этапы."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    action = headers.get("x-action", "")
    staff_token = headers.get("x-staff-token", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        staff = get_staff(cur, staff_token)
        if not staff:
            return err("Unauthorized", 401)

        # ── list-leads ────────────────────────────────────────────
        if action == "list-leads":
            cur.execute(f"""
                SELECT l.id, l.name, l.phone, l.city, l.email, l.brief, l.created_at,
                       d.client_id, ds.name, ds.color, d.id, d.stage_id, d.brand, d.volume, d.amount,
                       d.assigned_to, st.name
                FROM {SCHEMA}.leads l
                LEFT JOIN {SCHEMA}.deals d ON d.lead_id = l.id
                LEFT JOIN {SCHEMA}.deal_stages ds ON ds.id = d.stage_id
                LEFT JOIN {SCHEMA}.staff_users st ON st.id = d.assigned_to
                ORDER BY l.created_at DESC LIMIT 200
            """)
            leads = [
                {
                    "id": r[0], "name": r[1], "phone": r[2], "city": r[3], "email": r[4],
                    "brief": r[5], "created_at": str(r[6]),
                    "client_id": r[7], "has_deal": r[7] is not None,
                    "stage_name": r[8], "stage_color": r[9], "deal_id": r[10], "stage_id": r[11],
                    "brand": r[12], "volume": float(r[13]) if r[13] else None,
                    "amount": float(r[14]) if r[14] else None,
                    "assigned_to": r[15], "assigned_name": r[16],
                }
                for r in cur.fetchall()
            ]
            return ok({"leads": leads})

        # ── list-deals ────────────────────────────────────────────
        if action == "list-deals":
            cur.execute(f"""
                SELECT d.id, d.brand, d.volume, d.amount, d.stage_id, ds.name, ds.color, ds.sort_order,
                       d.created_at, d.updated_at, d.assigned_to, st.name,
                       c.id, c.name, c.phone, c.city
                FROM {SCHEMA}.deals d
                JOIN {SCHEMA}.deal_stages ds ON ds.id = d.stage_id
                JOIN {SCHEMA}.clients c ON c.id = d.client_id
                LEFT JOIN {SCHEMA}.staff_users st ON st.id = d.assigned_to
                ORDER BY d.updated_at DESC LIMIT 500
            """)
            deals = [
                {
                    "id": r[0], "brand": r[1], "volume": float(r[2]) if r[2] else None,
                    "amount": float(r[3]) if r[3] else None, "stage_id": r[4],
                    "stage_name": r[5], "stage_color": r[6], "stage_order": r[7],
                    "created_at": str(r[8]), "updated_at": str(r[9]),
                    "assigned_to": r[10], "assigned_name": r[11],
                    "client_id": r[12], "client_name": r[13], "client_phone": r[14], "client_city": r[15],
                }
                for r in cur.fetchall()
            ]
            return ok({"deals": deals})

        # ── list-clients ──────────────────────────────────────────
        if action == "list-clients":
            cur.execute(f"""
                SELECT c.id, c.name, c.phone, c.email, c.city, c.company, c.created_at,
                       COUNT(d.id) AS deals_count,
                       COALESCE(SUM(d.amount), 0) AS total_amount
                FROM {SCHEMA}.clients c
                LEFT JOIN {SCHEMA}.deals d ON d.client_id = c.id
                GROUP BY c.id ORDER BY c.created_at DESC LIMIT 300
            """)
            clients = [
                {
                    "id": r[0], "name": r[1], "phone": r[2], "email": r[3], "city": r[4], "company": r[5],
                    "created_at": str(r[6]), "deals_count": r[7], "total_amount": float(r[8]),
                }
                for r in cur.fetchall()
            ]
            return ok({"clients": clients})

        # ── get-client ────────────────────────────────────────────
        if action == "get-client":
            client_id = headers.get("x-client-id", "")
            if not client_id:
                return err("X-Client-Id required")
            cur.execute(f"""
                SELECT id, name, phone, email, city, company, created_at FROM {SCHEMA}.clients WHERE id=%s
            """, (client_id,))
            row = cur.fetchone()
            if not row:
                return err("Клиент не найден", 404)
            client = {
                "id": row[0], "name": row[1], "phone": row[2], "email": row[3],
                "city": row[4], "company": row[5], "created_at": str(row[6]),
            }

            cur.execute(f"""
                SELECT d.id, d.brand, d.volume, d.amount, d.stage_id, s.name, s.color, d.created_at, d.updated_at,
                       d.assigned_to, st.name
                FROM {SCHEMA}.deals d
                JOIN {SCHEMA}.deal_stages s ON s.id = d.stage_id
                LEFT JOIN {SCHEMA}.staff_users st ON st.id = d.assigned_to
                WHERE d.client_id=%s ORDER BY d.created_at DESC
            """, (client_id,))
            deals = []
            for r in cur.fetchall():
                deal_id = r[0]
                cur.execute(f"""
                    SELECT l.to_stage_id, ts.name, l.staff_name, l.changed_at
                    FROM {SCHEMA}.deal_stage_log l
                    JOIN {SCHEMA}.deal_stages ts ON ts.id = l.to_stage_id
                    WHERE l.deal_id=%s ORDER BY l.changed_at
                """, (deal_id,))
                history = [
                    {"stage_id": h[0], "stage_name": h[1], "staff_name": h[2], "changed_at": str(h[3])}
                    for h in cur.fetchall()
                ]
                deals.append({
                    "id": deal_id, "brand": r[1], "volume": float(r[2]) if r[2] else None,
                    "amount": float(r[3]) if r[3] else None, "stage_id": r[4],
                    "stage_name": r[5], "stage_color": r[6],
                    "created_at": str(r[7]), "updated_at": str(r[8]), "history": history,
                    "assigned_to": r[9], "assigned_name": r[10],
                })

            return ok({"client": client, "deals": deals})

        # ── create-client ─────────────────────────────────────────
        if action == "create-client":
            body = json.loads(event.get("body") or "{}")
            name = (body.get("name") or "").strip()
            if not name:
                return err("name required")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.clients (name, phone, email, city, company)
                VALUES (%s, %s, %s, %s, %s) RETURNING id
            """, (name, body.get("phone"), body.get("email"), body.get("city"), body.get("company")))
            client_id = cur.fetchone()[0]
            conn.commit()
            return ok({"ok": True, "client_id": client_id}, 201)

        # ── update-client ─────────────────────────────────────────
        if action == "update-client":
            body = json.loads(event.get("body") or "{}")
            client_id = body.get("id")
            if not client_id:
                return err("id required")
            cur.execute(f"""
                UPDATE {SCHEMA}.clients SET name=%s, phone=%s, email=%s, city=%s, company=%s
                WHERE id=%s
            """, (body.get("name"), body.get("phone"), body.get("email"), body.get("city"), body.get("company"), client_id))
            conn.commit()
            return ok({"ok": True})

        # ── create-deal ───────────────────────────────────────────
        if action == "create-deal":
            body = json.loads(event.get("body") or "{}")
            client_id = body.get("client_id")
            lead_id = body.get("lead_id")

            # Если сделка создаётся из заявки — можно сразу создать клиента
            if not client_id and lead_id:
                cur.execute(f"SELECT name, phone, email, city FROM {SCHEMA}.leads WHERE id=%s", (lead_id,))
                lead_row = cur.fetchone()
                if lead_row:
                    cur.execute(f"""
                        INSERT INTO {SCHEMA}.clients (name, phone, email, city) VALUES (%s, %s, %s, %s) RETURNING id
                    """, lead_row)
                    client_id = cur.fetchone()[0]

            if not client_id:
                return err("client_id or lead_id required")

            cur.execute(f"SELECT id FROM {SCHEMA}.deal_stages ORDER BY sort_order LIMIT 1")
            first_stage = cur.fetchone()
            if not first_stage:
                return err("Нет ни одного этапа сделки — создайте этапы")
            stage_id = first_stage[0]

            cur.execute(f"""
                INSERT INTO {SCHEMA}.deals (client_id, lead_id, brand, volume, amount, stage_id, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (client_id, lead_id, body.get("brand"), body.get("volume"), body.get("amount"), stage_id, staff["id"]))
            deal_id = cur.fetchone()[0]

            cur.execute(f"""
                INSERT INTO {SCHEMA}.deal_stage_log (deal_id, from_stage_id, to_stage_id, staff_id, staff_name)
                VALUES (%s, NULL, %s, %s, %s)
            """, (deal_id, stage_id, staff["id"], staff["name"]))
            conn.commit()
            return ok({"ok": True, "deal_id": deal_id, "client_id": client_id}, 201)

        # ── update-deal-stage ─────────────────────────────────────
        if action == "update-deal-stage":
            body = json.loads(event.get("body") or "{}")
            deal_id = body.get("deal_id")
            new_stage_id = body.get("stage_id")
            if not deal_id or not new_stage_id:
                return err("deal_id and stage_id required")

            cur.execute(f"SELECT stage_id FROM {SCHEMA}.deals WHERE id=%s", (deal_id,))
            row = cur.fetchone()
            if not row:
                return err("Сделка не найдена", 404)
            old_stage_id = row[0]

            cur.execute(f"""
                UPDATE {SCHEMA}.deals SET stage_id=%s, updated_at=NOW() WHERE id=%s
            """, (new_stage_id, deal_id))
            cur.execute(f"""
                INSERT INTO {SCHEMA}.deal_stage_log (deal_id, from_stage_id, to_stage_id, staff_id, staff_name)
                VALUES (%s, %s, %s, %s, %s)
            """, (deal_id, old_stage_id, new_stage_id, staff["id"], staff["name"]))
            conn.commit()
            return ok({"ok": True})

        # ── update-deal ───────────────────────────────────────────
        if action == "update-deal":
            body = json.loads(event.get("body") or "{}")
            deal_id = body.get("id")
            if not deal_id:
                return err("id required")
            cur.execute(f"""
                UPDATE {SCHEMA}.deals SET brand=%s, volume=%s, amount=%s, updated_at=NOW() WHERE id=%s
            """, (body.get("brand"), body.get("volume"), body.get("amount"), deal_id))
            conn.commit()
            return ok({"ok": True})

        # ── assign-deal ───────────────────────────────────────────
        if action == "assign-deal":
            body = json.loads(event.get("body") or "{}")
            deal_id = body.get("deal_id")
            new_staff_id = body.get("staff_id")
            if not deal_id:
                return err("deal_id required")
            cur.execute(f"""
                UPDATE {SCHEMA}.deals SET assigned_to=%s, updated_at=NOW() WHERE id=%s
            """, (new_staff_id, deal_id))
            conn.commit()
            return ok({"ok": True})

        # ── list-assignable ───────────────────────────────────────
        if action == "list-assignable":
            cur.execute(f"""
                SELECT id, name, email, role FROM {SCHEMA}.staff_users
                WHERE active=TRUE AND role != 'support' ORDER BY name
            """)
            rows = [{"id": r[0], "name": r[1], "email": r[2], "role": r[3]} for r in cur.fetchall()]
            return ok({"staff": rows})

        # ── list-stages ───────────────────────────────────────────
        if action == "list-stages":
            cur.execute(f"SELECT id, name, sort_order, color FROM {SCHEMA}.deal_stages ORDER BY sort_order")
            stages = [{"id": r[0], "name": r[1], "sort_order": r[2], "color": r[3]} for r in cur.fetchall()]
            return ok({"stages": stages})

        # ── create-stage ──────────────────────────────────────────
        if action == "create-stage":
            body = json.loads(event.get("body") or "{}")
            name = (body.get("name") or "").strip()
            if not name:
                return err("name required")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.deal_stages (name, sort_order, color)
                VALUES (%s, (SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.deal_stages), %s)
                RETURNING id
            """, (name, body.get("color", "#a16207")))
            stage_id = cur.fetchone()[0]
            conn.commit()
            return ok({"ok": True, "id": stage_id}, 201)

        # ── update-stage ──────────────────────────────────────────
        if action == "update-stage":
            body = json.loads(event.get("body") or "{}")
            stage_id = body.get("id")
            if not stage_id:
                return err("id required")
            cur.execute(f"""
                UPDATE {SCHEMA}.deal_stages SET name=%s, sort_order=%s, color=%s WHERE id=%s
            """, (body.get("name"), body.get("sort_order"), body.get("color"), stage_id))
            conn.commit()
            return ok({"ok": True})

        # ── delete-stage ──────────────────────────────────────────
        if action == "delete-stage":
            body = json.loads(event.get("body") or "{}")
            stage_id = body.get("id")
            if not stage_id:
                return err("id required")
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.deals WHERE stage_id=%s", (stage_id,))
            in_use = cur.fetchone()[0]
            if in_use > 0:
                return err(f"Этап используется в {in_use} сделках — сначала перенесите их на другой этап")
            cur.execute(f"DELETE FROM {SCHEMA}.deal_stages WHERE id=%s", (stage_id,))
            conn.commit()
            return ok({"ok": True})

        return err(f"Unknown action: {action}", 400)
    finally:
        cur.close()
        conn.close()