"""Движок формул таблицы расчёта: те же функции, что в Google Таблицах (SUM, ROUND и т.д.)."""
import math
import re

ERR = "#ОШИБКА"


class FormulaError(Exception):
    pass


_REF = r"(?:(?:'(?P<qs>[^']+)'|(?P<ps>[A-Za-z0-9_\u0400-\u04FF]+))!)?(?P<a>\$?[A-Z]{1,3}\$?\d+)(?::(?P<b>\$?[A-Z]{1,3}\$?\d+))?"
_TOKEN = re.compile(
    r"\s*(?:(?P<num>\d+(?:\.\d+)?)|(?P<ref>" + _REF + r")|(?P<fn>[A-Z][A-Z0-9.]*)\(|(?P<op>[-+*/^%(),;]))"
)
_ADDR = re.compile(r"^\$?([A-Z]{1,3})\$?(\d+)$")


def col_to_letter(n: int) -> str:
    s = ""
    while n > 0:
        n, m = divmod(n - 1, 26)
        s = chr(65 + m) + s
    return s


def letter_to_col(s: str) -> int:
    n = 0
    for ch in s:
        n = n * 26 + (ord(ch) - 64)
    return n


def parse_addr(a: str):
    m = _ADDR.match(a)
    if not m:
        raise FormulaError("addr")
    return letter_to_col(m.group(1)), int(m.group(2))


def tokenize(src: str):
    out = []
    pos = 0
    while pos < len(src):
        if src[pos:].strip() == "":
            break
        m = _TOKEN.match(src, pos)
        if not m or m.end() == pos:
            raise FormulaError("syntax")
        pos = m.end()
        if m.group("num") is not None:
            out.append(("num", float(m.group("num"))))
        elif m.group("ref") is not None:
            sheet = m.group("qs") or m.group("ps")
            if m.group("b"):
                out.append(("range", sheet, m.group("a"), m.group("b")))
            else:
                out.append(("ref", sheet, m.group("a")))
        elif m.group("fn") is not None:
            out.append(("fn", m.group("fn")))
        else:
            out.append(("op", m.group("op")))
    return out


class Book:
    def __init__(self, sheets):
        self.sheets = sheets
        self.cache = {}
        self.busy = set()

    def _sheet_index(self, name, current):
        if not name:
            return current
        for i, s in enumerate(self.sheets):
            if s["name"] == name:
                return i
        raise FormulaError("sheet")

    def get(self, si: int, a: str):
        a = a.replace("$", "")
        key = (si, a)
        if key in self.cache:
            return self.cache[key]
        if key in self.busy:
            return ERR
        raw = self.sheets[si]["cells"].get(a)
        if raw is None:
            val = ""
        elif isinstance(raw, (int, float)) and not isinstance(raw, bool):
            val = float(raw)
        elif isinstance(raw, str) and raw.startswith("="):
            self.busy.add(key)
            try:
                val = self._eval(raw[1:], si)
            except (FormulaError, ZeroDivisionError, OverflowError, ValueError, RecursionError):
                val = ERR
            self.busy.discard(key)
        else:
            val = str(raw)
        self.cache[key] = val
        return val

    def _numeric(self, v):
        if isinstance(v, float):
            return v
        if v == "":
            return 0.0
        raise FormulaError("value")

    def _eval(self, src: str, cur: int) -> float:
        toks = tokenize(src)
        pos = [0]

        def peek():
            return toks[pos[0]] if pos[0] < len(toks) else None

        def is_op(v):
            t = peek()
            return t is not None and t[0] == "op" and t[1] == v

        def range_values(sheet, a, b):
            si = self._sheet_index(sheet, cur)
            c1, r1 = parse_addr(a)
            c2, r2 = parse_addr(b)
            out = []
            for c in range(min(c1, c2), max(c1, c2) + 1):
                for r in range(min(r1, r2), max(r1, r2) + 1):
                    v = self.get(si, f"{col_to_letter(c)}{r}")
                    if v == ERR:
                        raise FormulaError("ref")
                    if isinstance(v, float):
                        out.append(v)
            return out

        def expr():
            v = term()
            while is_op("+") or is_op("-"):
                op = toks[pos[0]][1]
                pos[0] += 1
                r = term()
                v = v + r if op == "+" else v - r
            return v

        def term():
            v = power()
            while is_op("*") or is_op("/"):
                op = toks[pos[0]][1]
                pos[0] += 1
                r = power()
                if op == "/":
                    if r == 0:
                        raise FormulaError("div0")
                    v = v / r
                else:
                    v = v * r
            return v

        def power():
            base = unary()
            if is_op("^"):
                pos[0] += 1
                return math.pow(base, power())
            return base

        def unary():
            if is_op("-"):
                pos[0] += 1
                return -unary()
            if is_op("+"):
                pos[0] += 1
                return unary()
            v = primary()
            while is_op("%"):
                pos[0] += 1
                v /= 100
            return v

        def call(name, args):
            flat = []
            for a in args:
                flat.extend(a if isinstance(a, list) else [a])
            if name == "SUM":
                return sum(flat)
            if name == "AVERAGE":
                if not flat:
                    raise FormulaError("div0")
                return sum(flat) / len(flat)
            if name == "MIN":
                return min(flat) if flat else 0.0
            if name == "MAX":
                return max(flat) if flat else 0.0
            if name == "ABS":
                return abs(flat[0]) if flat else 0.0
            if name in ("ROUND", "ROUNDUP", "ROUNDDOWN"):
                d = 10 ** int(args[1] if len(args) > 1 and not isinstance(args[1], list) else 0)
                x = flat[0] * d
                if name == "ROUND":
                    return math.floor(abs(x) + 0.5) * (1 if x >= 0 else -1) / d
                return (math.ceil(x) if name == "ROUNDUP" else math.floor(x)) / d
            raise FormulaError("fn")

        def primary():
            if pos[0] >= len(toks):
                raise FormulaError("end")
            tk = toks[pos[0]]
            pos[0] += 1
            kind = tk[0]
            if kind == "num":
                return tk[1]
            if kind == "ref":
                return self._numeric(self.get(self._sheet_index(tk[1], cur), tk[2]))
            if kind == "range":
                raise FormulaError("range")
            if kind == "fn":
                args = []
                if not is_op(")"):
                    while True:
                        nx = peek()
                        if nx is not None and nx[0] == "range":
                            pos[0] += 1
                            args.append(range_values(nx[1], nx[2], nx[3]))
                        else:
                            args.append(expr())
                        if is_op(",") or is_op(";"):
                            pos[0] += 1
                            continue
                        break
                if not is_op(")"):
                    raise FormulaError("paren")
                pos[0] += 1
                return call(tk[1], args)
            if tk[1] == "(":
                v = expr()
                if not is_op(")"):
                    raise FormulaError("paren")
                pos[0] += 1
                return v
            raise FormulaError("token")

        result = expr()
        if pos[0] < len(toks):
            raise FormulaError("extra")
        if math.isnan(result) or math.isinf(result):
            raise FormulaError("nan")
        return result
