import Icon from "@/components/ui/icon";
import {
  colorLabel, formatLabel, formatRub, maxLeadTime,
  type LeadTimeTier, type Position,
} from "@/lib/calcCore";

interface Props {
  positions: Position[];
  tiers: LeadTimeTier[];
  onEdit: (uid: string) => void;
  onRemove: (uid: string) => void;
  onAdd: () => void;
  children?: React.ReactNode;
}

const OrderSummary = ({ positions, tiers, onEdit, onRemove, onAdd, children }: Props) => {
  const totalAmount = positions.reduce((s, p) => s + p.amount, 0);
  const totalVolume = positions.reduce((s, p) => s + p.volume, 0);
  const lead = maxLeadTime(positions, tiers);

  return (
    <div className="grid lg:grid-cols-3 gap-5 items-start">
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest">ПОЗИЦИЙ: {positions.length}</span>
            <h3 className="font-bold text-xl leading-tight">Ваш заказ</h3>
          </div>
        </div>

        {positions.map((p, i) => (
          <div key={p.uid} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">{p.origin_label}</p>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                    {p.roast} обжарка · {formatLabel(p.weight_format)} · пакет: {colorLabel(p.color)}
                  </p>
                  {p.color === "custom" && (
                    <p className="text-[11px] text-primary mt-1 flex items-center gap-1">
                      <Icon name="Info" size={11} /> Детали упаковки — с менеджером
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-serif text-lg font-bold leading-tight">{formatRub(p.amount)}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{p.volume.toLocaleString("ru-RU")} кг</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60">
              <button type="button" onClick={() => onEdit(p.uid)}
                className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-medium border border-border rounded-xl py-2.5 hover:border-primary/40 hover:bg-primary/5 transition-all">
                <Icon name="Pencil" size={13} /> Изменить
              </button>
              <button type="button" onClick={() => onRemove(p.uid)}
                className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-medium border border-border rounded-xl py-2.5 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all">
                <Icon name="Trash2" size={13} /> Удалить
              </button>
            </div>
          </div>
        ))}

        <button type="button" onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-primary/40 text-primary rounded-2xl py-4 text-sm font-semibold hover:bg-primary/5 hover:border-primary transition-all active:scale-[0.99]">
          <Icon name="Plus" size={16} /> Добавить ещё сорт
        </button>
      </div>

      <div className="space-y-4 lg:sticky lg:top-24">
        <div className="bg-primary rounded-2xl p-5 sm:p-6 text-primary-foreground shadow-xl shadow-primary/20">
          <p className="text-[10px] font-mono opacity-60 mb-1 tracking-wider">ИТОГО ПО ЗАКАЗУ</p>
          <p className="font-serif text-3xl sm:text-4xl font-bold">{formatRub(totalAmount)}</p>
          <div className="mt-4 space-y-2 pt-4 border-t border-white/20 text-xs opacity-80">
            <div className="flex justify-between"><span>Позиций</span><span className="font-mono">{positions.length}</span></div>
            <div className="flex justify-between"><span>Общий объём</span><span className="font-mono">{totalVolume.toLocaleString("ru-RU")} кг</span></div>
            <div className="flex justify-between"><span>Срок производства</span><span className="font-mono">до {lead} дн.</span></div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default OrderSummary;
