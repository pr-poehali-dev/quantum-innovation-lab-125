"""Таблица расчёта цены: хранение, пересчёт и публичные цены для калькулятора."""
import json

from sheet_engine import Book, ERR, col_to_letter

SHEET_KEY = "calc_sheet"
MAX_ROWS = 60
MAX_COLS = 40


def load_sheet(cur, schema):
    cur.execute(f"SELECT value FROM {schema}.site_settings WHERE key=%s", (SHEET_KEY,))
    row = cur.fetchone()
    return json.loads(row[0]) if row else None


def validate(data):
    if not isinstance(data, dict) or not isinstance(data.get("sheets"), list) or len(data["sheets"]) != 2:
        return "Некорректная структура таблицы"
    for s in data["sheets"]:
        if not isinstance(s.get("cells"), dict):
            return "Некорректные ячейки"
        if int(s.get("rows", 0)) > MAX_ROWS or int(s.get("cols", 0)) > MAX_COLS:
            return "Таблица слишком большая"
        for a, v in s["cells"].items():
            if isinstance(v, str) and len(v) > 600:
                return f"Слишком длинное значение в ячейке {a}"
            if not isinstance(v, (str, int, float)):
                return f"Недопустимое значение в ячейке {a}"
    return None


def evaluate(data):
    """Возвращает вычисленные значения всех ячеек: {sheet_index: {addr: value}}."""
    book = Book(data["sheets"])
    out = {}
    for si, s in enumerate(data["sheets"]):
        vals = {}
        for a in s["cells"]:
            v = book.get(si, a)
            vals[a] = v if v == "" or isinstance(v, str) else round(v, 6)
        out[si] = vals
    return out


def rate_of(data):
    cell = data.get("rate_cell", "B2")
    v = data["sheets"][0]["cells"].get(cell)
    return float(v) if isinstance(v, (int, float)) else None


def product_columns(data):
    """Колонки-сорта: все непустые ячейки строки заголовков, начиная с колонки C."""
    s = data["sheets"][0]
    cols = []
    for c in range(3, int(s["cols"]) + 1):
        name = s["cells"].get(f"{col_to_letter(c)}{s['header_row']}")
        if isinstance(name, str) and name.strip():
            cols.append(c)
    return cols


def public_prices(data):
    """Итоговые цены по сортам для калькулятора: {id: {label, price_1kg, price_250g}}."""
    book = Book(data["sheets"])
    s1, s2 = data["sheets"]
    ids = data.get("col_ids", {})
    items = []
    for c in product_columns(data):
        L = col_to_letter(c)
        p1 = book.get(0, f"{L}{s1['result_row']}")
        p2 = book.get(1, f"{L}{s2['result_row']}")
        if not isinstance(p1, float) or not isinstance(p2, float):
            continue
        items.append({
            "id": int(ids.get(L, c)),
            "label": str(s1["cells"].get(f"{L}{s1['header_row']}")).strip(),
            "price_1kg": round(p1, 4),
            "price_250g": round(p2, 4),
        })
    return items


def _clean_label(text: str) -> str:
    """Название строки для клиента: без пояснения в скобках про состав упаковки."""
    t = str(text).strip()
    return t


def _short_label(text: str) -> str:
    t = _clean_label(text)
    if t.startswith("Стоимость упаковки"):
        return "Упаковка"
    if t.startswith("Транспортные расходы"):
        return "Доставка сырья"
    if t.startswith("Производственные расходы"):
        return "Производство"
    return t


def _hint(text: str) -> str:
    t = _clean_label(text)
    if "(" in t and t.startswith(("Стоимость упаковки", "Транспортные расходы", "Производственные расходы")):
        inner = t[t.index("(") + 1:]
        inner = inner.rsplit(")", 1)[0] if ")" in inner else inner
        inner = inner.replace(" (руб.", "").replace("(руб.", "").strip(" ,)")
        return inner
    return ""


def client_table(data):
    """Таблица для клиентов: значения без формул, строки в порядке исходной таблицы."""
    book = Book(data["sheets"])
    cols = product_columns(data)
    formats = []
    for si, s in enumerate(data["sheets"]):
        head = s["header_row"]
        res = s["result_row"]
        rows = []
        for r in range(1, int(s["rows"]) + 1):
            if r == head:
                continue
            label = s["cells"].get(f"B{r}")
            if not isinstance(label, str) or not label.strip():
                continue
            values = []
            numeric = False
            for c in cols:
                v = book.get(si, f"{col_to_letter(c)}{r}")
                if isinstance(v, float):
                    numeric = True
                    values.append(round(v, 2))
                else:
                    values.append(None)
            if not numeric:
                continue
            is_rate = label.strip().startswith("Курс доллара")
            if is_rate:
                continue
            rows.append({
                "row": r,
                "label": _short_label(label),
                "hint": _hint(label),
                "values": values,
                "is_total": r == res,
            })
        formats.append({
            "key": "1kg" if si == 0 else "250g",
            "title": "Пачка 1 кг" if si == 0 else "Пачка 250 г",
            "rows": rows,
        })
    products = []
    s0 = data["sheets"][0]
    for c in cols:
        L = col_to_letter(c)
        products.append({"col": L, "label": str(s0["cells"].get(f"{L}{s0['header_row']}")).strip()})
    rate = rate_of(data)
    return {"products": products, "formats": formats, "rate": rate}


def broken_products(data):
    """Сорта, у которых итоговая цена не считается (ошибка формулы или пустая ячейка)."""
    book = Book(data["sheets"])
    s1, s2 = data["sheets"]
    names = []
    for c in product_columns(data):
        L = col_to_letter(c)
        p1 = book.get(0, f"{L}{s1['result_row']}")
        p2 = book.get(1, f"{L}{s2['result_row']}")
        if not isinstance(p1, float) or not isinstance(p2, float):
            names.append(str(s1["cells"].get(f"{L}{s1['header_row']}")).strip())
    return names
