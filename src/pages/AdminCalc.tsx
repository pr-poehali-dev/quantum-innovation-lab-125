import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";
import SheetGrid from "@/components/admin/calc/SheetGrid";
import {
  Book, colToLetter, isFormula, isErr, shiftColumns, type Cell, type SheetData,
} from "@/lib/sheetEngine";

const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";

interface LeadTimeTier { max_volume: number | null; days: number }
interface Version { id: number; saved_by: string | null; created_at: string }
interface Sheet { version: number; rate_cell?: string; sheets: SheetData[]; col_ids: Record<string, number> }

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) + ", " +
  new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const numCls = "w-24 px-2 py-1.5 border border-border rounded-lg text-sm font-mono text-right focus:outline-none focus:border-primary transition-colors";

const AdminCalc = () => {
  const { token } = useStaffAuth();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [original, setOriginal] = useState("");
  const [originalSettings, setOriginalSettings] = useState("");
  const [active, setActive] = useState(0);
  const [minVolume, setMinVolume] = useState(500);
  const [volumeStep, setVolumeStep] = useState(5);
  const [tiers, setTiers] = useState<LeadTimeTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const authHeaders = { "X-Staff-Token": token || "" };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), ok ? 3000 : 6000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        fetch(ABOUT_URL, { headers: { "X-Action": "get-calc-sheet", ...authHeaders } }).then(r => r.json()),
        fetch(ABOUT_URL, { headers: { "X-Action": "get-calc" } }).then(r => r.json()),
      ]);
      if (s.sheet) { setSheet(s.sheet); setOriginal(JSON.stringify(s.sheet)); }
      setMinVolume(c.min_volume || 500);
      setVolumeStep(c.volume_step || 5);
      setTiers(c.lead_time_tiers || []);
      setOriginalSettings(JSON.stringify([c.min_volume || 500, c.volume_step || 5, c.lead_time_tiers || []]));
    } catch { showToast("Ошибка загрузки", false); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);

  const settingsKey = JSON.stringify([minVolume, volumeStep, tiers]);
  const dirty = !!sheet && (JSON.stringify(sheet) !== original || settingsKey !== originalSettings);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const book = useMemo(() => (sheet ? new Book(sheet.sheets) : null), [sheet]);

  const problems = useMemo(() => {
    if (!sheet || !book) return [] as string[];
    const list: string[] = [];
    sheet.sheets.forEach((s, si) => {
      Object.keys(s.cells).forEach(a => {
        if (isFormula(s.cells[a]) && isErr(book.get(si, a))) list.push(`${s.name}: ${a}`);
      });
    });
    return list;
  }, [sheet, book]);

  const changeCell = (si: number, a: string, value: Cell | undefined) => {
    setSheet(prev => {
      if (!prev) return prev;
      const sheets = prev.sheets.map((s, i) => {
        if (i !== si) return s;
        const cells = { ...s.cells };
        if (value === undefined) delete cells[a]; else cells[a] = value;
        return { ...s, cells };
      });
      return { ...prev, sheets };
    });
  };

  const addProduct = () => {
    if (!sheet) return;
    const s1 = sheet.sheets[0];
    const last = s1.cols;
    if (last >= 40) { showToast("Достигнут максимум сортов", false); return; }
    const newCol = last + 1;
    const L = colToLetter(newCol);
    const prevL = colToLetter(last);
    const sheets = sheet.sheets.map(s => {
      const cells = { ...s.cells };
      Object.keys(s.cells).forEach(a => {
        const m = /^([A-Z]+)(\d+)$/.exec(a);
        if (!m || m[1] !== prevL || Number(m[2]) === s.header_row) return;
        const v = s.cells[a];
        cells[`${L}${m[2]}`] = isFormula(v) ? shiftColumns(v, 1) : v;
      });
      cells[`${L}${s.header_row}`] = "Новый сорт";
      return { ...s, cols: newCol, cells };
    });
    setSheet({ ...sheet, sheets });
    showToast("Добавлен столбец «Новый сорт» — переименуйте его и впишите цену");
  };

  const removeProduct = () => {
    if (!sheet) return;
    const s1 = sheet.sheets[0];
    const last = s1.cols;
    if (last <= 3) { showToast("Должен остаться хотя бы один сорт", false); return; }
    const L = colToLetter(last);
    const name = s1.cells[`${L}${s1.header_row}`];
    if (!confirm(`Удалить последний сорт «${name}»?`)) return;
    const sheets = sheet.sheets.map(s => {
      const cells = { ...s.cells };
      Object.keys(cells).forEach(a => { if (a.replace(/[0-9]/g, "") === L) delete cells[a]; });
      return { ...s, cols: last - 1, cells };
    });
    setSheet({ ...sheet, sheets });
  };

  const save = async () => {
    if (!sheet) return;
    if (problems.length) { showToast(`Есть ошибки в формулах: ${problems.slice(0, 3).join(", ")}`, false); return; }
    setSaving(true);
    try {
      const r = await fetch(ABOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "save-calc-sheet", ...authHeaders },
        body: JSON.stringify({ sheet }),
      });
      const d = await r.json();
      if (!r.ok) { showToast(d.error || "Ошибка сохранения", false); return; }
      const next = { ...sheet, col_ids: d.col_ids || sheet.col_ids };
      setSheet(next);
      setOriginal(JSON.stringify(next));

      await fetch(ABOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "save-calc", ...authHeaders },
        body: JSON.stringify({ min_volume: minVolume, volume_step: volumeStep, lead_time_tiers: tiers }),
      });
      setOriginalSettings(settingsKey);
      showToast("Сохранено — цены обновились на сайте и в кабинете ✓");
    } catch { showToast("Ошибка сети", false); }
    finally { setSaving(false); }
  };

  const openHistory = async () => {
    setHistoryOpen(o => !o);
    if (historyOpen) return;
    const r = await fetch(ABOUT_URL, { headers: { "X-Action": "list-sheet-history", ...authHeaders } }).then(x => x.json()).catch(() => ({}));
    setVersions(r.versions || []);
  };

  const restore = async (id: number) => {
    if (dirty && !confirm("Несохранённые изменения будут потеряны. Продолжить?")) return;
    const r = await fetch(ABOUT_URL, { headers: { "X-Action": "get-sheet-version", "X-Version-Id": String(id), ...authHeaders } }).then(x => x.json());
    if (r.sheet) { setSheet(r.sheet); setHistoryOpen(false); showToast("Версия загружена в таблицу — нажмите «Сохранить», чтобы применить"); }
  };

  const rate = sheet ? sheet.sheets[0].cells[sheet.rate_cell || "B2"] : undefined;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors"><Icon name="ArrowLeft" size={16} /></Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2 min-w-0">
              <Icon name="Table2" size={16} className="text-primary flex-shrink-0" />
              <span className="font-semibold text-sm truncate">Таблица расчёта цены</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {dirty && <span className="hidden sm:inline text-[12px] text-amber-600 font-medium">Есть несохранённые изменения</span>}
            <button onClick={save} disabled={saving || !dirty}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50">
              {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Save" size={14} />}
              Сохранить
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium max-w-[92vw] ${toast.ok ? "bg-green-500 text-white" : "bg-destructive text-white"}`}>
          <Icon name={toast.ok ? "Check" : "AlertCircle"} size={14} className="flex-shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {loading || !sheet ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <section className="space-y-3">
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-[13px] text-muted-foreground flex items-start gap-2.5">
                <Icon name="Info" size={15} className="text-primary flex-shrink-0 mt-0.5" />
                <span>
                  Это та же таблица, что и в Google, с теми же формулами. Меняйте цифры или формулы — после сохранения цены сразу обновятся в калькуляторе,
                  в личном кабинете и в таблице «Подробнее о стоимости». Курс доллара — ячейка <b>B2</b> (текущий: <b>{typeof rate === "number" ? rate : "—"} ₽</b>).
                  Чтобы изменить ячейку, нажмите на неё и начните вводить; формула начинается со знака «=».
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex gap-1 bg-secondary/40 rounded-xl p-1 max-w-full overflow-x-auto">
                  {sheet.sheets.map((s, i) => (
                    <button key={s.name} onClick={() => setActive(i)}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${active === i ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      {i === 0 ? "Цена за 1 кг" : "Цена за 250 г"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={addProduct}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-primary border border-primary/30 hover:bg-primary/5 px-3 py-1.5 rounded-full transition-all">
                    <Icon name="Plus" size={13} /> Добавить сорт
                  </button>
                  <button onClick={removeProduct}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground border border-border hover:text-destructive hover:border-destructive/40 px-3 py-1.5 rounded-full transition-all">
                    <Icon name="Minus" size={13} /> Убрать последний
                  </button>
                  <button onClick={openHistory}
                    className="flex items-center gap-1.5 text-[13px] font-medium border border-border hover:bg-secondary/40 px-3 py-1.5 rounded-full transition-all">
                    <Icon name="History" size={13} /> История
                  </button>
                </div>
              </div>

              {historyOpen && (
                <div className="bg-card border border-border rounded-xl p-3 space-y-1.5">
                  {versions.length === 0 ? <p className="text-sm text-muted-foreground px-1 py-2">Пока нет сохранённых версий</p> : versions.map(v => (
                    <div key={v.id} className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg hover:bg-secondary/40">
                      <span className="text-sm">{fmtDate(v.created_at)} <span className="text-muted-foreground">· {v.saved_by || "—"}</span></span>
                      <button onClick={() => restore(v.id)} className="text-[12px] font-medium text-primary hover:underline">Загрузить</button>
                    </div>
                  ))}
                </div>
              )}

              {problems.length > 0 && (
                <div className="bg-destructive/8 border border-destructive/25 rounded-xl px-4 py-3 text-[13px] text-destructive flex items-start gap-2">
                  <Icon name="AlertCircle" size={15} className="flex-shrink-0 mt-0.5" />
                  <span>Ошибка в формулах: {problems.slice(0, 6).join(", ")}{problems.length > 6 ? ` и ещё ${problems.length - 6}` : ""}. Сохранить нельзя, пока не исправите.</span>
                </div>
              )}

              <SheetGrid sheets={sheet.sheets} active={active} onChange={changeCell} />

              <p className="text-[12px] text-muted-foreground">
                Стрелки — перемещение · Enter или двойной щелчок — правка · Delete — очистить ячейку · Tab — вправо. Ячейки с формулой отмечены уголком; формулу видно в строке сверху.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl font-bold mb-1">Объём заказа</h2>
              <p className="text-sm text-muted-foreground mb-3">Минимальный объём одной позиции и шаг ползунка в калькуляторе</p>
              <div className="bg-card border border-border rounded-xl p-5 flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Минимальный объём</label>
                  <input type="number" min={1} value={minVolume} onChange={e => setMinVolume(parseInt(e.target.value) || 0)} className={numCls} />
                  <span className="text-sm text-muted-foreground">кг</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Шаг</label>
                  <input type="number" min={1} value={volumeStep} onChange={e => setVolumeStep(parseInt(e.target.value) || 1)} className={numCls} />
                  <span className="text-sm text-muted-foreground">кг</span>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                <h2 className="font-serif text-xl font-bold">Сроки производства</h2>
                <button
                  onClick={() => setTiers(prev => [...prev.slice(0, -1), { max_volume: (prev[prev.length - 2]?.max_volume ?? 0) + 500, days: prev[prev.length - 1]?.days ?? 20 }, prev[prev.length - 1]])}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 px-3 py-1.5 rounded-full transition-all">
                  <Icon name="Plus" size={14} /> Добавить порог
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Срок изготовления партии в днях в зависимости от объёма позиции</p>
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                {tiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-muted-foreground w-8 flex-shrink-0">до</span>
                    {tier.max_volume === null ? (
                      <span className="w-28 px-2 py-1.5 text-sm font-mono text-muted-foreground">и больше</span>
                    ) : (
                      <input type="number" min={1} value={tier.max_volume}
                        onChange={e => setTiers(prev => prev.map((t, i) => i === idx ? { ...t, max_volume: parseInt(e.target.value) || 0 } : t))}
                        className="w-28 px-2 py-1.5 border border-border rounded-lg text-sm font-mono text-right focus:outline-none focus:border-primary transition-colors" />
                    )}
                    <span className="text-sm text-muted-foreground flex-shrink-0">кг →</span>
                    <input type="number" min={1} value={tier.days}
                      onChange={e => setTiers(prev => prev.map((t, i) => i === idx ? { ...t, days: parseInt(e.target.value) || 0 } : t))}
                      className="w-20 px-2 py-1.5 border border-border rounded-lg text-sm font-mono text-right focus:outline-none focus:border-primary transition-colors" />
                    <span className="text-sm text-muted-foreground flex-shrink-0">дней</span>
                    {tiers.length > 1 && (
                      <button onClick={() => setTiers(prev => prev.filter((_, i) => i !== idx))}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all ml-auto">
                        <Icon name="Trash2" size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-muted-foreground mt-2">Настройки объёма и сроков сохраняются вместе с таблицей кнопкой «Сохранить».</p>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCalc;
