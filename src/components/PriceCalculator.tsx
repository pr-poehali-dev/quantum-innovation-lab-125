import { useState } from "react";
import Icon from "@/components/ui/icon";

const ROASTS = ["Светлая", "Средняя", "Тёмная", "Эспрессо"];
const PACKAGINGS = [
  { label: "Крафт без принта", pricePerKg: 0 },
  { label: "Крафт с логотипом", pricePerKg: 25 },
  { label: "Фольга с печатью", pricePerKg: 45 },
  { label: "Премиум дизайн", pricePerKg: 80 },
];
const BASE_PRICE_PER_KG = 420;

const PriceCalculator = () => {
  const [volume, setVolume] = useState(100);
  const [roast, setRoast] = useState(1);
  const [packaging, setPackaging] = useState(1);
  const [origin, setOrigin] = useState(0);

  const origins = [
    { label: "Бразилия", extra: 0 },
    { label: "Колумбия", extra: 30 },
    { label: "Эфиопия", extra: 60 },
    { label: "Гватемала", extra: 50 },
  ];

  const pkgPrice = PACKAGINGS[packaging].pricePerKg;
  const originExtra = origins[origin].extra;
  const pricePerKg = BASE_PRICE_PER_KG + pkgPrice + originExtra;
  const totalRaw = volume * pricePerKg;
  const discount = volume >= 500 ? 0.1 : volume >= 200 ? 0.05 : 0;
  const total = Math.round(totalRaw * (1 - discount));

  return (
    <section id="calculator" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="scroll-reveal mb-12">
          <span className="text-xs font-mono text-muted-foreground tracking-wider">КАЛЬКУЛЯТОР</span>
          <h2 className="font-serif text-4xl md:text-5xl mt-3 font-bold">
            Рассчитайте стоимость
            <br />
            <span className="text-primary">своей партии</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start scroll-reveal" data-delay="100">
          {/* Controls */}
          <div className="lg:col-span-3 space-y-8 bg-card border border-border rounded-3xl p-8 shadow-sm">
            {/* Volume */}
            <div>
              <div className="flex justify-between mb-3">
                <label className="text-sm font-semibold">Объём партии</label>
                <span className="text-sm font-mono font-semibold text-primary">{volume} кг</span>
              </div>
              <input
                type="range"
                min={50}
                max={1000}
                step={50}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1">
                <span>50 кг</span>
                <span>1 000 кг</span>
              </div>
            </div>

            {/* Origin */}
            <div>
              <label className="text-sm font-semibold mb-3 block">Происхождение зерна</label>
              <div className="grid grid-cols-2 gap-2">
                {origins.map((o, i) => (
                  <button
                    key={o.label}
                    onClick={() => setOrigin(i)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      origin === i
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40 hover:bg-secondary/60"
                    }`}
                  >
                    <p className="text-sm font-medium">{o.label}</p>
                    {o.extra > 0 && (
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">+{o.extra} ₽/кг</p>
                    )}
                    {o.extra === 0 && (
                      <p className="text-[10px] font-mono text-primary mt-0.5">базовая цена</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Roast */}
            <div>
              <label className="text-sm font-semibold mb-3 block">Степень обжарки</label>
              <div className="flex gap-2 flex-wrap">
                {ROASTS.map((r, i) => (
                  <button
                    key={r}
                    onClick={() => setRoast(i)}
                    className={`px-4 py-2 rounded-full text-sm transition-all border ${
                      roast === i
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/40 hover:bg-secondary"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Packaging */}
            <div>
              <label className="text-sm font-semibold mb-3 block">Упаковка</label>
              <div className="grid grid-cols-2 gap-2">
                {PACKAGINGS.map((p, i) => (
                  <button
                    key={p.label}
                    onClick={() => setPackaging(i)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      packaging === i
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40 hover:bg-secondary/60"
                    }`}
                  >
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      {p.pricePerKg > 0 ? `+${p.pricePerKg} ₽/кг` : "включено"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-primary rounded-3xl p-8 text-primary-foreground shadow-xl shadow-primary/20">
              <p className="text-xs font-mono opacity-70 mb-1">ИТОГО ЗА ПАРТИЮ</p>
              <p className="font-serif text-5xl font-bold mb-1">
                {total.toLocaleString("ru-RU")} ₽
              </p>
              <p className="text-sm opacity-70">
                {Math.round(total / volume).toLocaleString("ru-RU")} ₽ / кг
              </p>

              {discount > 0 && (
                <div className="mt-4 bg-white/15 rounded-xl px-4 py-2 flex items-center gap-2">
                  <Icon name="Tag" size={14} />
                  <span className="text-sm font-medium">Скидка {discount * 100}% за объём</span>
                </div>
              )}

              <div className="mt-6 space-y-2">
                {[
                  { label: "Зерно (" + origins[origin].label + ")", val: `${BASE_PRICE_PER_KG + originExtra} ₽/кг` },
                  { label: "Упаковка", val: pkgPrice > 0 ? `+${pkgPrice} ₽/кг` : "включено" },
                  { label: "Объём", val: `${volume} кг` },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm opacity-80">
                    <span>{row.label}</span>
                    <span className="font-mono">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full bg-accent text-accent-foreground py-4 rounded-2xl text-sm font-semibold hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25 active:scale-95 flex items-center justify-center gap-2">
              <Icon name="Send" size={16} />
              Отправить заявку
            </button>

            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="Clock" size={16} className="text-primary" />
                <span className="text-sm font-semibold">Срок производства</span>
              </div>
              <p className="text-2xl font-serif font-bold">
                {volume <= 200 ? "14" : volume <= 500 ? "18" : "25"} дней
              </p>
              <p className="text-xs text-muted-foreground mt-1">с момента подтверждения заказа</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PriceCalculator;
