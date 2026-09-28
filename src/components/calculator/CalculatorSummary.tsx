import Icon from "@/components/ui/icon";
import { STEPS, ROASTS, WEIGHT_FORMATS, BAG_COLORS } from "./calculator.types";
import type { CalcOrigin } from "@/components/PriceCalculator";

interface CalculatorSummaryProps {
  step: number;
  origin: number;
  roast: number;
  weightFormat: "1kg" | "250g";
  bagColor: "black" | "white" | "custom";
  volume: number;
  total: number;
  pricePerKg: number;
  discount: number;
  leadTime: number;
  dynamicOrigins?: CalcOrigin[];
}

const CalculatorSummary = ({
  step, origin, roast, weightFormat, bagColor, volume, total, pricePerKg, discount, leadTime, dynamicOrigins,
}: CalculatorSummaryProps) => {
  const originLabel = dynamicOrigins && origin >= 0 ? dynamicOrigins[origin]?.label : "—";
  const weightLabel = WEIGHT_FORMATS.find(w => w.value === weightFormat)?.label ?? "—";
  const colorLabel  = BAG_COLORS.find(c => c.value === bagColor)?.label ?? "—";

  return (
    <div className="space-y-3 lg:sticky lg:top-24">
      {/* Итоговая цена */}
      <div className="bg-primary rounded-2xl p-6 text-primary-foreground shadow-xl shadow-primary/20">
        <p className="text-[10px] font-mono opacity-60 mb-1 tracking-wider">ИТОГО ЗА ПАРТИЮ</p>
        <p className="font-serif text-4xl font-bold">{total.toLocaleString("ru-RU")} ₽</p>
        <p className="text-sm opacity-70 mt-1">{pricePerKg.toLocaleString("ru-RU")} ₽ / кг</p>
        {discount > 0 && (
          <div className="mt-3 bg-white/15 rounded-xl px-3 py-2 flex items-center gap-2 text-sm">
            <Icon name="Tag" size={13} /> Скидка {discount * 100}% за объём
          </div>
        )}
        <div className="mt-5 space-y-2 pt-4 border-t border-white/20">
          {[
            { label: "Зерно",    val: originLabel },
            { label: "Обжарка",  val: ROASTS[roast].label },
            { label: "Фасовка",  val: weightLabel },
            { label: "Цвет пакета", val: colorLabel },
            { label: "Объём",    val: volume.toLocaleString("ru-RU") + " кг" },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-xs opacity-75">
              <span>{r.label}</span>
              <span className="font-mono">{r.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Срок производства */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="Clock" size={15} className="text-primary" />
          <span className="text-sm font-semibold">Срок производства</span>
        </div>
        <p className="text-3xl font-serif font-bold text-primary">{leadTime} дней</p>
        <p className="text-[11px] text-muted-foreground mt-1">с момента подтверждения</p>
      </div>

      {/* Прогресс-бар брифа */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Заполнено</span>
          <span className="font-mono text-primary font-semibold">{step + 1} / {STEPS.length}</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalculatorSummary;
