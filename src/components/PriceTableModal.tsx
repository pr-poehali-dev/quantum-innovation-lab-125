import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCalcData } from "@/lib/calcCore";
import {
  PRICE_MODAL_EVENT, fmtPrice, usePriceTable, type PriceFormat, type PriceTableData,
} from "@/lib/priceTable";

const stamp = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "";

const cleanLabel = (label: string) => label.replace(/\s*\(руб\.[^)]*\)\s*$/, "").trim();

const COLS = "grid-cols-[minmax(0,1fr)_72px_72px_24px] sm:grid-cols-[minmax(0,1fr)_110px_110px_28px]";

const DESK = "grid-cols-[minmax(190px,1.6fr)_1fr_0.8fr_1.2fr_1.1fr_0.8fr_0.7fr_104px]";

const unifyHint = (h: string) => h.replace(/пакет на [\d,]+ кг кофе/, "пакет");

const Breakdown = ({ formats, index }: { formats: PriceFormat[]; index: number }) => {
  const [f1, f2] = formats;
  const keys: string[] = [];
  const meta: Record<string, { label: string; hint: string }> = {};
  formats.forEach(f => f.rows.filter(r => !r.is_total).forEach(r => {
    const k = cleanLabel(r.label);
    if (!meta[k]) { meta[k] = { label: k, hint: unifyHint(r.hint) }; keys.push(k); }
  }));
  const valueOf = (f: PriceFormat | undefined, k: string) =>
    f?.rows.find(r => !r.is_total && cleanLabel(r.label) === k)?.values[index] ?? null;
  const total = (f: PriceFormat | undefined) => f?.rows.find(r => r.is_total)?.values[index] ?? null;

  return (
    <div className="px-3 sm:px-5 pb-4 pt-1">
      <div>
        {keys.map(k => {
          const a = valueOf(f1, k);
          const isGreen = /зелен/i.test(k);
          const b = valueOf(f2, k) ?? (isGreen ? a : null);
          const a2 = valueOf(f1, k) ?? (isGreen ? b : null);
          return (
            <div key={k} className={`grid ${COLS} gap-x-2 sm:gap-x-4 py-2 border-t border-border/60 first:border-t-0`}>
              <div className="min-w-0">
                <span className="block text-[13px] leading-snug">{meta[k].label}</span>
                {meta[k].hint && <span className="block text-[11px] text-muted-foreground mt-0.5 leading-snug">{meta[k].hint}</span>}
              </div>
              <span className={`text-right font-mono text-[12px] sm:text-[13px] tabular-nums ${a2 === null ? "text-muted-foreground/50" : "font-medium"}`}>{fmtPrice(a2, 2)}</span>
              <span className={`text-right font-mono text-[12px] sm:text-[13px] tabular-nums ${b === null ? "text-muted-foreground/50" : "font-medium"}`}>{fmtPrice(b, 2)}</span>
              <span />
            </div>
          );
        })}
      </div>
      <div className={`grid ${COLS} gap-x-2 sm:gap-x-4 items-center mt-2 bg-primary text-primary-foreground rounded-xl py-3 -mx-1 px-1`}>
        <span className="pl-2 text-[13px] font-semibold">Итого за пачку</span>
        <span className="text-right font-serif text-[15px] sm:text-lg font-bold tabular-nums">{fmtPrice(total(f1))} ₽</span>
        <span className="text-right font-serif text-[15px] sm:text-lg font-bold tabular-nums">{fmtPrice(total(f2))} ₽</span>
        <span />
      </div>
    </div>
  );
};

type Fmt = "1kg" | "250g";

