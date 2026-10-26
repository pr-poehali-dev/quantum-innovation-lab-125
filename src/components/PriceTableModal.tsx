import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  PRICE_MODAL_EVENT, fmtPrice, usePriceTable, type PriceFormat, type PriceTableData,
} from "@/lib/priceTable";

const stamp = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "";

const cleanLabel = (label: string) => label.replace(/\s*\(руб\.[^)]*\)\s*$/, "").trim();

const COLS = "grid-cols-[minmax(0,1fr)_72px_72px_24px] sm:grid-cols-[minmax(0,1fr)_110px_110px_28px]";

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

const Price = ({ value }: { value: number | null }) => (
  <span className="text-right font-serif text-[15px] sm:text-lg font-bold tabular-nums">
    {fmtPrice(value)}
    <span className="text-[11px] sm:text-xs font-sans font-medium text-muted-foreground"> ₽</span>
  </span>
);

const PriceList = ({ data }: { data: PriceTableData }) => {
  const [open, setOpen] = useState<number | null>(null);
  const [f1, f2] = data.formats;
  const t1 = f1?.rows.find(r => r.is_total);
  const t2 = f2?.rows.find(r => r.is_total);

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      <div className={`grid ${COLS} gap-x-2 sm:gap-x-4 px-3 sm:px-5 py-2.5 bg-secondary text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-muted-foreground`}>
        <span>Сорт</span>
        <span className="text-right">1 кг</span>
        <span className="text-right">250 г</span>
        <span />
      </div>
      <ul className="divide-y divide-border/70">
        {data.products.map((p, i) => {
          const isOpen = open === i;
          return (
            <li key={p.col} className={isOpen ? "bg-primary/[0.03]" : ""}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className={`w-full grid ${COLS} gap-x-2 sm:gap-x-4 items-center px-3 sm:px-5 py-3 sm:py-3.5 text-left hover:bg-secondary/40 transition-colors`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="hidden sm:flex w-8 h-8 rounded-full bg-primary/10 text-primary items-center justify-center flex-shrink-0">
                    <Icon name="Coffee" size={15} />
                  </span>
                  <span className="text-[13px] sm:text-sm font-semibold leading-tight">{p.label}</span>
                </span>
                <Price value={t1?.values[i] ?? null} />
                <Price value={t2?.values[i] ?? null} />
                <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground justify-self-end" />
              </button>
              {isOpen && <Breakdown formats={data.formats} index={i} />}
            </li>
          );
        })}
      </ul>
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
      <DialogContent className="max-w-[860px] w-[calc(100vw-1rem)] sm:w-[calc(100vw-3rem)] max-h-[94vh] overflow-hidden p-0 gap-0 rounded-2xl sm:rounded-3xl flex flex-col">
        <div className="px-4 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-border bg-card pr-12">
          <p className="text-[10px] font-mono text-primary tracking-widest mb-1">ПРОЗРАЧНЫЕ ЦЕНЫ</p>
          <DialogTitle className="font-serif text-xl sm:text-2xl font-bold leading-tight text-left">Прайс-лист</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground mt-1.5 text-left">
            Цена одной пачки готового кофе под вашей маркой. Цены в рублях, с НДС. Нажмите на сорт — увидите, из чего складывается цена.
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
              <PriceList data={data} />
              <p className="text-[12px] text-muted-foreground mt-4 leading-relaxed flex items-start gap-2">
                <Icon name="Info" size={13} className="flex-shrink-0 mt-0.5" />
                <span>
                  Цена указана за одну пачку выбранного веса. Стоимость заказа зависит от объёма позиции (от 500 кг) и рассчитывается в калькуляторе.
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
