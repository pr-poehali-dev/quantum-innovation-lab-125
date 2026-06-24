import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { COFFEE_BRANDS, CYCLE_MS } from "@/config/coffeeBrands";

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(
      () => setCurrent(c => (c + 1) % COFFEE_BRANDS.length),
      CYCLE_MS,
    );
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

            <style>{`
              @keyframes bagFloat {
                0%,100% { transform: translateY(0px) rotate(-0.4deg); }
                50%     { transform: translateY(-14px) rotate(0.4deg); }
              }
              .bag-float { animation: bagFloat 9s ease-in-out infinite; }
              .bag-float.paused { animation-play-state: paused; }
            `}</style>

            {/* Обёртка пачки + точки */}
            <div
              className="flex flex-col items-center"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {/* Пачка */}
              <div className={`bag-float ${paused ? "paused" : ""} relative`} style={{ width: 300, height: 390 }}>
                {COFFEE_BRANDS.map((b, i) => (
                  <div
                    key={b.id}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      opacity: i === current ? 1 : 0,
                      transition: "opacity 0.8s ease-in-out",
                      pointerEvents: "none",
                    }}
                  >
                    <img
                      src={b.image}
                      alt={`Вариант ${b.id}`}
                      draggable={false}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>

              {/* Точки-индикаторы */}
              <div className="flex gap-3 mt-4">
                {COFFEE_BRANDS.map((b, i) => (
                  <button
                    key={b.id}
                    onClick={() => { setCurrent(i); setPaused(true); setTimeout(() => setPaused(false), 5000); }}
                    className="rounded-full transition-all duration-300 focus:outline-none"
                    style={{
                      width:  i === current ? 24 : 8,
                      height: 8,
                      background: i === current ? b.accent : "#88888840",
                    }}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