const describe = (label: string) => {
  const blend = /^бленд/i.test(label);
  const rest = label.replace(/^бленд\s*/i, "").trim();
  if (blend) {
    const hasRobusta = /робуст/i.test(rest);
    const hasArabica = /бразил|колумб|лаос/i.test(rest);
    return {
      blend: true,
      title: `Бленд ${rest}`,
      note: "Состав указан",
      composition: hasRobusta && hasArabica ? "Арабика / Робуста" : "Арабика",
    };
  }
  const robusta = /робуст/i.test(label);
  return {
    blend: false,
    title: label,
    note: robusta ? "Робуста 100%" : "Арабика 100%",
    composition: robusta ? "Робуста 100%" : "Арабика 100%",
  };
};

const goToCalculator = (close: () => void) => {
  close();
  const el = document.getElementById("calculator");
  if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  else window.location.assign("/#calculator");
};

const selectCls = "h-11 w-full appearance-none rounded-xl border border-border bg-card pl-3.5 pr-9 text-sm font-medium focus:outline-none focus:border-primary transition-colors cursor-pointer";

const PriceList = ({ data, onClose }: { data: PriceTableData; onClose: () => void }) => {
  const calc = useCalcData();
  const [open, setOpen] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "mono" | "blend">("all");
  const [fmt, setFmt] = useState<Fmt>("1kg");

  const formatData = data.formats.find(f => f.key === fmt) ?? data.formats[0];
  const total = formatData?.rows.find(r => r.is_total);

  const items = data.products
    .map((p, i) => {
      const d = describe(p.label);
      const pack = total?.values[i] ?? null;
      const perKg = pack === null ? null : fmt === "250g" ? pack * 4 : pack;
      return { i, p, d, pack, perKg };
    })
    .filter(x => {
      if (category === "mono" && x.d.blend) return false;
      if (category === "blend" && !x.d.blend) return false;
      const q = query.trim().toLowerCase();
      return !q || `${x.p.label} ${x.d.composition}`.toLowerCase().includes(q);
    });

  const fmtName = fmt === "1kg" ? "1 кг" : "250 г";
  const minOrder = `от ${calc.minVolume.toLocaleString("ru-RU")} кг`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_170px_150px] gap-2.5">
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по названию, сорту или составу..."
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div className="relative">
          <select value={category} onChange={e => setCategory(e.target.value as typeof category)} className={selectCls} aria-label="Категория">
            <option value="all">Все категории</option>
            <option value="mono">Моносорта</option>
            <option value="blend">Бленды</option>
          </select>
          <Icon name="ChevronDown" size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        <div className="relative">
          <select value={fmt} onChange={e => setFmt(e.target.value as Fmt)} className={selectCls} aria-label="Фасовка">
            <option value="1kg">Фасовка: 1 кг</option>
            <option value="250g">Фасовка: 250 г</option>
          </select>
          <Icon name="ChevronDown" size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12 bg-card rounded-2xl border border-border">Ничего не найдено — попробуйте изменить запрос</p>
      ) : (
        <>
          <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden">
            <div className={`grid ${DESK} gap-x-3 px-5 py-3 bg-secondary/70 text-[12px] font-semibold`}>
              <span>Товар / сорт</span><span>Состав</span><span>Обжарка</span><span>Фасовка</span>
              <span>Цена без доставки</span><span>Мин. заказ</span><span>Расчёт</span><span className="text-center">Действие</span>
            </div>
            <ul className="divide-y divide-border/70">
              {items.map(({ i, p, d, perKg }) => {
                const isOpen = open === i;
                return (
                  <li key={p.col} className={isOpen ? "bg-primary/[0.03]" : ""}>
                    <div className={`grid ${DESK} gap-x-3 items-center px-5 py-3.5 text-[13px]`}>
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <Icon name="Coffee" size={15} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold leading-tight">{d.title}</span>
                          <span className="block text-[11px] text-muted-foreground mt-0.5">{d.note}</span>
                        </span>
                      </span>
                      <span>{d.composition}</span>
                      <span>На выбор</span>
                      <span className="text-muted-foreground">Зерно / молотый · {fmtName}</span>
                      <span className="font-bold text-primary tabular-nums">{perKg === null ? "—" : `${fmtPrice(perKg)} ₽/кг*`}</span>
                      <span className="text-muted-foreground">{minOrder}</span>
                      <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
                        className="text-left text-primary text-[12px] font-medium hover:underline underline-offset-2">
                        {isOpen ? "Скрыть" : "Раскрыть"}
                      </button>
                      <button type="button" onClick={() => goToCalculator(onClose)}
                        className="bg-primary text-primary-foreground rounded-lg py-2.5 text-[12px] font-bold hover:bg-primary/90 transition-colors active:scale-[0.98]">
                        Подробнее
                      </button>
                    </div>
                    {isOpen && <Breakdown formats={data.formats} index={i} />}
                  </li>
                );
              })}
            </ul>
          </div>

          <ul className="md:hidden space-y-3">
            {items.map(({ i, p, d, perKg }) => {
              const isOpen = open === i;
              return (
                <li key={p.col} className="rounded-2xl border border-border bg-card p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Icon name="Coffee" size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight">{d.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{d.note} · {fmtName}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-bold text-primary">Цена без доставки: {perKg === null ? "—" : `${fmtPrice(perKg)} ₽/кг*`}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Минимальный заказ: {minOrder} · зерно / молотый</p>
                  <div className="flex gap-2 mt-3">
                    <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
                      className="flex-1 border border-border rounded-lg py-2.5 text-[12px] font-semibold hover:bg-secondary/50 transition-colors">
                      {isOpen ? "Скрыть расчёт" : "Раскрыть расчёт"}
                    </button>
                    <button type="button" onClick={() => goToCalculator(onClose)}
                      className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 text-[12px] font-bold hover:bg-primary/90 transition-colors">
                      Подробнее
                    </button>
                  </div>
                  {isOpen && <div className="-mx-3.5 mt-2 border-t border-border/60"><Breakdown formats={data.formats} index={i} /></div>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};

interface Props {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

const PriceTableModal = ({ open: controlled, onOpenChange }: Props) => {
  const [inner, setInner] = useState(false);
  const open = controlled ?? inner;
  const setOpen = (v: boolean) => { setInner(v); onOpenChange?.(v); };
  const { data, loading } = usePriceTable(open);

  useEffect(() => {
    if (controlled !== undefined) return;
    const h = () => setInner(true);
    window.addEventListener(PRICE_MODAL_EVENT, h);
    return () => window.removeEventListener(PRICE_MODAL_EVENT, h);
  }, [controlled]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[1180px] w-[calc(100vw-1rem)] sm:w-[calc(100vw-3rem)] max-h-[94vh] overflow-hidden p-0 gap-0 rounded-2xl sm:rounded-3xl flex flex-col">
        <div className="px-4 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-border bg-card pr-12">
          <p className="text-[10px] font-mono text-primary tracking-widest mb-1">ПРОЗРАЧНЫЕ ЦЕНЫ</p>
          <DialogTitle className="font-serif text-xl sm:text-2xl font-bold leading-tight text-left">Прайс-лист</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground mt-1.5 text-left">
            Актуальные цены на кофе и прозрачная структура расчёта. Полный расчёт каждой позиции — по нажатию «Раскрыть».
          </DialogDescription>
          {data?.updated_at && (
            <p className="text-[11px] text-muted-foreground font-mono mt-2">Обновлено {stamp(data.updated_at)}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-background">
          {loading && !data ? (
            <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : !data || data.formats.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-16">Прайс-лист временно недоступен</p>
          ) : (
            <>
              <PriceList data={data} onClose={() => setOpen(false)} />
              <p className="text-[12px] text-muted-foreground mt-4 leading-relaxed flex items-start gap-2">
                <Icon name="Info" size={13} className="flex-shrink-0 mt-0.5" />
                <span>
                  * Цена за 1 кг готового кофе без доставки. Итоговая стоимость зависит от объёма позиции и фасовки — точный расчёт в калькуляторе.
                  Для своей упаковки детали обсуждаются с менеджером.
                </span>
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceTableModal;
