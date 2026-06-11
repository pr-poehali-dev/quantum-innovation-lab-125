import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

// ── 4 вымышленных бренда — разные этикетки ────────────────────
const BRANDS = [
  {
    name: "NORD ROAST",
    sub: "SPECIALTY · ETHIOPIA",
    weight: "250г",
    roast: "LIGHT",
    bg: "from-[#1a1a2e] to-[#16213e]",
    accent: "#4f8ef7",
    tag: "bg-blue-500/20 text-blue-300",
    ring: "border-blue-500/30",
    dot: ["#4f8ef7", "#93c5fd", "#1e40af"],
  },
  {
    name: "TERRA VERDE",
    sub: "ORGANIC · BRAZIL",
    weight: "250г",
    roast: "MEDIUM",
    bg: "from-[#0d2818] to-[#1a3a2a]",
    accent: "#4ade80",
    tag: "bg-green-500/20 text-green-300",
    ring: "border-green-500/30",
    dot: ["#4ade80", "#86efac", "#166534"],
  },
  {
    name: "SOLEIL NOIR",
    sub: "DARK BLEND · COLOMBIA",
    weight: "250г",
    roast: "DARK",
    bg: "from-[#1c0a00] to-[#2d1500]",
    accent: "#f97316",
    tag: "bg-orange-500/20 text-orange-300",
    ring: "border-orange-500/30",
    dot: ["#f97316", "#fdba74", "#9a3412"],
  },
  {
    name: "BLANC PEAK",
    sub: "FILTER · KENYA AA",
    weight: "250г",
    roast: "LIGHT",
    bg: "from-[#1a0a2e] to-[#2d1254]",
    accent: "#c084fc",
    tag: "bg-purple-500/20 text-purple-300",
    ring: "border-purple-500/30",
    dot: ["#c084fc", "#e9d5ff", "#6b21a8"],
  },
];

const CYCLE_MS = 9000;

// ── CSS-пачка кофе (SVG-форма + этикетка) ────────────────────

interface BagProps {
  brand: typeof BRANDS[0];
  visible: boolean;
}

