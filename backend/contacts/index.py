"""
Контакты: база компаний для обзвона и рассылок.
Доступ — только сотрудники (X-Staff-Token). Роутинг через заголовок X-Action.

X-Action значения:
  list-contacts      — GET список с фильтрами: q, priority, status, city, tag (id через запятую), limit, offset
  get-contact        — GET карточка (X-Contact-Id): теги, комментарии, звонки, сделки
  save-contact       — POST создать/обновить контакт (id опционально) + tag_ids
  archive-contact    — POST убрать в архив / вернуть: id, archived
  add-comment        — POST комментарий: contact_id, text
  delete-comment     — POST удалить комментарий: id
  log-call           — POST отметить звонок: contact_id, result, comment, next_call_at
  list-tags          — GET теги с количеством контактов
  save-tag           — POST создать/переименовать тег: name, color, id
  delete-tag         — POST удалить тег: id
  bulk-tags          — POST массово: contact_ids, add_tag_ids, remove_tag_ids
  create-deal        — POST создать сделку из контакта: contact_id, brand, volume
  import-contacts    — POST импорт: rows[]
"""
import json
import os
import psycopg2

SCHEMA = "t_p21475602_quantum_innovation_l"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Action, X-Staff-Token, X-Contact-Id",
}
STATUSES = ("new", "no_answer", "talked", "callback", "interested", "refused")
COLORS = ("gray", "red", "amber", "green", "teal", "blue", "indigo", "purple", "rose", "orange", "slate")


def ok(body, status=200):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False)}


