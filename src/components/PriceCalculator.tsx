import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useLeadModal } from "@/context/LeadModalContext";
import { openPriceTable } from "@/lib/priceTable";
import PositionWizard from "@/components/calculator/PositionWizard";
import OrderSummary from "@/components/calculator/OrderSummary";
import {
  colorLabel, formatLabel, loadCart, maxLeadTime, saveCart, useCalcData,
  type Position,
} from "@/lib/calcCore";

export { calcPrice1kg, calcPrice250g } from "@/lib/calcCore";
export type { CalcOrigin } from "@/lib/calcCore";

type View = "wizard" | "summary";

const PriceCalculator = () => {
  const calc = useCalcData();
  const navigate = useNavigate();
  const { openModal } = useLeadModal();

  const [positions, setPositions] = useState<Position[]>(() => loadCart().positions);
  const [view, setView] = useState<View>(() => (loadCart().positions.length ? "summary" : "wizard"));
  const [editingUid, setEditingUid] = useState<string | null>(null);

  useEffect(() => { saveCart({ positions }); }, [positions]);

  useEffect(() => {
    const onCleared = () => { setPositions([]); setEditingUid(null); setView("wizard"); };
    window.addEventListener("kk-cart-cleared", onCleared);
    return () => window.removeEventListener("kk-cart-cleared", onCleared);
  }, []);

  const editing = editingUid ? positions.find(p => p.uid === editingUid) ?? null : null;

  const handleDone = (p: Position) => {
    setPositions(prev => (prev.some(x => x.uid === p.uid) ? prev.map(x => (x.uid === p.uid ? p : x)) : [...prev, p]));
    setEditingUid(null);
    setView("summary");
  };

  const handleRemove = (uid: string) => {
    const next = positions.filter(p => p.uid !== uid);
    setPositions(next);
    if (next.length === 0) setView("wizard");
  };

  const handleSend = () => {
    const total = positions.reduce((s, p) => s + p.amount, 0);
    openModal("calculator", {
      positions: positions.map(p => ({
        origin: p.origin_label, roast: p.roast, weight_format: formatLabel(p.weight_format),
        bag_color: colorLabel(p.color), volume: p.volume, amount: p.amount,
        custom_package: p.color === "custom",
      })),
      total,
      total_volume: positions.reduce((s, p) => s + p.volume, 0),
      lead_time_days: maxLeadTime(positions, calc.tiers),
    });
  };

  const handleCabinet = () => {
    saveCart({ positions });
    navigate("/cabinet?import=cart");
  };

  return (
    <section id="calculator" className="relative py-16 md:py-24 scroll-mt-16">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.07] via-primary/[0.04] to-transparent" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="scroll-reveal mb-8 md:mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-[11px] font-mono text-primary tracking-wider bg-primary/10 rounded-full px-3 py-1">
              <Icon name="Calculator" size={12} /> ПРОИЗВОДСТВЕННЫЙ БРИФ
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] mt-4 font-bold leading-[1.12]">
              Рассчитайте стоимость<br />
              <span className="text-primary">своей партии</span>
            </h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base leading-relaxed">
              Соберите заказ из позиций: сорт, обжарка, фасовка и пакет. Минимум {calc.minVolume.toLocaleString("ru-RU")} кг на каждую позицию —
              добавляйте сколько нужно.
            </p>
          </div>
          <button type="button" onClick={openPriceTable}
            className="group flex items-center justify-center gap-2.5 self-start md:self-end flex-shrink-0 bg-card border border-primary/30 text-primary rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]">
            <Icon name="Table2" size={16} />
            Прайс-лист
            <Icon name="ArrowUpRight" size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        <div className="rounded-[28px] border border-primary/20 bg-card/60 backdrop-blur-sm p-3 sm:p-5 md:p-6 shadow-[0_20px_60px_-24px_hsl(var(--primary)/0.35)]">
        {view === "wizard" || positions.length === 0 ? (
          <PositionWizard
            key={editing?.uid ?? `new-${positions.length}`}
            calc={calc}
            initial={editing}
            positionNumber={editing ? positions.findIndex(p => p.uid === editing.uid) + 1 : positions.length + 1}
            onDone={handleDone}
            onCancel={positions.length > 0 ? () => { setEditingUid(null); setView("summary"); } : undefined}
          />
        ) : (
          <OrderSummary
            positions={positions}
            tiers={calc.tiers}
            onEdit={uid => { setEditingUid(uid); setView("wizard"); }}
            onRemove={handleRemove}
            onAdd={() => { setEditingUid(null); setView("wizard"); }}
          >
            <button type="button" onClick={handleSend}
              className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-4 rounded-2xl text-[15px] font-bold hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/20 active:scale-[0.99]">
              <Icon name="Send" size={15} /> Отправить заявку на согласование
            </button>
            <button type="button" onClick={handleCabinet}
              className="w-full flex items-center justify-center gap-2 border border-primary/40 text-primary py-3.5 rounded-2xl text-sm font-semibold hover:bg-primary/5 transition-all active:scale-[0.99]">
              <Icon name="LogIn" size={15} /> Оформить через личный кабинет
            </button>
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed px-2">
              В кабинете всё, что вы выбрали, сохранится — заново заполнять не придётся.
            </p>
          </OrderSummary>
        )}
        </div>
      </div>
    </section>
  );
};

export default PriceCalculator;
