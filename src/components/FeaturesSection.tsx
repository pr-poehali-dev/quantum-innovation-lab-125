import Icon from "@/components/ui/icon";

const ADVANTAGES = [
  {
    icon: "Package",
    title: "Любые объёмы",
    desc: "От пробной партии 50 кг до крупного опта — растёте вместе с нами без ограничений.",
  },
  {
    icon: "Sliders",
    title: "Свободный выбор",
    desc: "Зелёное зерно, степень обжарки, тип упаковки, дизайн — всё под ваш бренд и сегмент.",
  },
  {
    icon: "Truck",
    title: "Быстрая логистика",
    desc: "Отгрузка по всей России. Первая партия — от 14 дней. Повторные заказы — быстрее.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-secondary/40">
      <div className="max-w-7xl mx-auto px-6">

        {/* Заголовок */}
        <div className="flex flex-col md:flex-row items-start justify-between mb-16 scroll-reveal">
          <div>
            <span className="text-xs font-mono text-primary tracking-wider">О ПРОИЗВОДСТВЕ</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3 font-bold max-w-lg leading-tight">
              Почему бизнес выбирает<br />
              <span className="text-primary">КонтрактКофе</span>
            </h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs hidden md:block mt-2 leading-relaxed">
            Технологичное производство полного цикла — от подбора зерна до доставки готовой продукции.
          </p>
        </div>

        {/* B2B Преимущества — 3 карточки */}
        <div className="grid md:grid-cols-3 gap-5 mb-6">
          {ADVANTAGES.map((adv, i) => (
            <div key={adv.title}
              className="bg-card border border-border rounded-2xl p-6 card-hover scroll-reveal flex flex-col gap-4"
              data-delay={String(i * 100)}>
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Icon name={adv.icon} fallback="Circle" size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1.5">{adv.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{adv.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Нижний ряд */}
        <div className="grid md:grid-cols-3 gap-5">

          {/* Обжарка */}
          <div className="bg-card border border-border rounded-2xl p-6 card-hover scroll-reveal" data-delay="0">
            <div className="flex items-start justify-between mb-5">
              <span className="text-[10px] font-mono text-muted-foreground">ОБЖАРКА</span>
              <span className="text-[10px] font-mono text-primary">3 СТЕПЕНИ</span>
            </div>
            <div className="bg-secondary/60 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-3">
                {[
                  { color: "#f5c27a", label: "LIGHT"  },
                  { color: "#c07830", label: "MEDIUM" },
                  { color: "#3d1a08", label: "DARK"   },
                ].map(r => (
                  <div key={r.label} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full border-2 border-border/40 shadow-inner"
                      style={{ background: r.color }} />
                    <span className="text-[9px] font-mono text-muted-foreground">{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="font-semibold text-base mb-1">Точная обжарка</h3>
            <p className="text-sm text-muted-foreground">Светлая — для specialty. Тёмная — для вендинга и эспрессо.</p>
          </div>

          {/* Сегменты */}
          <div className="bg-card border border-border rounded-2xl p-6 card-hover scroll-reveal" data-delay="100">
            <div className="flex items-start justify-between mb-5">
              <span className="text-[10px] font-mono text-muted-foreground">СЕГМЕНТЫ</span>
              <span className="text-[10px] font-mono text-primary">B2B</span>
            </div>
            <div className="bg-secondary/60 rounded-xl p-3 mb-5">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: "Кофейни",   icon: "Coffee"          },
                  { name: "Рестораны", icon: "UtensilsCrossed" },
                  { name: "Отели",     icon: "Hotel"           },
                  { name: "Вендинг",   icon: "Cpu"             },
                  { name: "Офисы",     icon: "Building2"       },
                  { name: "Ретейл",    icon: "ShoppingBag"     },
                ].map((item) => (
                  <div key={item.name} className="text-center p-2 rounded-lg bg-card border border-border">
                    <div className="w-6 h-6 mx-auto mb-1 rounded bg-secondary flex items-center justify-center">
                      <Icon name={item.icon} fallback="Circle" size={12} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="font-semibold text-base mb-1">Для любого бизнеса</h3>
            <p className="text-sm text-muted-foreground">HoReCa, вендинг, ретейл и корпоративные офисы.</p>
          </div>

          {/* Полный цикл */}
          <div className="bg-foreground text-white border border-foreground rounded-2xl p-6 card-hover scroll-reveal" data-delay="200">
            <div className="flex items-start justify-between mb-5">
              <span className="text-[10px] font-mono text-white/40">ПРОЦЕСС</span>
              <span className="text-[10px] font-mono text-primary">ПОЛНЫЙ_ЦИКЛ</span>
            </div>
            <div className="space-y-2.5 mb-5">
              {[
                { step: "01", label: "Подбор зерна",  icon: "Leaf"     },
                { step: "02", label: "Обжарка",        icon: "Flame"    },
                { step: "03", label: "Упаковка",       icon: "Package"  },
                { step: "04", label: "Доставка",       icon: "Truck"    },
              ].map((s, i, arr) => (
                <div key={s.step} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={s.icon} fallback="Circle" size={12} className="text-primary" />
                  </div>
                  <span className="text-sm text-white/80">{s.label}</span>
                  {i < arr.length - 1 && (
                    <div className="ml-auto w-4 h-px bg-white/15" />
                  )}
                </div>
              ))}
            </div>
            <h3 className="font-semibold text-base mb-1">Под ключ</h3>
            <p className="text-sm text-white/50">Вы только продаёте. Всё остальное — на нас.</p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;