def err(msg, status=400):
    return {"statusCode": status, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def get_staff(cur, token):
    if not token:
        return None
    cur.execute(f"""
        SELECT s.id, s.name, COALESCE(ss.preview_role, s.role)
        FROM {SCHEMA}.staff_sessions ss
        JOIN {SCHEMA}.staff_users s ON s.id = ss.staff_id
        WHERE ss.token=%s AND ss.expires_at > NOW() AND s.active=TRUE
    """, (token,))
    row = cur.fetchone()
    return {"id": row[0], "name": row[1], "role": row[2]} if row else None


def clean(v):
    if v is None:
        return None
    v = str(v).strip()
    return v or None


COLS = ("id", "code", "company", "segment", "city", "call_window", "priority", "phone", "email", "call_status",
        "need", "volume_note", "important", "mailing_consent", "client_id", "last_call_at", "next_call_at",
        "archived", "created_at", "assigned_to")
SELECT = ", ".join(f"c.{x}" for x in COLS)


def row_to_contact(r):
    d = dict(zip(COLS, r))
    for k in ("last_call_at", "next_call_at", "created_at"):
        d[k] = str(d[k]) if d[k] else None
    return d


def attach_tags(cur, contacts):
    if not contacts:
        return
    ids = [c["id"] for c in contacts]
    cur.execute(f"SELECT contact_id, tag_id FROM {SCHEMA}.contact_tag_links WHERE contact_id = ANY(%s)", (ids,))
    m = {}
    for cid, tid in cur.fetchall():
        m.setdefault(cid, []).append(tid)
    for c in contacts:
        c["tag_ids"] = m.get(c["id"], [])


def set_tags(cur, contact_id, tag_ids):
    cur.execute(f"DELETE FROM {SCHEMA}.contact_tag_links WHERE contact_id=%s", (contact_id,))
    for t in set(int(x) for x in tag_ids):
        cur.execute(f"""
            INSERT INTO {SCHEMA}.contact_tag_links (contact_id, tag_id)
            SELECT %s, id FROM {SCHEMA}.contact_tags WHERE id=%s ON CONFLICT DO NOTHING
        """, (contact_id, t))


def get_or_create_tag(cur, cache, name, color="gray"):
    key = name.lower()
    if key in cache:
        return cache[key]
    cur.execute(f"""
        INSERT INTO {SCHEMA}.contact_tags (name, color) VALUES (%s, %s)
        ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id
    """, (name, color))
    cache[key] = cur.fetchone()[0]
    return cache[key]


def handler(event: dict, context) -> dict:
    """Обработчик контактов: список, карточка, теги, звонки, комментарии, импорт, создание сделки."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    action = headers.get("x-action", "")
    params = event.get("queryStringParameters") or {}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    try:
        staff = get_staff(cur, headers.get("x-staff-token", ""))
        if not staff:
            return err("Unauthorized", 401)
        body = json.loads(event.get("body") or "{}") if event.get("httpMethod") == "POST" else {}

        if action == "list-contacts":
            where, args = ["1=1"], []
            where.append("c.archived = %s")
            args.append(params.get("archived") == "1")
            q = clean(params.get("q"))
            if q:
                like = f"%{q}%"
                where.append("(c.company ILIKE %s OR c.phone ILIKE %s OR c.email ILIKE %s OR c.city ILIKE %s OR c.code ILIKE %s)")
                args += [like] * 5
            if params.get("priority"):
                where.append("c.priority = %s")
                args.append(int(params["priority"]))
            if params.get("status") in STATUSES:
                where.append("c.call_status = %s")
                args.append(params["status"])
            if params.get("city"):
                where.append("c.city = %s")
                args.append(params["city"])
            if params.get("consent") == "1":
                where.append("c.mailing_consent = TRUE")
            if params.get("has_email") == "1":
                where.append("c.email IS NOT NULL")
            for tid in [t for t in (params.get("tag") or "").split(",") if t.strip().isdigit()]:
                where.append(f"EXISTS (SELECT 1 FROM {SCHEMA}.contact_tag_links l WHERE l.contact_id=c.id AND l.tag_id=%s)")
                args.append(int(tid))
            w = " AND ".join(where)
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.contacts c WHERE {w}", args)
            total = cur.fetchone()[0]
            limit = max(1, min(int(params.get("limit") or 50), 5000))
            offset = max(0, int(params.get("offset") or 0))
            cur.execute(f"""
                SELECT {SELECT} FROM {SCHEMA}.contacts c WHERE {w}
                ORDER BY c.priority NULLS LAST, c.id LIMIT %s OFFSET %s
            """, args + [limit, offset])
            contacts = [row_to_contact(r) for r in cur.fetchall()]
            attach_tags(cur, contacts)
            cur.execute(f"SELECT call_status, COUNT(*) FROM {SCHEMA}.contacts WHERE archived=FALSE GROUP BY call_status")
            counts = {r[0]: r[1] for r in cur.fetchall()}
            cur.execute(f"SELECT DISTINCT city FROM {SCHEMA}.contacts WHERE city IS NOT NULL ORDER BY city")
            return ok({"contacts": contacts, "total": total, "status_counts": counts, "cities": [r[0] for r in cur.fetchall()]})

        if action == "get-contact":
            cid = int(headers.get("x-contact-id") or 0)
            cur.execute(f"SELECT {SELECT} FROM {SCHEMA}.contacts c WHERE c.id=%s", (cid,))
            r = cur.fetchone()
            if not r:
                return err("Не найден", 404)
            contact = row_to_contact(r)
            attach_tags(cur, [contact])
            cur.execute(f"SELECT id, staff_name, text, created_at FROM {SCHEMA}.contact_comments WHERE contact_id=%s ORDER BY id DESC", (cid,))
            contact["comments"] = [{"id": x[0], "staff_name": x[1], "text": x[2], "created_at": str(x[3])} for x in cur.fetchall()]
            cur.execute(f"SELECT id, staff_name, result, comment, created_at FROM {SCHEMA}.contact_calls WHERE contact_id=%s ORDER BY id DESC", (cid,))
            contact["calls"] = [{"id": x[0], "staff_name": x[1], "result": x[2], "comment": x[3], "created_at": str(x[4])} for x in cur.fetchall()]
            contact["deals"] = []
            if contact["client_id"]:
                cur.execute(f"""
                    SELECT d.id, d.brand, d.volume, d.amount, s.name, d.created_at
                    FROM {SCHEMA}.deals d JOIN {SCHEMA}.deal_stages s ON s.id=d.stage_id
                    WHERE d.client_id=%s AND d.trashed_at IS NULL ORDER BY d.id DESC
                """, (contact["client_id"],))
                contact["deals"] = [{"id": x[0], "brand": x[1], "volume": float(x[2]) if x[2] is not None else None,
                                     "amount": float(x[3]) if x[3] is not None else None, "stage": x[4], "created_at": str(x[5])}
                                    for x in cur.fetchall()]
            return ok({"contact": contact})

        if action == "save-contact":
            company = clean(body.get("company"))
            if not company:
                return err("Укажите название компании")
            pr = body.get("priority")
            pr = int(pr) if pr in (1, 2, 3, "1", "2", "3") else None
            status = body.get("call_status") if body.get("call_status") in STATUSES else "new"
            vals = (company, clean(body.get("segment")), clean(body.get("city")), clean(body.get("call_window")), pr,
                    clean(body.get("phone")), clean(body.get("email")), status, clean(body.get("need")),
                    clean(body.get("volume_note")), clean(body.get("important")), bool(body.get("mailing_consent")))
            cid = body.get("id")
            if cid:
                cur.execute(f"""
                    UPDATE {SCHEMA}.contacts SET company=%s, segment=%s, city=%s, call_window=%s, priority=%s, phone=%s,
                    email=%s, call_status=%s, need=%s, volume_note=%s, important=%s, mailing_consent=%s, updated_at=NOW()
                    WHERE id=%s
                """, vals + (cid,))
            else:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.contacts (company, segment, city, call_window, priority, phone, email, call_status,
                    need, volume_note, important, mailing_consent, assigned_to)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
                """, vals + (staff["id"],))
                cid = cur.fetchone()[0]
            if "tag_ids" in body:
                set_tags(cur, cid, body["tag_ids"] or [])
            conn.commit()
            return ok({"ok": True, "id": cid})

        if action == "archive-contact":
            cur.execute(f"UPDATE {SCHEMA}.contacts SET archived=%s, updated_at=NOW() WHERE id=%s",
                        (bool(body.get("archived", True)), body.get("id")))
            conn.commit()
            return ok({"ok": True})

        if action == "add-comment":
            text = clean(body.get("text"))
            if not text or not body.get("contact_id"):
                return err("Введите комментарий")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.contact_comments (contact_id, staff_id, staff_name, text)
                VALUES (%s,%s,%s,%s) RETURNING id, created_at
            """, (body["contact_id"], staff["id"], staff["name"], text))
            r = cur.fetchone()
            conn.commit()
            return ok({"comment": {"id": r[0], "staff_name": staff["name"], "text": text, "created_at": str(r[1])}}, 201)

        if action == "delete-comment":
            cur.execute(f"DELETE FROM {SCHEMA}.contact_comments WHERE id=%s", (body.get("id"),))
            conn.commit()
            return ok({"ok": True})

        if action == "log-call":
            result = body.get("result")
            if result not in STATUSES or result == "new" or not body.get("contact_id"):
                return err("Выберите результат звонка")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.contact_calls (contact_id, staff_id, staff_name, result, comment)
                VALUES (%s,%s,%s,%s,%s)
            """, (body["contact_id"], staff["id"], staff["name"], result, clean(body.get("comment"))))
            cur.execute(f"""
                UPDATE {SCHEMA}.contacts SET call_status=%s, last_call_at=NOW(), next_call_at=%s, updated_at=NOW() WHERE id=%s
            """, (result, clean(body.get("next_call_at")), body["contact_id"]))
            conn.commit()
            return ok({"ok": True})

        if action == "list-tags":
            cur.execute(f"""
                SELECT t.id, t.name, t.color, COUNT(c.id) FROM {SCHEMA}.contact_tags t
                LEFT JOIN {SCHEMA}.contact_tag_links l ON l.tag_id=t.id
                LEFT JOIN {SCHEMA}.contacts c ON c.id=l.contact_id AND c.archived=FALSE
                GROUP BY t.id ORDER BY t.name
            """)
            return ok({"tags": [{"id": r[0], "name": r[1], "color": r[2], "count": r[3]} for r in cur.fetchall()]})

        if action == "save-tag":
            name = clean(body.get("name"))
            color = body.get("color") if body.get("color") in COLORS else "gray"
            if not name:
                return err("Введите название тега")
            if body.get("id"):
                cur.execute(f"UPDATE {SCHEMA}.contact_tags SET name=%s, color=%s WHERE id=%s RETURNING id", (name, color, body["id"]))
            else:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.contact_tags (name, color) VALUES (%s,%s)
                    ON CONFLICT (name) DO UPDATE SET color=EXCLUDED.color RETURNING id
                """, (name, color))
            tid = cur.fetchone()[0]
            conn.commit()
            return ok({"ok": True, "id": tid})

        if action == "delete-tag":
            cur.execute(f"DELETE FROM {SCHEMA}.contact_tag_links WHERE tag_id=%s", (body.get("id"),))
            cur.execute(f"DELETE FROM {SCHEMA}.contact_tags WHERE id=%s", (body.get("id"),))
            conn.commit()
            return ok({"ok": True})

        if action == "bulk-tags":
            ids = [int(x) for x in body.get("contact_ids") or []]
            for t in body.get("add_tag_ids") or []:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.contact_tag_links (contact_id, tag_id)
                    SELECT c.id, %s FROM {SCHEMA}.contacts c WHERE c.id = ANY(%s) ON CONFLICT DO NOTHING
                """, (int(t), ids))
            for t in body.get("remove_tag_ids") or []:
                cur.execute(f"DELETE FROM {SCHEMA}.contact_tag_links WHERE tag_id=%s AND contact_id = ANY(%s)", (int(t), ids))
            conn.commit()
            return ok({"ok": True})

        if action == "create-deal":
            cur.execute(f"SELECT company, phone, email, city, client_id FROM {SCHEMA}.contacts WHERE id=%s", (body.get("contact_id"),))
            c = cur.fetchone()
            if not c:
                return err("Контакт не найден", 404)
            client_id = c[4]
            if not client_id:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.clients (name, phone, email, city, company) VALUES (%s,%s,%s,%s,%s) RETURNING id
                """, (c[0], c[1], c[2], c[3], c[0]))
                client_id = cur.fetchone()[0]
                cur.execute(f"UPDATE {SCHEMA}.contacts SET client_id=%s WHERE id=%s", (client_id, body["contact_id"]))
            cur.execute(f"SELECT id FROM {SCHEMA}.deal_stages ORDER BY sort_order LIMIT 1")
            st = cur.fetchone()
            if not st:
                return err("Нет ни одного этапа сделки — создайте этапы")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.deals (client_id, brand, volume, stage_id, created_by, status)
                VALUES (%s,%s,%s,%s,%s,'submitted') RETURNING id
            """, (client_id, clean(body.get("brand")), body.get("volume") or None, st[0], staff["id"]))
            deal_id = cur.fetchone()[0]
            cur.execute(f"""
                INSERT INTO {SCHEMA}.deal_stage_log (deal_id, from_stage_id, to_stage_id, staff_id, staff_name)
                VALUES (%s, NULL, %s, %s, %s)
            """, (deal_id, st[0], staff["id"], staff["name"]))
            conn.commit()
            return ok({"ok": True, "deal_id": deal_id, "client_id": client_id}, 201)

        if action == "import-contacts":
            rows = body.get("rows") or []
            cur.execute(f"SELECT id, LOWER(name) FROM {SCHEMA}.contact_tags")
            cache = {r[1]: r[0] for r in cur.fetchall()}
            cur.execute(f"SELECT LOWER(company), LOWER(COALESCE(city,'')), code FROM {SCHEMA}.contacts")
            existing = cur.fetchall()
            seen_company = {(r[0], r[1]) for r in existing}
            seen_code = {r[2] for r in existing if r[2]}
            added = skipped = 0
            for r in rows:
                company = clean(r.get("company"))
                if not company:
                    skipped += 1
                    continue
                code = clean(r.get("code"))
                city = clean(r.get("city"))
                if (code and code in seen_code) or (company.lower(), (city or "").lower()) in seen_company:
                    skipped += 1
                    continue
                pr = r.get("priority")
                pr = int(pr) if pr in (1, 2, 3, "1", "2", "3") else None
                status = r.get("call_status") if r.get("call_status") in STATUSES else "new"
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.contacts (code, company, segment, city, call_window, priority, phone, email,
                    call_status, need, volume_note, important, assigned_to)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
                """, (code, company, clean(r.get("segment")), city, clean(r.get("call_window")), pr, clean(r.get("phone")),
                      clean(r.get("email")), status, clean(r.get("need")), clean(r.get("volume_note")),
                      clean(r.get("important")), staff["id"]))
                cid = cur.fetchone()[0]
                seen_company.add((company.lower(), (city or "").lower()))
                if code:
                    seen_code.add(code)
                tag_names = [(clean(r.get("segment")), "blue"), (f"Приоритет {pr}" if pr else None, {1: "red", 2: "amber", 3: "gray"}.get(pr, "gray")),
                             (city, "slate")] + [(clean(t), "gray") for t in r.get("tags") or []]
                for name, color in tag_names:
                    if name:
                        cur.execute(f"""
                            INSERT INTO {SCHEMA}.contact_tag_links (contact_id, tag_id) VALUES (%s,%s) ON CONFLICT DO NOTHING
                        """, (cid, get_or_create_tag(cur, cache, name, color)))
                for text in r.get("comments") or []:
                    if clean(text):
                        cur.execute(f"""
                            INSERT INTO {SCHEMA}.contact_comments (contact_id, staff_name, text) VALUES (%s,'Импорт из таблицы',%s)
                        """, (cid, clean(text)))
                added += 1
            conn.commit()
            return ok({"ok": True, "added": added, "skipped": skipped})

        return err("Unknown action", 404)
    finally:
        cur.close()
        conn.close()
