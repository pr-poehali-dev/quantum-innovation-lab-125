import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { COFFEE_BRANDS, CYCLE_MS, type CoffeeBrand } from "@/config/coffeeBrands";

interface BagProps { brand: CoffeeBrand; opacity: number }

const CoffeeBag = ({ brand, opacity }: BagProps) => {
  const id = brand.name.replace(/\s+/g, "_");
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity, transition: "opacity 1.2s ease-in-out", pointerEvents: "none" }}
    >
      <svg
        width="260" height="340"
        viewBox="0 0 260 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: `drop-shadow(0 32px 48px ${brand.colorBottom}bb) drop-shadow(0 8px 20px rgba(0,0,0,0.55)) drop-shadow(-4px 4px 12px rgba(0,0,0,0.3))`,
          overflow: "visible",
        }}
      >
        <defs>
          <linearGradient id={`bg-${id}`} x1="0.3" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor={brand.colorTop} />
            <stop offset="45%" stopColor={brand.colorTop} stopOpacity="0.7" />
            <stop offset="100%" stopColor={brand.colorBottom} />
          </linearGradient>
          <linearGradient id={`side-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={brand.colorBottom} stopOpacity="0.95" />
            <stop offset="100%" stopColor={brand.colorBottom} stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={`top-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={brand.colorTop} stopOpacity="0.6" />
            <stop offset="100%" stopColor={brand.colorBottom} stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id={`shineL-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id={`shadeR-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
          </linearGradient>
          <linearGradient id={`shadeB-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
          </linearGradient>
          <pattern id={`topo-${id}`} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M10,40 Q20,20 30,40 Q40,60 50,40 Q60,20 70,40 Q80,60 90,40" stroke={brand.accentLight} strokeOpacity="0.08" strokeWidth="0.8" fill="none" />
            <path d="M0,60 Q15,45 25,60 Q35,75 50,60 Q65,45 80,60" stroke={brand.accentLight} strokeOpacity="0.06" strokeWidth="0.7" fill="none" />
            <path d="M5,20 Q20,5 35,20 Q50,35 65,20 Q75,10 85,20" stroke={brand.accentLight} strokeOpacity="0.06" strokeWidth="0.7" fill="none" />
          </pattern>
        </defs>

        {/* Правая боковая грань */}
        <path d="M188 28 L200 52 L210 90 L218 290 C218 308 206 320 190 320 L210 318 C228 316 238 304 238 288 L230 90 L220 52 L208 28 Z"
          fill={`url(#side-${id})`} />

        {/* Верхняя грань клапана */}
        <path d="M72 28 C72 18 86 12 100 12 L160 12 C174 12 188 18 188 28 L208 28 C204 14 190 0 168 0 L92 0 C70 0 56 14 52 28 Z"
          fill={`url(#top-${id})`} />

        {/* Тело пачки */}
        <path d="M72 28 C72 18 86 12 100 12 L160 12 C174 12 188 18 188 28 L200 52 L210 90 L218 290 C218 308 206 320 190 320 L70 320 C54 320 42 308 42 290 L50 90 L60 52 Z"
          fill={`url(#bg-${id})`} />
        <path d="M72 28 C72 18 86 12 100 12 L160 12 C174 12 188 18 188 28 L200 52 L210 90 L218 290 C218 308 206 320 190 320 L70 320 C54 320 42 308 42 290 L50 90 L60 52 Z"
          fill={`url(#topo-${id})`} />
        <path d="M72 28 C72 18 86 12 100 12 L160 12 C174 12 188 18 188 28 L200 52 L210 90 L218 290 C218 308 206 320 190 320 L70 320 C54 320 42 308 42 290 L50 90 L60 52 Z"
          fill={`url(#shineL-${id})`} />
        <path d="M72 28 C72 18 86 12 100 12 L160 12 C174 12 188 18 188 28 L200 52 L210 90 L218 290 C218 308 206 320 190 320 L70 320 C54 320 42 308 42 290 L50 90 L60 52 Z"
          fill={`url(#shadeR-${id})`} />
        <path d="M72 28 C72 18 86 12 100 12 L160 12 C174 12 188 18 188 28 L200 52 L210 90 L218 290 C218 308 206 320 190 320 L70 320 C54 320 42 308 42 290 L50 90 L60 52 Z"
          fill={`url(#shadeB-${id})`} />

        {/* Акцентная полоска */}
        <rect x="42" y="26" width="176" height="5" rx="2.5"
          fill={brand.accent} opacity="0.85" />

        {/* Шов клапана */}
        <path d="M48 68 L210 68" stroke={brand.accentLight} strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 3" />

        {/* Складка низа */}
        <path d="M50 290 L42 290 C42 308 54 320 70 320 L190 320 C206 320 218 308 218 290 L210 290 C210 304 200 314 188 314 L72 314 C60 314 50 304 50 290 Z"
          fill={brand.colorBottom} fillOpacity="0.8" />
        <line x1="50" y1="290" x2="210" y2="290" stroke={brand.accentLight} strokeOpacity="0.12" strokeWidth="1" />

        {/* Иконка */}
        <circle cx="130" cy="136" r="28" fill={brand.accent} fillOpacity="0.12" stroke={brand.accent} strokeOpacity="0.35" strokeWidth="1.5" />
        <g transform="translate(118,124)" stroke={brand.accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M1 5 L19 5 L19 6 C19 13 15 16 12 16 C9 16 5 13 5 6 L5 5 Z" />
          <path d="M16 5 C16 3 19 3 19 5 L19 8" />
          <path d="M7 2 L7 4.5 M11 1.5 L11 4.5 M15 2 L15 4.5" />
        </g>

        {/* Название */}
        <text x="130" y="184" textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif" fontSize="20" fontWeight="700" letterSpacing="3"
          fill="white" fillOpacity="0.95">
          {brand.name.split(" ")[0]}
        </text>
        {brand.name.split(" ")[1] && (
          <text x="130" y="207" textAnchor="middle"
            fontFamily="Georgia, 'Times New Roman', serif" fontSize="20" fontWeight="700" letterSpacing="3"
            fill="white" fillOpacity="0.95">
            {brand.name.split(" ")[1]}
          </text>
        )}

        {/* Подпись */}
        <text x="130" y="228" textAnchor="middle" fontFamily="'Courier New', monospace"
          fontSize="9" letterSpacing="2.5" fill="white" fillOpacity="0.55">{brand.sub}</text>

        {/* Тег обжарки */}
        <rect x="100" y="237" width="60" height="18" rx="9"
          fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        <text x="130" y="249.5" textAnchor="middle" fontFamily="'Courier New', monospace"
          fontSize="8" letterSpacing="1.5" fill="white" fillOpacity="0.65">{brand.roast}</text>

        {/* Вес */}
        <text x="130" y="278" textAnchor="middle" fontFamily="'Courier New', monospace"
          fontSize="10" letterSpacing="3" fill="white" fillOpacity="0.35">250г</text>

        {/* Блик */}
        <path d="M66 72 C64 120 63 180 65 264 C65 284 67 300 70 308"
          stroke="white" strokeOpacity="0.1" strokeWidth="9" strokeLinecap="round" />
      </svg>
    </div>
  );
};

// ── Главный компонент ─────────────────────────────────────────

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(() => setCurrent(c => (c + 1) % COFFEE_BRANDS.length), CYCLE_MS);
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

          {/* Правая колонка — парящая пачка */}
          <div className="relative scroll-reveal flex justify-center items-center" data-delay="150">

            {/* Badge партия */}
            <div className="absolute left-0 top-10 glass rounded-2xl px-4 py-3 shadow-lg z-20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold">Партия готова</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">ЗАКАЗ #2847 · 200 кг</p>
            </div>

            {/* Badge рост */}
            <div className="absolute left-0 bottom-8 glass rounded-2xl px-4 py-3 shadow-lg z-20">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="TrendingUp" size={14} className="text-primary" />
                <span className="text-xs font-semibold">Рост продаж</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">+38% после запуска бренда</p>
            </div>

            {/* V2 slot */}
            <style>{`
              @keyframes bagFloat {
                0%,100% { transform: translateY(0px) rotate(-0.4deg); }
                50%     { transform: translateY(-18px) rotate(0.4deg); }
              }
              .bag-float { animation: bagFloat 9s ease-in-out infinite; }
              .bag-float.paused { animation-play-state: paused; }
            `}</style>

            <a
              href="#calculator"
              className="relative flex flex-col items-center cursor-pointer"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onTouchStart={() => setPaused(p => !p)}
            >
              {/* Свечение */}
              <div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-52 h-14 rounded-full blur-3xl transition-all duration-1000"
                style={{ background: COFFEE_BRANDS[current].colorTop, opacity: 0.3 }}
              />

              {/* Пачка */}
              <div className={`bag-float ${paused ? "paused" : ""} relative`} style={{ width: 260, height: 340 }}>
                {COFFEE_BRANDS.map((b, i) => (
                  <CoffeeBag key={b.name} brand={b} opacity={i === current ? 1 : 0} />
                ))}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${paused ? "opacity-100" : "opacity-0"}`}>
                  <div className="bg-black/55 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center gap-2 text-white text-sm font-medium shadow-xl">
                    <Icon name="Sparkles" size={15} />
                    Собрать свою пачку
                  </div>
                </div>
              </div>

              {/* Точки */}
              <div className="flex gap-2 mt-3">
                {COFFEE_BRANDS.map((b, i) => (
                  <button key={b.name}
                    onClick={e => { e.preventDefault(); setCurrent(i); setPaused(true); setTimeout(() => setPaused(false), 5000); }}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      background: i === current ? b.accent : "#88888840",
                      transform: i === current ? "scale(1.5)" : "scale(1)",
                    }}
                  />
                ))}
              </div>

              {/* Название */}
              <div className="relative mt-2 text-center" style={{ height: 34 }}>
                {COFFEE_BRANDS.map((b, i) => (
                  <div key={b.name} className="absolute inset-x-0 transition-all duration-700"
                    style={{ opacity: i === current ? 1 : 0, transform: `translateY(${i === current ? 0 : 6}px)` }}>
                    <p className="text-sm font-serif font-bold tracking-wide" style={{ color: b.accent }}>{b.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{b.sub}</p>
                  </div>
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
