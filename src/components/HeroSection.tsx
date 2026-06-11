import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { COFFEE_BRANDS, CYCLE_MS, type CoffeeBrand } from "@/config/coffeeBrands";

// ─────────────────────────────────────────────────────────────
// SVG-пачка кофе — форма по макету, плавная смена дизайна
// V2 slot: заменить содержимое на <video> с реальной съёмкой
// ─────────────────────────────────────────────────────────────

interface BagProps { brand: CoffeeBrand; opacity: number }

const CoffeeBag = ({ brand, opacity }: BagProps) => {
  const id = brand.name.replace(/\s/g, "");
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity, transition: "opacity 1.1s ease-in-out", pointerEvents: "none" }}
    >
      <svg width="240" height="330" viewBox="0 0 240 330" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ filter: `drop-shadow(0 32px 48px ${brand.colorBottom}dd) drop-shadow(0 8px 20px rgba(0,0,0,0.55))` }}
      >
        <defs>
          <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor={brand.colorTop} />
            <stop offset="100%" stopColor={brand.colorBottom} />
          </linearGradient>
          <linearGradient id={`side-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={brand.colorBottom} stopOpacity="0.9" />
            <stop offset="100%" stopColor={brand.colorBottom} stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={`top-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={brand.colorTop} stopOpacity="0.6" />
            <stop offset="100%" stopColor={brand.colorBottom} stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id={`shine-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.09)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.03)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </linearGradient>
          <linearGradient id={`stripe-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={brand.accent} />
            <stop offset="100%" stopColor={brand.accentLight} />
          </linearGradient>
          <pattern id={`dot-${id}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="0.7" fill={brand.accent} fillOpacity="0.13" />
          </pattern>
          <clipPath id={`clip-${id}`}>
            <path d="M66 30 C68 16 82 8 96 8 L144 8 C158 8 172 16 174 30 L186 58 L198 96 L206 282 C206 300 194 314 178 314 L62 314 C46 314 34 300 34 282 L42 96 L54 58 Z" />
          </clipPath>
        </defs>

        {/* Правая боковая грань */}
        <path d="M174 30 L186 58 L198 96 L206 282 C206 300 194 314 178 314 L200 312 C218 310 228 298 228 280 L220 96 L208 58 L196 30 Z"
          fill={`url(#side-${id})`} />

        {/* Верхняя грань клапана */}
        <path d="M66 30 C68 16 82 8 96 8 L144 8 C158 8 172 16 174 30 L196 30 C192 12 178 -2 158 -2 L82 -2 C62 -2 48 12 44 30 Z"
          fill={`url(#top-${id})`} />

        {/* Тело пачки */}
        <path d="M66 30 C68 16 82 8 96 8 L144 8 C158 8 172 16 174 30 L186 58 L198 96 L206 282 C206 300 194 314 178 314 L62 314 C46 314 34 300 34 282 L42 96 L54 58 Z"
          fill={`url(#bg-${id})`} />

        {/* Точечный паттерн */}
        <path d="M66 30 C68 16 82 8 96 8 L144 8 C158 8 172 16 174 30 L186 58 L198 96 L206 282 C206 300 194 314 178 314 L62 314 C46 314 34 300 34 282 L42 96 L54 58 Z"
          fill={`url(#dot-${id})`} />

        {/* Боковой блик */}
        <path d="M66 30 C68 16 82 8 96 8 L144 8 C158 8 172 16 174 30 L186 58 L198 96 L206 282 C206 300 194 314 178 314 L62 314 C46 314 34 300 34 282 L42 96 L54 58 Z"
          fill={`url(#shine-${id})`} />

        {/* Акцентная полоска вверху */}
        <rect x="34" y="27" width="162" height="5" rx="2.5" fill={`url(#stripe-${id})`} opacity="0.85" />

        {/* Шов клапана */}
        <path d="M40 68 L200 68" stroke={brand.accent} strokeOpacity="0.18" strokeWidth="1" strokeDasharray="5 4" />

        {/* Рёбра жёсткости */}
        <line x1="74" y1="70" x2="66" y2="312" stroke={brand.accent} strokeOpacity="0.06" strokeWidth="1.5" />
        <line x1="166" y1="70" x2="174" y2="312" stroke={brand.accent} strokeOpacity="0.06" strokeWidth="1.5" />

        {/* Этикетка */}
        <rect x="54" y="84" width="132" height="184" rx="11" fill={brand.colorBottom} fillOpacity="0.65" />
        <rect x="54" y="84" width="132" height="184" rx="11" fill="none" stroke={brand.accent} strokeOpacity="0.28" strokeWidth="1" />

        {/* Иконка */}
        <circle cx="120" cy="122" r="24" fill={brand.accent} fillOpacity="0.13" stroke={brand.accent} strokeOpacity="0.38" strokeWidth="1.5" />
        <g transform="translate(109,111)">
          <path d="M1 4h18v1C19 12 15.2 15 13 15S7 12 7 5V4H1Z" stroke={brand.accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M15 4c0-1.6 2.5-1.6 2.5 0v2.5" stroke={brand.accent} strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M7 1.2v2.3M11 0.8v2.5M15 1.2v2.3" stroke={brand.accent} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </g>

        {/* Название бренда */}
        <text x="120" y="162" textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif" fontSize="15" fontWeight="700" letterSpacing="2.5"
          fill={brand.accent} style={{ filter: `drop-shadow(0 0 10px ${brand.accent}70)` }}>
          {brand.name.split(" ")[0]}
        </text>
        {brand.name.split(" ")[1] && (
          <text x="120" y="180" textAnchor="middle"
            fontFamily="Georgia, 'Times New Roman', serif" fontSize="15" fontWeight="700" letterSpacing="2.5"
            fill={brand.accent} style={{ filter: `drop-shadow(0 0 10px ${brand.accent}70)` }}>
            {brand.name.split(" ")[1]}
          </text>
        )}

        {/* Разделитель */}
        <line x1="92" y1="190" x2="148" y2="190" stroke={brand.accentLight} strokeOpacity="0.35" strokeWidth="0.8" />

        {/* Подпись */}
        <text x="120" y="204" textAnchor="middle" fontFamily="monospace" fontSize="7.5" letterSpacing="1.8"
          fill={brand.accentLight} fillOpacity="0.65">{brand.sub}</text>

        {/* Тег обжарки */}
        <rect x="91" y="214" width="58" height="15" rx="7.5" fill={brand.accent} fillOpacity="0.14" stroke={brand.accent} strokeOpacity="0.35" strokeWidth="0.8" />
        <text x="120" y="224.5" textAnchor="middle" fontFamily="monospace" fontSize="6.5" letterSpacing="1"
          fill={brand.accentLight} fillOpacity="0.85">{brand.roast}</text>

        {/* Вес */}
        <text x="120" y="256" textAnchor="middle" fontFamily="monospace" fontSize="9" letterSpacing="2.5"
          fill={brand.accent} fillOpacity="0.38">250г</text>

        {/* Складка низа */}
        <path d="M42 282 L34 282 C34 300 46 314 62 314 L178 314 C194 314 206 300 206 282 L198 282 C198 296 188 308 176 308 L64 308 C52 308 42 296 42 282 Z"
          fill={brand.colorBottom} fillOpacity="0.75" />
        <line x1="42" y1="282" x2="198" y2="282" stroke={brand.accent} strokeOpacity="0.12" strokeWidth="1" />

        {/* Блик-полоска */}
        <path d="M64 70 C62 110 60 170 62 260 C62 280 64 300 66 308"
          stroke="white" strokeOpacity="0.07" strokeWidth="7" strokeLinecap="round" />
      </svg>
    </div>
  );
};

// ── Виджет выбора цвета ────────────────────────────────────────

interface ColorPickerProps { brands: CoffeeBrand[]; current: number; onChange: (i: number) => void }

const ColorPicker = ({ brands, current, onChange }: ColorPickerProps) => (
  <div className="glass rounded-2xl px-3 py-4 shadow-lg flex flex-col items-center gap-2.5">
    <span className="text-[9px] font-mono text-muted-foreground tracking-wider mb-0.5">ЦВЕТ</span>
    {brands.map((b, i) => (
      <button key={b.name} onClick={() => onChange(i)} title={b.name}
        className="transition-transform duration-200"
        style={{ transform: i === current ? "scale(1.3)" : "scale(1)" }}>
        <div className="w-7 h-7 rounded-full border-2 transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${b.colorTop}, ${b.colorBottom})`,
            borderColor: i === current ? b.accent : "transparent",
            boxShadow: i === current ? `0 0 10px ${b.accent}70` : "none",
          }} />
      </button>
    ))}
  </div>
);

// ── Главный компонент ──────────────────────────────────────────

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(() => setCurrent(c => (c + 1) % COFFEE_BRANDS.length), CYCLE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused]);

  const handlePick = (i: number) => {
    setCurrent(i);
    setPaused(true);
    setTimeout(() => setPaused(false), 6000);
  };

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
              <a href="#calculator"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-95">
                Рассчитать стоимость <Icon name="ArrowRight" size={16} />
              </a>
              <button className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-full text-sm font-medium hover:bg-secondary transition-all hover:border-primary/30">
                <Icon name="Package" size={16} /> Смотреть образцы
              </button>
            </div>
            <div className="flex gap-8 pt-2 border-t border-border">
              {[
                { val: "500+",     label: "КЛИЕНТОВ"         },
                { val: "14 дней",  label: "ДО ПЕРВОЙ ПАРТИИ" },
                { val: "от 50 кг", label: "МИН. ЗАКАЗ"       },
              ].map(s => (
                <div key={s.label}>
                  <p className="font-serif text-2xl font-semibold">{s.val}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Правая колонка — пачка */}
          <div className="relative scroll-reveal flex justify-center items-center" data-delay="150">

            {/* Badge партия */}
            <div className="absolute left-0 top-10 glass rounded-2xl px-4 py-3 shadow-lg z-20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold">Партия готова</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">ЗАКАЗ #2847 · 200 кг</p>
            </div>

            {/* Пикер цвета */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20">
              <ColorPicker brands={COFFEE_BRANDS} current={current} onChange={handlePick} />
            </div>

            {/* Badge рост */}
            <div className="absolute left-0 bottom-8 glass rounded-2xl px-4 py-3 shadow-lg z-20">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="TrendingUp" size={14} className="text-primary" />
                <span className="text-xs font-semibold">Рост продаж</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">+38% после запуска бренда</p>
            </div>

            {/* V2 slot ─────────────────── */}
            <style>{`
              @keyframes bagFloat {
                0%,100% { transform: translateY(0px) rotate(-0.4deg); }
                50%     { transform: translateY(-13px) rotate(0.4deg); }
              }
              .bag-float { animation: bagFloat 9s ease-in-out infinite; }
              .bag-float.paused { animation-play-state: paused; }
            `}</style>

            <a href="#calculator" className="relative flex flex-col items-center cursor-pointer"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onTouchStart={() => setPaused(p => !p)}>

              {/* Свечение */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-44 h-14 rounded-full blur-3xl transition-all duration-1000"
                style={{ background: COFFEE_BRANDS[current].accent, opacity: 0.22 }} />

              {/* Пачка */}
              <div className={`bag-float ${paused ? "paused" : ""} relative`} style={{ width: 240, height: 330 }}>
                {COFFEE_BRANDS.map((b, i) => (
                  <CoffeeBag key={b.name} brand={b} opacity={i === current ? 1 : 0} />
                ))}
                {/* Hover CTA */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${paused ? "opacity-100" : "opacity-0"}`}>
                  <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center gap-2 text-white text-sm font-medium shadow-xl">
                    <Icon name="Sparkles" size={15} />
                    Собрать свою пачку
                  </div>
                </div>
              </div>

              {/* Название */}
              <div className="relative mt-3 text-center" style={{ height: 36 }}>
                {COFFEE_BRANDS.map((b, i) => (
                  <div key={b.name} className="absolute inset-x-0 transition-all duration-700"
                    style={{ opacity: i === current ? 1 : 0, transform: `translateY(${i === current ? 0 : 6}px)` }}>
                    <p className="text-sm font-serif font-bold tracking-wide" style={{ color: b.accent }}>{b.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{b.sub}</p>
                  </div>
                ))}
              </div>
            </a>
            {/* ─────────────────────────── */}
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
