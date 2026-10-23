export type Cell = string | number;

export interface SheetData {
  name: string;
  header_row: number;
  result_row: number;
  rows: number;
  cols: number;
  cells: Record<string, Cell>;
}

export interface CalcSheet {
  version: number;
  sheets: SheetData[];
  col_ids: Record<string, number>;
}

export type Value = number | string;

export const ERR = "#ОШИБКА";

export const isErr = (v: Value | undefined): boolean => typeof v === "string" && v.startsWith("#");

export const colToLetter = (n: number): string => {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

export const letterToCol = (s: string): number => {
  let n = 0;
  for (const ch of s) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
};

export const addr = (col: number, row: number) => `${colToLetter(col)}${row}`;

export const parseAddr = (a: string): { col: number; row: number } | null => {
  const m = /^\$?([A-Z]{1,3})\$?(\d+)$/.exec(a);
  return m ? { col: letterToCol(m[1]), row: Number(m[2]) } : null;
};

export const isFormula = (c: Cell | undefined): c is string => typeof c === "string" && c.startsWith("=");

export const parseInput = (raw: string): Cell | undefined => {
  const t = raw.trim();
  if (t === "") return undefined;
  if (t.startsWith("=")) return t;
  if (/^-?\d+([.,]\d+)?$/.test(t)) return Number(t.replace(",", "."));
  return raw;
};

class FormulaError extends Error {}

type Tok =
  | { t: "num"; v: number }
  | { t: "ref"; sheet?: string; a: string }
  | { t: "range"; sheet?: string; a: string; b: string }
  | { t: "fn"; v: string }
  | { t: "op"; v: string };

const REF = "(?:(?:'([^']+)'|([A-Za-z0-9_\\u0400-\\u04FF]+))!)?(\\$?[A-Z]{1,3}\\$?\\d+)";
const TOKEN = new RegExp(
  `\\s*(?:(\\d+(?:\\.\\d+)?)|${REF}(?::(\\$?[A-Z]{1,3}\\$?\\d+))?|([A-Z][A-Z0-9.]*)\\(|([-+*/^%(),;]))`,
  "y",
);

const tokenize = (src: string): Tok[] => {
  const out: Tok[] = [];
  TOKEN.lastIndex = 0;
  let pos = 0;
  while (pos < src.length) {
    if (/^\s*$/.test(src.slice(pos))) break;
    TOKEN.lastIndex = pos;
    const m = TOKEN.exec(src);
    if (!m) throw new FormulaError("syntax");
    pos = TOKEN.lastIndex;
    if (m[1] !== undefined) out.push({ t: "num", v: Number(m[1]) });
    else if (m[4] !== undefined) {
      const sheet = m[2] ?? m[3];
      if (m[5]) out.push({ t: "range", sheet, a: m[4], b: m[5] });
      else out.push({ t: "ref", sheet, a: m[4] });
    } else if (m[6] !== undefined) out.push({ t: "fn", v: m[6] });
    else if (m[7] !== undefined) out.push({ t: "op", v: m[7] });
  }
  return out;
};

type Arg = number | number[];

export class Book {
  private cache = new Map<string, Value>();
  private busy = new Set<string>();

  constructor(public sheets: SheetData[]) {}

  private sheetIndex(name: string | undefined, current: number): number {
    if (!name) return current;
    const i = this.sheets.findIndex(s => s.name === name);
    if (i < 0) throw new FormulaError("sheet");
    return i;
  }

  get(sheetIdx: number, a: string): Value {
    const key = `${sheetIdx}!${a.replace(/\$/g, "")}`;
    const hit = this.cache.get(key);
    if (hit !== undefined) return hit;
    if (this.busy.has(key)) return ERR;
    const raw = this.sheets[sheetIdx]?.cells[a.replace(/\$/g, "")];
    let val: Value;
    if (raw === undefined || raw === null) val = "";
    else if (typeof raw === "number") val = raw;
    else if (raw.startsWith("=")) {
      this.busy.add(key);
      try {
        val = this.evalFormula(raw.slice(1), sheetIdx);
      } catch {
        val = ERR;
      }
      this.busy.delete(key);
    } else val = raw;
    this.cache.set(key, val);
    return val;
  }

  num(sheetIdx: number, a: string): number | null {
    const v = this.get(sheetIdx, a);
    return typeof v === "number" ? v : null;
  }

  private numericOf(v: Value): number {
    if (typeof v === "number") return v;
    if (v === "") return 0;
    throw new FormulaError("value");
  }

  private evalFormula(src: string, cur: number): number {
    const toks = tokenize(src);
    let i = 0;
    const peek = () => toks[i];
    const isOp = (v: string) => peek()?.t === "op" && (peek() as { v: string }).v === v;

    const rangeValues = (sheetName: string | undefined, a: string, b: string): number[] => {
      const si = this.sheetIndex(sheetName, cur);
      const p = parseAddr(a);
      const q = parseAddr(b);
      if (!p || !q) throw new FormulaError("range");
      const out: number[] = [];
      for (let c = Math.min(p.col, q.col); c <= Math.max(p.col, q.col); c++) {
        for (let r = Math.min(p.row, q.row); r <= Math.max(p.row, q.row); r++) {
          const v = this.get(si, addr(c, r));
          if (isErr(v)) throw new FormulaError("ref");
          if (typeof v === "number") out.push(v);
        }
      }
      return out;
    };

    const expr = (): number => {
      let v = term();
      while (isOp("+") || isOp("-")) {
        const op = (toks[i++] as { v: string }).v;
        const r = term();
        v = op === "+" ? v + r : v - r;
      }
      return v;
    };

    const term = (): number => {
      let v = power();
      while (isOp("*") || isOp("/")) {
        const op = (toks[i++] as { v: string }).v;
        const r = power();
        if (op === "/" && r === 0) throw new FormulaError("div0");
        v = op === "*" ? v * r : v / r;
      }
      return v;
    };

    const power = (): number => {
      const base = unary();
      if (isOp("^")) { i++; return Math.pow(base, power()); }
      return base;
    };

    const unary = (): number => {
      if (isOp("-")) { i++; return -unary(); }
      if (isOp("+")) { i++; return unary(); }
      let v = primary();
      while (isOp("%")) { i++; v /= 100; }
      return v;
    };

    const callFn = (name: string, args: Arg[]): number => {
      const flat = args.flatMap(a => (Array.isArray(a) ? a : [a]));
      switch (name) {
        case "SUM": return flat.reduce((s, x) => s + x, 0);
        case "AVERAGE": if (!flat.length) throw new FormulaError("div0"); return flat.reduce((s, x) => s + x, 0) / flat.length;
        case "MIN": return flat.length ? Math.min(...flat) : 0;
        case "MAX": return flat.length ? Math.max(...flat) : 0;
        case "ABS": return Math.abs(flat[0] ?? 0);
        case "ROUND": { const d = Math.pow(10, Number(args[1] ?? 0)); return Math.round(flat[0] * d) / d; }
        case "ROUNDUP": { const d = Math.pow(10, Number(args[1] ?? 0)); return Math.ceil(flat[0] * d) / d; }
        case "ROUNDDOWN": { const d = Math.pow(10, Number(args[1] ?? 0)); return Math.floor(flat[0] * d) / d; }
        default: throw new FormulaError("fn");
      }
    };

    const primary = (): number => {
      const tk = toks[i++];
      if (!tk) throw new FormulaError("end");
      if (tk.t === "num") return tk.v;
      if (tk.t === "ref") return this.numericOf(this.get(this.sheetIndex(tk.sheet, cur), tk.a));
      if (tk.t === "range") throw new FormulaError("range");
      if (tk.t === "fn") {
        const args: Arg[] = [];
        if (!isOp(")")) {
          for (;;) {
            const nx = peek();
            if (nx && nx.t === "range") { i++; args.push(rangeValues(nx.sheet, nx.a, nx.b)); }
            else args.push(expr());
            if (isOp(",") || isOp(";")) { i++; continue; }
            break;
          }
        }
        if (!isOp(")")) throw new FormulaError("paren");
        i++;
        return callFn(tk.v, args);
      }
      if (tk.v === "(") {
        const v = expr();
        if (!isOp(")")) throw new FormulaError("paren");
        i++;
        return v;
      }
      throw new FormulaError("token");
    };

    const result = expr();
    if (i < toks.length) throw new FormulaError("extra");
    if (!Number.isFinite(result)) throw new FormulaError("nan");
    return result;
  }
}

const REF_RE = /((?:'[^']+'|[A-Za-z0-9_\u0400-\u04FF]+)!)?(\$?)([A-Z]{1,3})(\$?)(\d+)/g;

export const rewriteRefs = (
  formula: string,
  fn: (ref: { col: number; row: number; colAbs: boolean; rowAbs: boolean }) => { col: number; row: number } | null,
): string =>
  formula.replace(REF_RE, (_m, sheet = "", cAbs, col, rAbs, row) => {
    const next = fn({ col: letterToCol(col), row: Number(row), colAbs: cAbs === "$", rowAbs: rAbs === "$" });
    if (!next || next.col < 1) return "#REF!";
    return `${sheet}${cAbs}${colToLetter(next.col)}${rAbs}${next.row}`;
  });

export const shiftColumns = (formula: string, delta: number): string =>
  rewriteRefs(formula, r => ({ col: r.colAbs ? r.col : r.col + delta, row: r.row }));

export const formatValue = (v: Value | undefined, maxFraction = 2): string => {
  if (v === undefined || v === "") return "";
  if (typeof v === "number") return v.toLocaleString("ru-RU", { maximumFractionDigits: maxFraction });
  return v;
};
