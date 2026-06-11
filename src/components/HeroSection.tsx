import Icon from "@/components/ui/icon";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground border border-border rounded-full px-3 py-1">
              <span>ПОЛНЫЙ ЦИКЛ ПРОИЗВОДСТВА СТМ</span>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.1] text-balance">
              Ваш бренд
              <br />
              кофе — от зерна
              <br />
              до полки.
            </h1>

            <p className="text-muted-foreground text-lg max-w-md">
              Обжарка, упаковка и логистика под вашей торговой маркой. Для кофеен, ресторанов, отелей и вендинга.
            </p>

            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
                Рассчитать стоимость
                <Icon name="ArrowRight" size={16} />
              </button>
              <button className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-full text-sm font-medium hover:bg-secondary transition-colors">
                Смотреть образцы
              </button>
            </div>

            <div className="flex gap-8 pt-2">
              <div>
                <p className="font-serif text-2xl">500+</p>
                <p className="text-xs font-mono text-muted-foreground">КЛИЕНТОВ</p>
              </div>
              <div>
                <p className="font-serif text-2xl">14 дней</p>
                <p className="text-xs font-mono text-muted-foreground">ДО ПЕРВОЙ ПАРТИИ</p>
              </div>
              <div>
                <p className="font-serif text-2xl">от 50 кг</p>
                <p className="text-xs font-mono text-muted-foreground">МИНИМАЛЬНЫЙ ЗАКАЗ</p>
              </div>
            </div>
          </div>

          {/* Right visual */}
          <div className="relative">
            <div className="relative bg-secondary/50 rounded-3xl p-8 border border-border/50">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-4">
                <span>№01 — ПРОИЗВОДСТВО_СТМ</span>
                <span>ПОЛНЫЙ_ЦИКЛ</span>
              </div>

              {/* Sticky note */}
              <div className="absolute -left-4 top-20 bg-[#fffef0] p-3 rounded shadow-sm rotate-[-3deg] border border-amber-100 w-40">
                <p className="text-xs font-mono text-foreground/80">ЗАЯВКА</p>
                <p className="text-sm font-serif italic mt-1">«Нужен эспрессо под наш бренд»</p>
              </div>

              {/* Coffee bag mockup */}
              <div className="bg-[#2d1a0e] rounded-2xl p-6 my-6 mx-auto max-w-sm">
                <div className="flex justify-between text-[8px] text-white/70 font-mono mb-4 px-2">
                  <span>УПАКОВКА_СТМ</span>
                  <span>ОБРАЗЕЦ</span>
                </div>
                <div className="bg-[#3d2a1e] rounded-xl p-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#5d3a2e] flex items-center justify-center mx-auto mb-3">
                    <Icon name="Coffee" size={28} className="text-amber-300" />
                  </div>
                  <p className="text-white font-serif text-lg">ВАШ БРЕНД</p>
                  <p className="text-white/50 text-[10px] font-mono mt-1">SPECIALTY COFFEE · BRASIL</p>
                  <div className="flex justify-center gap-2 mt-3">
                    {["250г", "500г", "1кг"].map((w) => (
                      <div key={w} className="bg-[#2d1a0e] rounded-full px-2 py-0.5">
                        <span className="text-[9px] text-white/60 font-mono">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status bubbles */}
              <div className="absolute -right-2 top-32 space-y-2">
                <div className="bg-card border border-border rounded-xl p-3 shadow-sm max-w-[180px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-mono text-muted-foreground">СТАТУС</span>
                  </div>
                  <p className="text-xs font-medium">Партия обжарена</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 shadow-sm max-w-[200px]">
                  <p className="text-xs text-muted-foreground">
                    Упаковка с вашим логотипом готова к отгрузке...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
