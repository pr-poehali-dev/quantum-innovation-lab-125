import Icon from "@/components/ui/icon";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div className="space-y-7 scroll-reveal-left">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-primary border border-primary/20 bg-primary/5 rounded-full px-4 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              ПОЛНЫЙ ЦИКЛ ПРОИЗВОДСТВА СТМ
            </div>

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
                { val: "500+", label: "КЛИЕНТОВ" },
                { val: "14 дней", label: "ДО ПЕРВОЙ ПАРТИИ" },
                { val: "от 50 кг", label: "МИН. ЗАКАЗ" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-serif text-2xl font-semibold text-foreground">{s.val}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right visual */}
          <div className="relative scroll-reveal" data-delay="150">
            {/* Floating accent cards */}
            <div className="absolute -left-6 top-12 glass rounded-2xl px-4 py-3 shadow-lg z-10 border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-semibold">Партия готова к отгрузке</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">ЗАКАЗ #2847 · 200 кг</p>
            </div>

            <div className="absolute -right-4 bottom-16 glass rounded-2xl px-4 py-3 shadow-lg z-10 border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="TrendingUp" size={14} className="text-primary" />
                <span className="text-xs font-semibold">Рост продаж</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">+38% после запуска СТМ</p>
            </div>

            {/* Main mockup */}
            <div className="relative bg-gradient-to-br from-secondary/80 to-secondary/40 rounded-3xl p-8 border border-border/60 shadow-xl">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-5">
                <span>ПРОИЗВОДСТВО_СТМ</span>
                <span className="text-primary">ПОЛНЫЙ_ЦИКЛ</span>
              </div>

              {/* Coffee bag mockup */}
              <div className="bg-[#0f1e3d] rounded-2xl p-6 mx-auto max-w-xs shadow-2xl">
                <div className="flex justify-between text-[8px] text-white/50 font-mono mb-4">
                  <span>УПАКОВКА_СТМ</span>
                  <span>ОБРАЗЕЦ</span>
                </div>
                <div className="bg-[#1a2f5e] rounded-xl p-5 text-center border border-white/10">
                  <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-3">
                    <Icon name="Coffee" size={28} className="text-primary-foreground/80" />
                  </div>
                  <p className="text-white font-serif text-lg font-semibold">ВАШ БРЕНД</p>
                  <p className="text-white/40 text-[10px] font-mono mt-1 tracking-widest">SPECIALTY COFFEE · BRASIL</p>
                  <div className="flex justify-center gap-2 mt-4">
                    {["250г", "500г", "1кг"].map((w) => (
                      <div key={w} className="bg-white/10 rounded-full px-2.5 py-1">
                        <span className="text-[9px] text-white/60 font-mono">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between px-1">
                  <span className="text-[9px] text-white/30 font-mono">ОБЖАРКА: MEDIUM</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                  </div>
                </div>
              </div>

              {/* Progress steps */}
              <div className="mt-5 grid grid-cols-4 gap-2">
                {[
                  { label: "Зерно", done: true },
                  { label: "Обжарка", done: true },
                  { label: "Упаковка", done: true },
                  { label: "Доставка", done: false },
                ].map((step) => (
                  <div key={step.label} className="text-center">
                    <div
                      className={`h-1 rounded-full mb-1.5 ${step.done ? "bg-primary" : "bg-border"}`}
                    />
                    <span className={`text-[9px] font-mono ${step.done ? "text-primary" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
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
