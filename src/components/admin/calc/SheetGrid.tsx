import { useEffect, useMemo, useRef, useState } from "react";
import {
  Book, addr, colToLetter, formatValue, isErr, isFormula, parseInput, type Cell, type SheetData,
} from "@/lib/sheetEngine";

interface Props {
  sheets: SheetData[];
  active: number;
  onChange: (sheetIdx: number, address: string, value: Cell | undefined) => void;
  readOnly?: boolean;
}

const ROW_H = 30;
const HEAD_W = 40;

const SheetGrid = ({ sheets, active, onChange, readOnly }: Props) => {
  const sheet = sheets[active];
  const book = useMemo(() => new Book(sheets), [sheets]);
  const [sel, setSel] = useState<string>("C5");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const formulaRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSel(`C${sheet.header_row + 1}`); setEditing(null); }, [active, sheet.header_row]);
  useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); } }, [editing]);

  const selCol = sel.replace(/[^A-Z]/g, "").split("").reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
  const selRow = Number(sel.replace(/[^0-9]/g, ""));

  const rawOf = (a: string): Cell | undefined => sheet.cells[a];
  const display = (a: string) => {
    const raw = rawOf(a);
    if (raw === undefined) return "";
    if (typeof raw === "string" && !isFormula(raw)) return raw;
    const v = book.get(active, a);
    return isErr(v) ? String(v) : formatValue(v, 4);
  };

  const startEdit = (a: string, initial?: string) => {
    if (readOnly) return;
    const raw = rawOf(a);
    setEditing(a);
    setDraft(initial ?? (raw === undefined ? "" : String(raw)));
  };

  const commit = (move?: "down" | "right" | "none") => {
    if (!editing) return;
    const next = parseInput(draft);
    if (next !== rawOf(editing)) onChange(active, editing, next);
    const col = editing.replace(/[0-9]/g, "");
    const row = Number(editing.replace(/[^0-9]/g, ""));
    setEditing(null);
    if (move === "down") setSel(`${col}${Math.min(sheet.rows, row + 1)}`);
    else if (move === "right") {
      const c = col.split("").reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
      setSel(addr(Math.min(sheet.cols, c + 1), row));
    }
    wrapRef.current?.focus();
  };

  const moveSel = (dc: number, dr: number) => {
    const c = Math.min(sheet.cols, Math.max(1, selCol + dc));
    const r = Math.min(sheet.rows, Math.max(1, selRow + dr));
    setSel(addr(c, r));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (editing) return;
    if (e.key === "ArrowDown") { e.preventDefault(); moveSel(0, 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveSel(0, -1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); moveSel(-1, 0); }
    else if (e.key === "ArrowRight" || e.key === "Tab") { e.preventDefault(); moveSel(1, 0); }
    else if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); startEdit(sel); }
    else if (e.key === "Delete" || e.key === "Backspace") { if (!readOnly && rawOf(sel) !== undefined) onChange(active, sel, undefined); }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); startEdit(sel, e.key); }
  };

  const selRaw = rawOf(sel);
  const selValue = selRaw !== undefined && isFormula(selRaw) ? book.get(active, sel) : undefined;

  const colWidth = (c: number) => (c === 1 ? 44 : c === 2 ? 300 : 140);
  const cols = Array.from({ length: sheet.cols }, (_, i) => i + 1);
  const rows = Array.from({ length: sheet.rows }, (_, i) => i + 1);


  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white">
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border bg-secondary/30">
        <div className="w-16 text-center text-[12px] font-mono font-semibold bg-white border border-border rounded px-2 py-1">{sel}</div>
        <span className="text-[13px] italic text-muted-foreground select-none px-1">fx</span>
        <input
          ref={formulaRef}
          value={editing === sel ? draft : selRaw === undefined ? "" : String(selRaw)}
          readOnly={readOnly}
          onFocus={() => { if (!readOnly && editing !== sel) startEdit(sel); }}
          onChange={e => { if (editing !== sel) startEdit(sel, e.target.value); else setDraft(e.target.value); }}
          onKeyDown={e => {
            if (e.key === "Enter") { e.preventDefault(); commit("down"); }
            else if (e.key === "Escape") { setEditing(null); wrapRef.current?.focus(); }
          }}
          onBlur={() => { if (editing === sel && document.activeElement !== inputRef.current) commit("none"); }}
          placeholder={readOnly ? "" : "Число, текст или формула, например =C5*0.5+D5*0.5"}
          className="flex-1 min-w-0 px-2.5 py-1 text-[13px] font-mono bg-white border border-border rounded focus:outline-none focus:border-primary transition-colors"
        />
        {selValue !== undefined && (
          <span className={`text-[12px] font-mono px-2 whitespace-nowrap ${isErr(selValue) ? "text-destructive" : "text-muted-foreground"}`}>
            = {isErr(selValue) ? selValue : formatValue(selValue, 6)}
          </span>
        )}
      </div>

      <div ref={wrapRef} tabIndex={0} onKeyDown={onKeyDown} className="overflow-auto max-h-[62vh] outline-none">
        <table className="border-collapse text-[13px]" style={{ tableLayout: "fixed", width: HEAD_W + cols.reduce((n, c) => n + colWidth(c), 0) }}>
          <colgroup>
            <col style={{ width: HEAD_W }} />
            {cols.map(c => <col key={c} style={{ width: colWidth(c) }} />)}
          </colgroup>
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 bg-secondary border border-border" style={{ height: 26 }} />
              {cols.map(c => (
                <th key={c} className={`sticky top-0 z-20 border border-border font-normal text-[11px] text-muted-foreground ${c === selCol ? "bg-primary/15 text-primary font-semibold" : "bg-secondary"}`}>
                  {colToLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const isHead = r === sheet.header_row;
              const isResult = r === sheet.result_row;
              return (
                <tr key={r} style={{ height: ROW_H }}>
                  <th className={`sticky left-0 z-10 border border-border font-normal text-[11px] ${r === selRow ? "bg-primary/15 text-primary font-semibold" : "bg-secondary text-muted-foreground"}`}>{r}</th>
                  {cols.map(c => {
                    const a = addr(c, r);
                    const raw = rawOf(a);
                    const isSel = a === sel;
                    const isEdit = editing === a;
                    const formula = isFormula(raw);
                    const text = display(a);
                    const err = text.startsWith("#");
                    const numeric = typeof raw === "number" || (formula && !err);
                    const isLabelCol = c <= 2;
                    return (
                      <td
                        key={a}
                        onMouseDown={() => { if (editing && editing !== a) commit("none"); setSel(a); }}
                        onDoubleClick={() => startEdit(a)}
                        title={formula ? String(raw) : undefined}
                        className={`relative border border-border px-2 overflow-hidden ${
                          isHead ? "bg-secondary/60 font-semibold" : isResult ? "bg-primary/8 font-semibold" : isLabelCol ? "bg-secondary/20" : "bg-white"
                        } ${numeric && !isLabelCol ? "text-right" : ""} ${err ? "text-destructive" : ""} ${isSel ? "outline outline-2 outline-primary -outline-offset-1 z-10" : ""}`}
                      >
                        {isEdit ? (
                          <input
                            ref={inputRef}
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onBlur={() => { if (document.activeElement !== formulaRef.current) commit("none"); }}
                            onKeyDown={e => {
                              if (e.key === "Enter") { e.preventDefault(); commit("down"); }
                              else if (e.key === "Tab") { e.preventDefault(); commit("right"); }
                              else if (e.key === "Escape") { setEditing(null); wrapRef.current?.focus(); }
                            }}
                            className="absolute inset-0 w-full h-full px-2 text-[13px] font-mono bg-white outline-none"
                          />
                        ) : (
                          <span className={`block ${c === 2 ? "whitespace-normal leading-tight py-0.5 text-[12px]" : "truncate"}`}
                            style={c === 2 ? { maxHeight: ROW_H, overflow: "hidden" } : undefined}>
                            {text}
                          </span>
                        )}
                        {formula && !isEdit && !err && <span className="absolute top-0 right-0 w-0 h-0 border-t-[6px] border-l-[6px] border-t-primary/60 border-l-transparent" />}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SheetGrid;