const CoffeeBag = ({ brand, visible }: BagProps) => (
  <div
    className="absolute inset-0 flex items-center justify-center transition-opacity duration-1000"
    style={{ opacity: visible ? 1 : 0 }}
  >
    {/* Пачка: простая CSS-форма */}
    <div className="relative w-52 h-72">
      {/* Тело пачки */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${brand.bg} rounded-[28px_28px_22px_22px] shadow-2xl`}
        style={{ boxShadow: `0 25px 60px ${brand.accent}22, 0 8px 20px #00000060` }}
      >
        {/* Клапан сверху */}
        <div
          className={`absolute top-0 left-0 right-0 h-10 bg-gradient-to-b ${brand.bg} rounded-[28px_28px_0_0] border-b`}
          style={{ borderColor: `${brand.accent}30` }}
        />
        {/* Складка снизу */}
        <div
          className="absolute bottom-0 left-4 right-4 h-5 rounded-b-2xl opacity-40"
          style={{ background: `linear-gradient(to bottom, transparent, ${brand.accent}22)` }}
        />

        {/* Этикетка-зона */}
        <div
          className={`absolute inset-x-3 top-12 bottom-8 rounded-2xl border ${brand.ring} flex flex-col items-center justify-center gap-2 px-4`}
          style={{ background: `${brand.accent}08` }}
        >
          {/* Иконка зерна */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
            style={{ background: `${brand.accent}18`, border: `1px solid ${brand.accent}40` }}
          >
            <Icon name="Coffee" size={22} style={{ color: brand.accent }} />
          </div>

          {/* Название */}
          <p
            className="font-serif text-lg font-bold tracking-wider text-center leading-tight"
            style={{ color: brand.accent }}
          >
            {brand.name}
          </p>
          <p className="text-[9px] font-mono opacity-50 text-white tracking-widest text-center">
            {brand.sub}
          </p>

          {/* Тег обжарки */}
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full mt-1 ${brand.tag}`}>
            {brand.roast}
          </span>

          {/* Вес и цветные точки */}
          <div className="flex items-center justify-between w-full mt-2 px-1">
            <span className="text-[10px] font-mono text-white/30">{brand.weight}</span>
            <div className="flex gap-1">
              {brand.dot.map((c, i) => (
                <div key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>

        {/* Блик */}
        <div
          className="absolute top-14 left-5 w-3 h-20 rounded-full opacity-10 rotate-6"
          style={{ background: "linear-gradient(to bottom, white, transparent)" }}
        />
      </div>
    </div>
  </div>
);

// ── Главный компонент ─────────────────────────────────────────

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Автосмена
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(() => {
      setCurrent((c) => (c + 1) % BRANDS.length);
    }, CYCLE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused]);

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Левая колонка */}
          <div className="space-y-7 scroll-reveal-left">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-[4.2rem] leading-[1.05] font-bold">
              Ваш бренд кофе —<br />
              <span className="text-primary">от зерна</span><br />
              до полки.
            </h1>

            <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
              Обжарка, упаковка и логистика под вашей торговой маркой. Для кофеен, ресторанов, отелей и вендинга.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="#calculator"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-95"
              >
                Рассчитать стоимость
                <Icon name="ArrowRight" size={16} />
              </a>
              <button className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-full text-sm font-medium hover:bg-secondary transition-all hover:border-primary/30">
                <Icon name="Package" size={16} />
                Смотреть образцы
              </button>
            </div>

            <div className="flex gap-8 pt-2 border-t border-border">
              {[
                { val: "500+",    label: "КЛИЕНТОВ"         },
                { val: "14 дней", label: "ДО ПЕРВОЙ ПАРТИИ" },
                { val: "от 50 кг",label: "МИН. ЗАКАЗ"       },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-serif text-2xl font-semibold text-foreground">{s.val}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Правая колонка — вращающаяся пачка ── */}
          <div className="relative scroll-reveal flex justify-center" data-delay="150">

            {/* Floating badge — партия */}
            <div className="absolute -left-2 top-8 glass rounded-2xl px-4 py-3 shadow-lg z-20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold">Партия готова</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">ЗАКАЗ #2847 · 200 кг</p>
            </div>

            {/* Floating badge — рост */}
            <div className="absolute -right-2 bottom-12 glass rounded-2xl px-4 py-3 shadow-lg z-20">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="TrendingUp" size={14} className="text-primary" />
                <span className="text-xs font-semibold">Рост продаж</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">+38% после запуска бренда</p>
            </div>

            {/* ── Пачка — слот V2 ── */}
            <a
              href="#calculator"
              className="relative block"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onTouchStart={() => setPaused((p) => !p)}
              title="Собрать свою пачку"
            >
              {/* Мягкое свечение под пачкой */}
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-36 h-10 rounded-full blur-2xl transition-all duration-1000 opacity-40"
                style={{ background: BRANDS[current].accent }}
              />

              {/* Анимация покачивания пачки */}
              <style>{`
                @keyframes bagFloat {
                  0%,100% { transform: translateY(0px) rotate(-1.5deg); }
                  50%     { transform: translateY(-12px) rotate(1.5deg); }
                }
                .bag-float {
                  animation: bagFloat 9s ease-in-out infinite;
                }
                .bag-float:hover,
                .bag-float.paused {
                  animation-play-state: paused;
                }
              `}</style>

              {/* Контейнер пачки */}
              <div className={`relative w-52 h-72 bag-float ${paused ? "paused" : ""}`}>
                {BRANDS.map((b, i) => (
                  <CoffeeBag key={b.name} brand={b} visible={i === current} />
                ))}
              </div>

              {/* Подпись при hover */}
              <div className={`absolute inset-0 flex items-center justify-center rounded-[28px] transition-all duration-300 ${paused ? "opacity-100" : "opacity-0"}`}>
                <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-4 py-2.5 flex items-center gap-2 text-white text-xs font-medium shadow-xl">
                  <Icon name="ArrowRight" size={13} />
                  Собрать свою пачку
                </div>
              </div>

              {/* Точки-индикаторы бренда */}
              <div className="flex justify-center gap-2 mt-5">
                {BRANDS.map((b, i) => (
                  <button
                    key={b.name}
                    onClick={(e) => { e.preventDefault(); setCurrent(i); setPaused(true); setTimeout(() => setPaused(false), 4000); }}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      background: i === current ? b.accent : "#ffffff30",
                      transform: i === current ? "scale(1.4)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </a>

          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
