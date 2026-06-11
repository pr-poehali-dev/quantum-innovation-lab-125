import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { COFFEE_BRANDS, CYCLE_MS, type CoffeeBrand } from "@/config/coffeeBrands";

// ─────────────────────────────────────────────────────────────
// SVG-пачка кофе 1:1 по макету
// Форма: зауженный верх (клапан), широкое тело, боковая грань
// Паттерн: топографические линии как на макете
// V2 slot: заменить SVG на <video> — пропорции те же
// ─────────────────────────────────────────────────────────────

interface BagProps { brand: CoffeeBrand; opacity: number }

const CoffeeBag = ({ brand, opacity }: BagProps) => {
  const id = brand.name.replace(/\s+/g, "_");

  // Форма пачки по макету
  // Верхняя часть — зажатый клапан с защипами
  // Тело — трапеция, чуть шире внизу
  // Нижний клапан — складка
  const BODY  = "M 58,72 C 52,72 44,78 44,86 L 36,270 C 34,288 44,306 62,310 L 218,310 C 236,306 246,288 244,270 L 236,86 C 236,78 228,72 222,72 Z";
  const FLAP_TOP = "M 82,16 C 82,8 94,4 104,4 L 176,4 C 186,4 198,8 198,16 L 210,42 C 210,52 202,60 192,60 L 88,60 C 78,60 70,52 70,42 Z";
  const SIDE  = "M 222,72 C 228,72 236,78 236,86 L 244,270 C 246,288 236,306 218,310 L 246,306 C 264,302 272,284 270,266 L 262,82 C 262,74 256,68 248,68 Z";
  const FLAP_SIDE = "M 198,16 C 198,8 208,4 216,8 L 232,20 C 238,26 236,38 228,42 L 210,42 Z";
  const BOTTOM_FOLD = "M 36,280 C 36,296 46,310 62,312 L 218,312 C 234,310 244,296 244,280 L 244,294 C 244,306 234,314 220,314 L 60,314 C 46,314 36,306 36,294 Z";

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity, transition: "opacity 1.2s ease-in-out", pointerEvents: "none" }}
    >
      <svg
        width="300" height="360"
        viewBox="0 0 310 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: `drop-shadow(0 40px 60px ${brand.colorBottom}bb) drop-shadow(0 12px 24px rgba(0,0,0,0.6)) drop-shadow(-4px 4px 12px rgba(0,0,0,0.3))`,
          overflow: "visible",
        }}
      >
        <defs>
          {/* Основной градиент — фиолетовый вверху, тёмный внизу (как на макете) */}
          <linearGradient id={`bg-${id}`} x1="0.3" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor={brand.colorTop} />
            <stop offset="45%" stopColor={brand.colorTop} stopOpacity="0.7" />
            <stop offset="100%" stopColor={brand.colorBottom} />
          </linearGradient>
          {/* Боковая грань — темнее */}
          <linearGradient id={`side-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={brand.colorBottom} stopOpacity="0.95" />
            <stop offset="100%" stopColor={brand.colorBottom} stopOpacity="0.6" />
          </linearGradient>
          {/* Верхний клапан */}
          <linearGradient id={`flap-${id}`} x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor={brand.colorTop} stopOpacity="0.9" />
            <stop offset="100%" stopColor={brand.colorBottom} stopOpacity="0.85" />
          </linearGradient>
          {/* Боковой клапан */}
          <linearGradient id={`flapside-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={brand.colorTop} stopOpacity="0.5" />
            <stop offset="100%" stopColor={brand.colorBottom} stopOpacity="0.9" />
          </linearGradient>
          {/* Блик слева */}
          <linearGradient id={`shineL-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          {/* Затемнение справа */}
          <linearGradient id={`shadeR-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
          </linearGradient>
          {/* Вертикальное затемнение снизу */}
          <linearGradient id={`shadeB-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
          </linearGradient>
          {/* Топографический паттерн */}
          <pattern id={`topo-${id}`} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M10,40 Q20,20 30,40 Q40,60 50,40 Q60,20 70,40 Q80,60 90,40" stroke={brand.accentLight} strokeOpacity="0.08" strokeWidth="0.8" fill="none" />
            <path d="M0,60 Q15,45 25,60 Q35,75 50,60 Q65,45 80,60" stroke={brand.accentLight} strokeOpacity="0.06" strokeWidth="0.7" fill="none" />
            <path d="M5,20 Q20,5 35,20 Q50,35 65,20 Q75,10 85,20" stroke={brand.accentLight} strokeOpacity="0.06" strokeWidth="0.7" fill="none" />
          </pattern>
          <clipPath id={`clipBody-${id}`}>
            <path d={BODY} />
          </clipPath>
          <clipPath id={`clipFlap-${id}`}>
            <path d={FLAP_TOP} />
          </clipPath>
        </defs>

        {/* ── Боковая правая грань пачки (перспектива) ── */}
        <path d={SIDE} fill={`url(#side-${id})`} />

        {/* Боковой клапан-верх */}
        <path d={FLAP_SIDE} fill={`url(#flapside-${id})`} />

        {/* ── Верхний клапан ── */}
        <path d={FLAP_TOP} fill={`url(#flap-${id})`} />
        {/* Топо-паттерн на клапане */}
        <path d={FLAP_TOP} fill={`url(#topo-${id})`} />
        {/* Линия шва клапана */}
        <path d="M 80,60 L 200,60" stroke={brand.accentLight} strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 3" />
        {/* Защипы клапана */}
        <path d="M 94,42 L 90,60" stroke={brand.accentLight} strokeOpacity="0.15" strokeWidth="1.5" />
        <path d="M 186,42 L 190,60" stroke={brand.accentLight} strokeOpacity="0.15" strokeWidth="1.5" />

        {/* ── Тело пачки — основной слой ── */}
        <path d={BODY} fill={`url(#bg-${id})`} />

        {/* Топографический паттерн поверх */}
        <path d={BODY} fill={`url(#topo-${id})`} />

        {/* Блик слева */}
        <path d={BODY} fill={`url(#shineL-${id})`} />

        {/* Затемнение справа */}
        <path d={BODY} fill={`url(#shadeR-${id})`} />

        {/* Затемнение снизу */}
        <path d={BODY} fill={`url(#shadeB-${id})`} />

        {/* ── Нижняя складка ── */}
        <path d={BOTTOM_FOLD} fill={brand.colorBottom} fillOpacity="0.7" />
        <path d="M 38,284 L 242,284" stroke={brand.accentLight} strokeOpacity="0.1" strokeWidth="1" />

        {/* ── Вертикальные боковые рёбра ── */}
        <line x1="80" y1="72" x2="72" y2="308" stroke={brand.accentLight} strokeOpacity="0.07" strokeWidth="1.5" />
        <line x1="200" y1="72" x2="208" y2="308" stroke={brand.accentLight} strokeOpacity="0.07" strokeWidth="1.5" />

        {/* ── ЭТИКЕТКА — центральная зона ── */}
        {/* Иконка кофе в круге */}
        <circle cx="140" cy="136" r="28" fill={brand.accent} fillOpacity="0.12" stroke={brand.accent} strokeOpacity="0.35" strokeWidth="1.5" />
        {/* Чашка кофе */}
        <g transform="translate(128,124)" stroke={brand.accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M1 5 L19 5 L19 6 C19 13 15 16 12 16 C9 16 5 13 5 6 L5 5 Z" />
          <path d="M16 5 C16 3 19 3 19 5 L19 8" />
          <path d="M7 2 L7 4.5 M11 1.5 L11 4.5 M15 2 L15 4.5" />
        </g>

        {/* Название — строка 1 */}
        <text x="140" y="183" textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="20" fontWeight="700" letterSpacing="3"
          fill="white" fillOpacity="0.95">
          {brand.name.split(" ")[0]}
        </text>
        {/* Название — строка 2 */}
        {brand.name.split(" ")[1] && (
          <text x="140" y="206" textAnchor="middle"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize="20" fontWeight="700" letterSpacing="3"
            fill="white" fillOpacity="0.95">
            {brand.name.split(" ")[1]}
          </text>
        )}

        {/* Подпись происхождение */}
        <text x="140" y="228" textAnchor="middle"
          fontFamily="'Courier New', monospace"
          fontSize="9" letterSpacing="2.5"
          fill="white" fillOpacity="0.55">
          {brand.sub}
        </text>

        {/* Тег обжарки — таблетка */}
        <rect x="104" y="237" width="72" height="18" rx="9"
          fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        <text x="140" y="249.5" textAnchor="middle"
          fontFamily="'Courier New', monospace"
          fontSize="8" letterSpacing="1.5"
          fill="white" fillOpacity="0.65">
          {brand.roast}
        </text>

        {/* Вес */}
        <text x="140" y="278" textAnchor="middle"
          fontFamily="'Courier New', monospace"
          fontSize="10" letterSpacing="3"
          fill="white" fillOpacity="0.35">
          250г
        </text>

        {/* ── Блик-полоса слева (реализм) ── */}
        <path d="M 66,76 C 64,120 63,180 65,264 C 65,284 67,300 70,308"
          stroke="white" strokeOpacity="0.1" strokeWidth="9" strokeLinecap="round" />
        <path d="M 66,76 C 64,120 63,180 65,264 C 65,284 67,300 70,308"
          stroke="white" strokeOpacity="0.06" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
};

// ── Виджет выбора цвета (как на макете) ───────────────────────

interface ColorPickerProps { brands: CoffeeBrand[]; current: number; onChange: (i: number) => void }

const ColorPicker = ({ brands, current, onChange }: ColorPickerProps) => (
  <div className="glass rounded-2xl px-3 py-4 shadow-lg flex flex-col items-center gap-3">
    <span className="text-[9px] font-mono text-muted-foreground tracking-wider">ЦВЕТ<br/>УПАКОВКИ</span>
    {brands.map((b, i) => (
      <button key={b.name} onClick={() => onChange(i)} title={b.name}
        className="relative transition-all duration-200"
        style={{ transform: i === current ? "scale(1.2)" : "scale(1)" }}>
        <div className="w-8 h-8 rounded-full border-2 transition-all duration-300"
          style={{
            background: `linear-gradient(145deg, ${b.colorTop}, ${b.colorBottom})`,
            borderColor: i === current ? "white" : "transparent",
            boxShadow: i === current ? `0 0 0 3px ${b.accent}50, 0 4px 12px ${b.accent}40` : "0 2px 6px rgba(0,0,0,0.2)",
          }} />
        {i === current && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white opacity-80" />
          </div>
        )}
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

  const brand = COFFEE_BRANDS[current];

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Левая колонка ── */}
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

          {/* ── Правая колонка — пачка ── */}
          <div className="relative scroll-reveal flex justify-center items-center min-h-[420px]" data-delay="150">

            {/* Badge — партия (слева) */}
            <div className="absolute left-0 top-12 glass rounded-2xl px-4 py-3 shadow-lg z-20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold">Партия готова</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">ЗАКАЗ #2847 · 200 кг</p>
            </div>

            {/* Пикер цвета (справа, как на макете) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20">
              <ColorPicker brands={COFFEE_BRANDS} current={current} onChange={handlePick} />
            </div>

            {/* ── V2 slot ─────────────────────────── */}
            <style>{`
              @keyframes bagFloat {
                0%,100% { transform: translateY(0px) rotate(-0.3deg); }
                50%     { transform: translateY(-16px) rotate(0.3deg); }
              }
              .bag-float { animation: bagFloat 9s ease-in-out infinite; }
              .bag-float.paused { animation-play-state: paused; }
            `}</style>

            <a
              href="#calculator"
              className="relative flex flex-col items-center cursor-pointer group"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onTouchStart={() => setPaused(p => !p)}
              title="Собрать свою пачку"
            >
              {/* Мягкое свечение под пачкой */}
              <div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-52 h-16 rounded-full blur-3xl transition-all duration-1000"
                style={{ background: brand.colorTop, opacity: 0.28 }}
              />

              {/* Пачка */}
              <div className={`bag-float ${paused ? "paused" : ""} relative`} style={{ width: 300, height: 360 }}>
                {COFFEE_BRANDS.map((b, i) => (
                  <CoffeeBag key={b.name} brand={b} opacity={i === current ? 1 : 0} />
                ))}

                {/* Hover CTA */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${paused ? "opacity-100" : "opacity-0"}`}>
                  <div className="bg-black/55 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center gap-2 text-white text-sm font-medium shadow-xl">
                    <Icon name="Sparkles" size={15} />
                    Собрать свою пачку
                  </div>
                </div>
              </div>

              {/* Точки + название бренда */}
              <div className="flex items-center gap-2 mt-1">
                {COFFEE_BRANDS.map((b, i) => (
                  <button
                    key={b.name}
                    onClick={e => { e.preventDefault(); handlePick(i); }}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      background: i === current ? b.accent : "#88888840",
                      transform: i === current ? "scale(1.5)" : "scale(1)",
                    }}
                  />
                ))}
              </div>

              <div className="relative mt-2 text-center" style={{ height: 34 }}>
                {COFFEE_BRANDS.map((b, i) => (
                  <div key={b.name} className="absolute inset-x-0 transition-all duration-700"
                    style={{ opacity: i === current ? 1 : 0, transform: `translateY(${i === current ? 0 : 5}px)` }}>
                    <p className="text-sm font-serif font-bold tracking-wide" style={{ color: b.accent }}>{b.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{b.sub}</p>
                  </div>
                ))}
              </div>
            </a>
            {/* ─────────────────────────────────────── */}

          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
