import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const BRANDS = [
  {
    name: "NORD ROAST",
    sub: "SPECIALTY · ETHIOPIA",
    roast: "LIGHT ROAST",
    bagColor: "#0f1c3f",
    bagColor2: "#1a2f5e",
    sideColor: "#0a1428",
    topColor: "#162244",
    accent: "#4f8ef7",
    labelBg: "#1e3a8a",
    stripe: "#60a5fa",
  },
  {
    name: "TERRA VERDE",
    sub: "ORGANIC · BRAZIL",
    roast: "MEDIUM ROAST",
    bagColor: "#0d2818",
    bagColor2: "#1a3a2a",
    sideColor: "#081a10",
    topColor: "#112218",
    accent: "#4ade80",
    labelBg: "#14532d",
    stripe: "#86efac",
  },
  {
    name: "SOLEIL NOIR",
    sub: "DARK BLEND · COLOMBIA",
    roast: "DARK ROAST",
    bagColor: "#1c0a00",
    bagColor2: "#2d1500",
    sideColor: "#120600",
    topColor: "#1f0d00",
    accent: "#f97316",
    labelBg: "#7c2d12",
    stripe: "#fdba74",
  },
  {
    name: "BLANC PEAK",
    sub: "FILTER · KENYA AA",
    roast: "LIGHT ROAST",
    bagColor: "#1a0a2e",
    bagColor2: "#2d1254",
    sideColor: "#110620",
    topColor: "#1e0d35",
    accent: "#c084fc",
    labelBg: "#581c87",
    stripe: "#e9d5ff",
  },
];

const CYCLE_MS = 8000;
const FADE_MS = 900;

// ── 3D CSS-пачка кофе ─────────────────────────────────────────

interface PackProps {
  brand: typeof BRANDS[0];
  opacity: number;
}

