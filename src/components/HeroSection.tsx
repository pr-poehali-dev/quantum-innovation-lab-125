import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { COFFEE_BRANDS, CYCLE_MS, type CoffeeBrand } from "@/config/coffeeBrands";

const BAG_PNG = "https://cdn.poehali.dev/projects/9054c912-be91-4f90-8cab-0a91d0d7eafe/bucket/bc48b67d-cd2c-4300-8dd4-4486cb69cf7f.png";

// ── Пачка: PNG + CSS-цветовой оверлей ────────────────────────

interface BagProps { brand: CoffeeBrand; active: boolean }

const CoffeeBag = ({ brand, active }: BagProps) => (
  <div
    className="absolute inset-0 flex items-end justify-center"
    style={{
      opacity: active ? 1 : 0,
      transition: "opacity 1.2s ease-in-out",
      pointerEvents: "none",
    }}
  >
    <div className="relative" style={{ width: 260, height: 340 }}>

      {/* Пачка с цветовым тонированием через CSS-фильтр */}
      <img
        src={BAG_PNG}
        alt={brand.name}
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain transition-all duration-1000"
        style={{ filter: `${brand.cssFilter ?? ""} drop-shadow(0 20px 40px ${brand.colorTop}55)` }}
      />

      {/* Этикетка поверх пачки */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        style={{ top: "22%", width: 130, zIndex: 2 }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-0.5"
          style={{ background: `${brand.colorTop}22`, border: `1.5px solid ${brand.colorTop}55` }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M17 8h1a4 4 0 0 1 0 8h-1" stroke={brand.colorTop} strokeWidth="2" strokeLinecap="round"/>
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" stroke={brand.colorTop} strokeWidth="2" strokeLinecap="round"/>
            <path d="M6 1v3M10 1v3M14 1v3" stroke={brand.colorTop} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{
          fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700,
          color: brand.colorBottom, letterSpacing: "0.1em", textAlign: "center", lineHeight: 1.2,
        }}>
          {brand.name.split(" ").map((w, i) => <div key={i}>{w}</div>)}
        </div>
        <div style={{ width: 28, height: 1, background: `${brand.colorTop}66`, margin: "3px 0" }} />
        <div style={{ fontFamily: "monospace", fontSize: 8, color: `${brand.colorBottom}99`, letterSpacing: "0.16em", textAlign: "center" }}>
          {brand.sub}
        </div>
        <div style={{
          marginTop: 4, padding: "2px 10px", borderRadius: 99,
          border: `1px solid ${brand.colorTop}44`,
          fontFamily: "monospace", fontSize: 7,
          color: brand.colorTop, letterSpacing: "0.1em",
        }}>
          {brand.roast}
        </div>
      </div>

      {/* Вес */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: 30, zIndex: 2,
        fontFamily: "monospace", fontSize: 9, color: `${brand.colorBottom}55`, letterSpacing: "0.25em" }}>
        250г
      </div>

      {/* Свечение под пачкой */}
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-6 rounded-full blur-2xl transition-all duration-1000"
        style={{ background: brand.colorTop, opacity: 0.35 }}
      />
    </div>
  </div>
);

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

  const brand = COFFEE_BRANDS[current];

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
              до пачки.
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

            {/* Badge — партия */}
            <div className="absolute left-0 top-8 glass rounded-2xl px-4 py-3 shadow-lg z-20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold">Партия готова</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">ЗАКАЗ #2847 · 200 кг</p>
            </div>

            {/* Badge — рост */}
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
                50%     { transform: translateY(-16px) rotate(0.4deg); }
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
              <div className={`bag-float ${paused ? "paused" : ""} relative`} style={{ width: 260, height: 360 }}>
                {COFFEE_BRANDS.map((b, i) => (
                  <CoffeeBag key={b.name} brand={b} active={i === current} />
                ))}

                {/* Hover CTA */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 z-10 ${paused ? "opacity-100" : "opacity-0"}`}>
                  <div className="bg-black/55 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center gap-2 text-white text-sm font-medium shadow-xl">
                    <Icon name="Sparkles" size={15} />
                    Собрать свою пачку
                  </div>
                </div>
              </div>

              {/* Точки-индикаторы */}
              <div className="flex gap-2 mt-2">
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

              {/* Название бренда */}
              <div className="relative mt-3 text-center" style={{ height: 34 }}>
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