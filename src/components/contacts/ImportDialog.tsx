import { useState } from "react";
import * as XLSX from "xlsx";
import Icon from "@/components/ui/icon";
import { CONTACTS_URL, statusFromText } from "@/lib/contactsApi";

interface Props {
  authHeaders: Record<string, string>;
  onClose: () => void;
  onDone: (added: number, skipped: number) => void;
}

const FIELDS: { key: string; match: RegExp }[] = [
  { key: "code", match: /^№|^код$/i },
  { key: "priority", match: /приоритет/i },
  { key: "company", match: /компани|название/i },
  { key: "segment", match: /сегмент/i },
  { key: "city", match: /город/i },
  { key: "call_window", match: /время звонка/i },
  { key: "phone", match: /телефон/i },
  { key: "email", match: /e?-?mail|почт/i },
  { key: "called", match: /звонил/i },
  { key: "need", match: /что нужно/i },
  { key: "volume_note", match: /как часто|объ[её]м/i },
  { key: "important", match: /что важно/i },
  { key: "result", match: /результат/i },
  { key: "comment", match: /комментар/i },
];

const cell = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

const ImportDialog = ({ authHeaders, onClose, onDone }: Props) => {
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const readFile = async (file: File) => {
    setError("");
    setFileName(file.name);
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
      const hi = raw.findIndex(r => r.filter(c => FIELDS.some(f => f.match.test(cell(c)))).length >= 3);
      if (hi < 0) { setError("Не нашёл строку с заголовками колонок. Проверьте файл."); setRows(null); return; }
      const header = raw[hi].map(cell);
      const colOf: Record<string, number> = {};
      FIELDS.forEach(f => { const i = header.findIndex((h, idx) => f.match.test(h) && !Object.values(colOf).includes(idx)); if (i >= 0) colOf[f.key] = i; });
      const out: Record<string, unknown>[] = [];
      raw.slice(hi + 1).forEach(r => {
        const g = (k: string) => (colOf[k] !== undefined ? cell(r[colOf[k]]) : "");
        const company = g("company") || (g("code") ? `Без названия (${g("code")})` : g("phone") || g("email"));
        if (!company) return;
        const called = g("called");
        const comments = [called && !/^не звонил$/i.test(called) ? `Звонил?: ${called}` : "", g("result") ? `Результат звонка: ${g("result")}` : "", g("comment")].filter(Boolean);
        out.push({
          code: g("code"), priority: parseInt(g("priority")) || null, company, segment: g("segment"), city: g("city"),
          call_window: g("call_window"), phone: g("phone"), email: g("email"), call_status: statusFromText(called),
          need: g("need"), volume_note: g("volume_note"), important: g("important"), comments,
        });
      });
      setRows(out);
    } catch { setError("Не удалось прочитать файл"); setRows(null); }
  };

  const run = async () => {
    if (!rows) return;
    setBusy(true);
    let added = 0, skipped = 0;
    try {
      for (let i = 0; i < rows.length; i += 50) {
        const r = await fetch(CONTACTS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Action": "import-contacts", ...authHeaders },
          body: JSON.stringify({ rows: rows.slice(i, i + 50) }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Ошибка");
        added += d.added; skipped += d.skipped;
        setProgress(Math.min(100, Math.round(((i + 50) / rows.length) * 100)));
      }
      onDone(added, skipped);
    } catch { setError(`Загрузка прервалась. Добавлено: ${added}. Можно повторить — дубли пропустятся.`); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={busy ? undefined : onClose}>
      <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold">Импорт из Excel</h3>
          {!busy && <button onClick={onClose}><Icon name="X" size={16} /></button>}
        </div>
        <p className="text-sm text-muted-foreground">
          Загрузите таблицу с колонками вроде «Компания», «Телефон», «Email», «Город», «Сегмент», «Приоритет». Незаполненные поля — не проблема, загрузится всё, что есть. Сегмент, приоритет и город станут тегами. Уже существующие компании пропустятся.
        </p>
        <label className="block border-2 border-dashed border-border rounded-xl p-6 text-center text-sm cursor-pointer hover:border-primary transition-colors">
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" disabled={busy} onChange={e => e.target.files?.[0] && readFile(e.target.files[0])} />
          {fileName || "Выбрать файл"}
        </label>
        {rows && <p className="text-sm">Найдено компаний: <b>{rows.length}</b></p>}
        {busy && <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button onClick={run} disabled={!rows || !rows.length || busy}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40">
          {busy ? "Загружаю…" : "Загрузить в базу"}
        </button>
      </div>
    </div>
  );
};

export default ImportDialog;
