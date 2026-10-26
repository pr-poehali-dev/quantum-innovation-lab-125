import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  PRICE_MODAL_EVENT, fmtPrice, usePriceTable, type PriceFormat, type PriceTableData,
} from "@/lib/priceTable";

const stamp = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "";

const DesktopTable = ({ data, format }: { data: PriceTableData; format: PriceFormat }) => (
  <div className="overflow-auto max-h-[60vh] rounded-2xl border border-border">
    <table className="w-full border-separate border-spacing-0 text-[13px]">
      <thead>
        <tr>
          <th className="sticky top-0 left-0 z-30 bg-secondary text-left font-semibold px-4 py-3 min-w-[230px] border-b border-r border-border">Статья</th>
          {data.products.map(p => (
            <th key={p.col} className="sticky top-0 z-20 bg-secondary text-center font-semibold px-3 py-3 min-w-[128px] max-w-[150px] border-b border-border leading-tight align-bottom">
              {p.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {format.rows.map(r => (
          <tr key={r.row} className={r.is_total ? "bg-primary text-primary-foreground" : "odd:bg-white even:bg-secondary/20"}>
            <th className={`sticky left-0 z-10 text-left font-medium px-4 py-2.5 border-r border-b border-border/60 ${r.is_total ? "bg-primary text-primary-foreground font-bold" : "bg-inherit"}`}>
              <span className="block">{r.label}</span>
              {r.hint && <span className="block text-[11px] font-normal text-muted-foreground mt-0.5 leading-snug max-w-[260px]">{r.hint}</span>}
            </th>
            {r.values.map((v, i) => (
              <td key={i} className={`text-right px-3 py-2.5 border-b border-border/60 font-mono tabular-nums ${r.is_total ? "font-bold text-[15px]" : ""}`}>
                {fmtPrice(v, r.label.includes("$/кг") ? 2 : r.is_total ? 0 : 2)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MobileCards = ({ data, format }: { data: PriceTableData; format: PriceFormat }) => {
  const [open, setOpen] = useState<number | null>(0);
  const total = format.rows.find(r => r.is_total);
  return (
    <div className="space-y-2.5">
      {data.products.map((p, i) => {
        const isOpen = open === i;
        const totalVal = total?.values[i] ?? null;
        return (
          <div key={p.col} className={`rounded-2xl border overflow-hidden transition-colors ${isOpen ? "border-primary/40 bg-white" : "border-border bg-card"}`}>
            <button onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left">
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{p.label}</span>
                <span className="block text-[11px] text-muted-foreground mt-0.5">{format.title}</span>
              </span>
              <span className="flex items-center gap-2 flex-shrink-0">
                <span className="font-serif text-lg font-bold text-primary">{fmtPrice(totalVal)} ₽</span>
                <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground" />
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-1 border-t border-border/60">
                <dl className="divide-y divide-border/60">
                  {format.rows.filter(r => !r.is_total).map(r => (
                    <div key={r.row} className="py-2.5 flex items-start justify-between gap-4">
                      <dt className="min-w-0">
                        <span className="block text-[13px]">{r.label}</span>
                        {r.hint && <span className="block text-[11px] text-muted-foreground mt-0.5 leading-snug">{r.hint}</span>}
                      </dt>
                      <dd className="font-mono text-[13px] font-medium flex-shrink-0 tabular-nums">{fmtPrice(r.values[i], 2)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-2 flex items-center justify-between bg-primary text-primary-foreground rounded-xl px-4 py-3">
                  <span className="text-[13px] font-semibold">{total?.label.replace(" (руб.)", "")}</span>
                  <span className="font-serif text-xl font-bold">{fmtPrice(totalVal)} ₽</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
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
  const [fmt, setFmt] = useState<"1kg" | "250g">("1kg");
  const { data, loading } = usePriceTable(open);

  useEffect(() => {
    if (controlled !== undefined) return;
    const h = () => setInner(true);
    window.addEventListener(PRICE_MODAL_EVENT, h);
    return () => window.removeEventListener(PRICE_MODAL_EVENT, h);
  }, [controlled]);

  const format = data?.formats.find(f => f.key === fmt) ?? data?.formats[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[1180px] w-[calc(100vw-1rem)] sm:w-[calc(100vw-3rem)] max-h-[94vh] overflow-hidden p-0 gap-0 rounded-2xl sm:rounded-3xl flex flex-col">
        <div className="px-4 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-border bg-card pr-12">
          <p className="text-[10px] font-mono text-primary tracking-widest mb-1">ПРОЗРАЧНЫЕ ЦЕНЫ</p>
          <DialogTitle className="font-serif text-xl sm:text-2xl font-bold leading-tight text-left">Прайс-лист</DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground mt-1.5 text-left">
            Из чего складывается цена одной пачки готового кофе под вашей маркой. Цены в рублях, без НДС.
            {data?.rate ? ` Курс доллара в расчёте — ${data.rate} ₽.` : ""}
          </DialogDescription>
          <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
            <div className="inline-flex gap-1 bg-secondary/60 rounded-xl p-1">
              {(data?.formats ?? [{ key: "1kg", title: "Пачка 1 кг" }, { key: "250g", title: "Пачка 250 г" }]).map(f => (
                <button key={f.key} onClick={() => setFmt(f.key as "1kg" | "250g")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${fmt === f.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {f.title}
                </button>
              ))}
            </div>
            {data?.updated_at && <span className="text-[11px] text-muted-foreground font-mono">Обновлено {stamp(data.updated_at)}</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-background">
          {loading && !data ? (
            <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : !data || !format ? (
            <p className="text-center text-sm text-muted-foreground py-16">Таблица цен временно недоступна</p>
          ) : (
            <>
              <div className="hidden md:block"><DesktopTable data={data} format={format} /></div>
              <div className="md:hidden"><MobileCards data={data} format={format} /></div>
              <p className="text-[12px] text-muted-foreground mt-4 leading-relaxed flex items-start gap-2">
                <Icon name="Info" size={13} className="flex-shrink-0 mt-0.5" />
                <span>
                  Итоговая цена — за одну пачку выбранного веса. Стоимость заказа зависит от объёма позиции (от 500 кг) и рассчитывается в калькуляторе.
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