const CoffeePack = ({ brand, opacity }: PackProps) => {
  // Размеры граней
  const W = 160; // ширина лица
  const H = 230; // высота
  const D = 55;  // глубина (бок)

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity, transition: `opacity ${FADE_MS}ms ease-in-out` }}
    >
      {/* perspective-обёртка */}
      <div style={{ perspective: "900px", perspectiveOrigin: "50% 45%" }}>
        <div
          style={{
            width: W,
            height: H,
            position: "relative",
            transformStyle: "preserve-3d",
            transform: "rotateY(-22deg) rotateX(4deg)",
          }}
        >
          {/* ── Лицевая грань ── */}
          <div
            style={{
              position: "absolute",
              width: W,
              height: H,
              background: `linear-gradient(160deg, ${brand.bagColor2} 0%, ${brand.bagColor} 60%, ${brand.sideColor} 100%)`,
              borderRadius: "18px 18px 12px 12px",
              backfaceVisibility: "hidden",
              transform: `translateZ(${D / 2}px)`,
              boxShadow: `inset -6px 0 20px rgba(0,0,0,0.4), inset 3px 0 12px rgba(255,255,255,0.04)`,
              overflow: "hidden",
            }}
          >
            {/* Клапан сверху */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 36,
              background: brand.sideColor,
              borderBottom: `1px solid ${brand.accent}25`,
              borderRadius: "18px 18px 0 0",
            }} />
            {/* Линия-шов клапана */}
            <div style={{
              position: "absolute", top: 36, left: 12, right: 12, height: 1,
              background: `${brand.accent}30`,
            }} />

            {/* Полоска-акцент сверху */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 4,
              background: brand.stripe, borderRadius: "18px 18px 0 0",
              opacity: 0.9,
            }} />

            {/* Этикетка */}
            <div style={{
              position: "absolute", top: 48, left: 14, right: 14, bottom: 24,
              background: `${brand.labelBg}`,
              borderRadius: 10,
              border: `1px solid ${brand.accent}35`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "14px 10px",
              overflow: "hidden",
            }}>
              {/* Фоновый паттерн */}
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: `radial-gradient(${brand.accent}12 1px, transparent 1px)`,
                backgroundSize: "14px 14px",
              }} />

              {/* Иконка */}
              <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: `${brand.accent}20`,
                border: `1.5px solid ${brand.accent}50`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 10, position: "relative",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M17 8h1a4 4 0 0 1 0 8h-1" stroke={brand.accent} strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" stroke={brand.accent} strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M6 1v3M10 1v3M14 1v3" stroke={brand.accent} strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>

              {/* Название */}
              <div style={{
                fontFamily: "Georgia, serif",
                fontSize: 15,
                fontWeight: 700,
                color: brand.accent,
                letterSpacing: "0.12em",
                textAlign: "center",
                lineHeight: 1.2,
                position: "relative",
                textShadow: `0 0 20px ${brand.accent}60`,
              }}>
                {brand.name.split(" ").map((w, i) => (
                  <div key={i}>{w}</div>
                ))}
              </div>

              {/* Разделитель */}
              <div style={{
                width: 32, height: 1,
                background: `${brand.stripe}60`,
                margin: "8px 0",
                position: "relative",
              }} />

              {/* Подпись */}
              <div style={{
                fontFamily: "monospace",
                fontSize: 8,
                color: `${brand.stripe}90`,
                letterSpacing: "0.15em",
                textAlign: "center",
                position: "relative",
              }}>
                {brand.sub}
              </div>

              {/* Тег обжарки */}
              <div style={{
                marginTop: 8,
                padding: "2px 8px",
                borderRadius: 99,
                background: `${brand.accent}20`,
                border: `1px solid ${brand.accent}40`,
                fontFamily: "monospace",
                fontSize: 7,
                color: brand.stripe,
                letterSpacing: "0.1em",
                position: "relative",
              }}>
                {brand.roast}
              </div>
            </div>

            {/* Низ пачки — складка */}
            <div style={{
              position: "absolute", bottom: 0, left: 10, right: 10, height: 24,
              background: brand.sideColor,
              borderRadius: "0 0 12px 12px",
              borderTop: `1px solid ${brand.accent}15`,
            }}>
              <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                fontFamily: "monospace", fontSize: 7,
                color: `${brand.accent}50`, letterSpacing: "0.2em",
              }}>250г</div>
            </div>

            {/* Блик */}
            <div style={{
              position: "absolute", top: 40, left: 16, width: 6, height: 100,
              background: "linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)",
              borderRadius: 4, transform: "rotate(5deg)",
            }} />
          </div>

          {/* ── Правая боковая грань ── */}
          <div
            style={{
              position: "absolute",
              width: D,
              height: H,
              left: W,
              top: 0,
              background: `linear-gradient(to right, ${brand.sideColor}, ${brand.bagColor}aa)`,
              transform: `rotateY(90deg) translateZ(${D / 2}px) translateX(-${D / 2}px)`,
              transformOrigin: "left center",
              backfaceVisibility: "hidden",
              borderRadius: "0 10px 8px 0",
              boxShadow: `inset -4px 0 12px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Вертикальная надпись на боку */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%) rotate(90deg)",
              fontFamily: "monospace", fontSize: 7,
              color: `${brand.accent}40`, letterSpacing: "0.25em",
              whiteSpace: "nowrap",
            }}>
              KONTRAKTKAFE · {brand.roast}
            </div>
          </div>

          {/* ── Верхняя грань ── */}
          <div
            style={{
              position: "absolute",
              width: W,
              height: D,
              top: 0,
              left: 0,
              background: `linear-gradient(to bottom, ${brand.topColor}, ${brand.sideColor})`,
              transform: `rotateX(90deg) translateZ(${D / 2}px) translateY(-${D / 2}px)`,
              transformOrigin: "top center",
              backfaceVisibility: "hidden",
              borderRadius: "10px 10px 0 0",
              boxShadow: `inset 0 -4px 12px rgba(0,0,0,0.3)`,
            }}
          />
        </div>
      </div>
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

          {/* ── Правая колонка — 3D пачка ── */}
          <div className="relative scroll-reveal flex flex-col items-center" data-delay="150">

            {/* Badge — партия */}
            <div className="absolute left-0 top-8 glass rounded-2xl px-4 py-3 shadow-lg z-20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold">Партия готова</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">ЗАКАЗ #2847 · 200 кг</p>
            </div>

            {/* Badge — рост */}
            <div className="absolute right-0 bottom-16 glass rounded-2xl px-4 py-3 shadow-lg z-20">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="TrendingUp" size={14} className="text-primary" />
                <span className="text-xs font-semibold">Рост продаж</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">+38% после запуска бренда</p>
            </div>

            {/* ── Слот V2: здесь заменить на видео ── */}
            <style>{`
              @keyframes bagFloat {
                0%,100% { transform: translateY(0px); }
                50%     { transform: translateY(-14px); }
              }
              .bag-scene { animation: bagFloat 8s ease-in-out infinite; }
              .bag-scene.paused { animation-play-state: paused; }
            `}</style>

            <a
              href="#calculator"
              className="relative flex flex-col items-center cursor-pointer"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onTouchStart={() => setPaused((p) => !p)}
              title="Собрать свою пачку"
            >
              {/* Свечение под пачкой */}
              <div
                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-40 h-12 rounded-full blur-3xl transition-all duration-1000"
                style={{ background: BRANDS[current].accent, opacity: 0.25 }}
              />

              {/* 3D пачка */}
              <div className={`bag-scene ${paused ? "paused" : ""} relative`} style={{ width: 220, height: 290 }}>
                {BRANDS.map((b, i) => (
                  <CoffeePack key={b.name} brand={b} opacity={i === current ? 1 : 0} />
                ))}

                {/* Hover — оверлей CTA */}
                <div className={`absolute inset-0 flex items-end justify-center pb-4 transition-opacity duration-300 ${paused ? "opacity-100" : "opacity-0"}`}>
                  <div className="bg-black/65 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-1.5 text-white text-xs font-medium">
                    <Icon name="ArrowRight" size={12} />
                    Собрать свою пачку
                  </div>
                </div>
              </div>

              {/* Точки */}
              <div className="flex gap-2 mt-4">
                {BRANDS.map((b, i) => (
                  <button
                    key={b.name}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrent(i);
                      setPaused(true);
                      setTimeout(() => setPaused(false), 5000);
                    }}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      background: i === current ? b.accent : "#88888840",
                      transform: i === current ? "scale(1.5)" : "scale(1)",
                    }}
                  />
                ))}
              </div>

              {/* Название бренда под пачкой */}
              <div className="mt-3 text-center" style={{ minHeight: 32 }}>
                {BRANDS.map((b, i) => (
                  <div
                    key={b.name}
                    className="absolute left-1/2 -translate-x-1/2 transition-all duration-700"
                    style={{ opacity: i === current ? 1 : 0, transform: `translateX(-50%) translateY(${i === current ? 0 : 6}px)` }}
                  >
                    <p className="text-xs font-serif font-semibold" style={{ color: b.accent }}>{b.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{b.sub}</p>
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
