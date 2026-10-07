import Icon from "@/components/ui/icon";

export interface StatItem { val: string; label: string; icon?: string }

interface Props {
  title: string;
  stats: StatItem[];
  withIcon?: boolean;
  onChange: (stats: StatItem[]) => void;
  inputCls: string;
}

const StatsEditor = ({ title, stats, withIcon, onChange, inputCls }: Props) => {
  const set = (i: number, p: Partial<StatItem>) => onChange(stats.map((s, idx) => (idx === i ? { ...s, ...p } : s)));

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{title}</p>
      {stats.map((s, i) => (
        <div key={i} className="flex flex-col sm:flex-row gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border">
          <input className={`${inputCls} sm:w-32`} value={s.val} placeholder="500 кг" onChange={e => set(i, { val: e.target.value })} />
          <input className={`${inputCls} flex-1`} value={s.label} placeholder="минимальный заказ" onChange={e => set(i, { label: e.target.value })} />
          {withIcon && (
            <div className="relative sm:w-40">
              <Icon name={s.icon || "Circle"} fallback="Circle" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className={`${inputCls} pl-9`} value={s.icon || ""} placeholder="Award" onChange={e => set(i, { icon: e.target.value })} />
            </div>
          )}
          <button onClick={() => onChange(stats.filter((_, idx) => idx !== i))}
            className="px-3 py-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors self-start sm:self-auto">
            <Icon name="Trash2" size={14} />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...stats, { val: "", label: "", ...(withIcon ? { icon: "Star" } : {}) }])}
        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
        <Icon name="Plus" size={14} /> Добавить плашку
      </button>
    </div>
  );
};

export default StatsEditor;
