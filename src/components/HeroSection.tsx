import Icon from "@/components/ui/icon";

const STEPS_PREVIEW = [
  { icon: "Target",   label: "Назначение" },
  { icon: "Leaf",     label: "Зерно"      },
  { icon: "Flame",    label: "Обжарка"    },
  { icon: "Package",  label: "Формат"     },
  { icon: "Box",      label: "Упаковка"   },
  { icon: "Palette",  label: "Дизайн"     },
  { icon: "BarChart2",label: "Объём"      },
];

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
                { val: "500+",    label: "КЛИЕНТОВ"        },
                { val: "14 дней", label: "ДО ПЕРВОЙ ПАРТИИ"},
                { val: "от 50 кг",label: "МИН. ЗАКАЗ"      },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-serif text-2xl font-semibold text-foreground">{s.val}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — калькулятор-превью */}
          <div className="relative scroll-reveal" data-delay="150">

            {/* Floating badges */}
            <div className="absolute -left-5 top-10 glass rounded-2xl px-4 py-3 shadow-lg z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold">Бриф готов</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">7 шагов · 3 мин</p>
            </div>

            <div className="absolute -right-4 bottom-14 glass rounded-2xl px-4 py-3 shadow-lg z-10">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="TrendingUp" size={14} className="text-primary" />
                <span className="text-xs font-semibold">Рост продаж</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">+38% после запуска бренда</p>
            </div>

            {/* Mockup калькулятора */}
            <a
              href="#calculator"
              className="block relative bg-card rounded-3xl border border-border shadow-xl overflow-hidden hover:shadow-2xl hover:border-primary/30 transition-all duration-300 group"
            >
              {/* Шапка мокапа */}
              <div className="bg-secondary/60 px-5 py-3 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-border" />
                    <div className="w-2.5 h-2.5 rounded-full bg-border" />
                    <div className="w-2.5 h-2.5 rounded-full bg-border" />
                  </div>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">ПРОИЗВОДСТВЕННЫЙ БРИФ</span>
                <span className="text-[10px] font-mono text-primary">1 / 7</span>
              </div>

              <div className="p-5">
                {/* Заголовок шага */}
                <p className="text-[10px] font-mono text-muted-foreground mb-0.5">ШАГ 01</p>
                <p className="text-sm font-semibold mb-4">Для чего нужен кофе?</p>

                {/* Варианты ответа */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {[
                    { icon: "Coffee",      label: "Эспрессо в кофейню", active: true  },
                    { icon: "Droplets",    label: "Фильтр",             active: false },
                    { icon: "Cpu",         label: "Вендинг",            active: false },
                    { icon: "ShoppingBag", label: "Розничная полка",    active: false },
                  ].map((o) => (
                    <div
                      key={o.label}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 ${
                        o.active
                          ? "border-primary bg-primary/5"
                          : "border-border bg-secondary/30"
                      }`}
                    >
                      <Icon name={o.icon} fallback="Circle" size={13}
                        className={o.active ? "text-primary" : "text-muted-foreground"} />
                      <span className={`text-[11px] font-medium ${o.active ? "text-primary" : "text-muted-foreground"}`}>
                        {o.label}
                      </span>
                      {o.active && (
                        <div className="ml-auto w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                          <Icon name="Check" size={8} className="text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Прогресс шагов */}
                <div className="flex gap-1 mb-4">
                  {STEPS_PREVIEW.map((s, i) => (
                    <div
                      key={s.label}
                      className={`flex-1 h-1 rounded-full ${i === 0 ? "bg-primary" : "bg-border"}`}
                    />
                  ))}
                </div>

                {/* Итог-строка */}
                <div className="flex items-center justify-between bg-primary/5 border border-primary/15 rounded-xl px-3 py-2.5">
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground">ИТОГО</p>
                    <p className="text-base font-serif font-bold text-primary">42 000 ₽</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-2 transition-all">
                    Заполнить бриф
                    <Icon name="ArrowRight" size={13} />
                  </div>
                </div>
              </div>
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
