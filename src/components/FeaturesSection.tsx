import { useState } from "react";
import Icon from "@/components/ui/icon";

const ADVANTAGES = [
  {
    icon: "Layers",
    title: "Любые объёмы",
    short: "От 50 кг до крупного опта",
    detail: "Начните с пробной партии 50 кг — проверите спрос без риска. Масштабируйтесь по мере роста продаж без смены поставщика.",
    tag: "B2B",
  },
  {
    icon: "Sliders",
    title: "Свободный выбор",
    short: "Зерно, обжарка, упаковка, дизайн",
    detail: "Арабика или Робуста, 6 стран. Светлая, средняя или тёмная обжарка. Квадропак, дой-пак, крафт или флоу-пак. Готовый шаблон или индивидуальный дизайн.",
    tag: "CUSTOM",
  },
  {
    icon: "Zap",
    title: "Быстрый старт",
    short: "Первая партия за 14 дней",
    detail: "От подтверждения заявки до готовой продукции — 14 дней для партий до 200 кг. Повторные заказы — ещё быстрее.",
    tag: "FAST",
  },
  {
    icon: "Truck",
    title: "Логистика по России",
    short: "СДЭК, отслеживание в ЛК",
    detail: "Отгрузка по всей России. Трек-номер появляется в личном кабинете автоматически. Повторные партии — в 1 клик.",
    tag: "RU",
  },
  {
    icon: "ShieldCheck",
    title: "Контроль качества",
    short: "Каждая партия проверяется",
    detail: "Входной контроль зерна, сенсорная оценка после обжарки, контроль веса и герметичности при фасовке. Документы прилагаются.",
    tag: "QA",
  },
  {
    icon: "RefreshCw",
    title: "Полный цикл",
    short: "Зерно → обжарка → упаковка → доставка",
    detail: "Мы берём на себя всё: подбор зерна, разработку рецептуры, обжарку, упаковку, маркировку и доставку. Вы только продаёте.",
    tag: "FULL",
  },
];

const SEGMENTS = [
  { name: "Кофейни",   icon: "Coffee"         },
  { name: "Рестораны", icon: "UtensilsCrossed" },
  { name: "Отели",     icon: "Hotel"           },
  { name: "Вендинг",   icon: "Cpu"             },
  { name: "Офисы",     icon: "Building2"       },
  { name: "Ретейл",    icon: "ShoppingBag"     },
];

const FeaturesSection = () => {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section id="features" className="py-24 bg-black/[0.02]">
      <div className="max-w-7xl mx-auto px-6">

        {/* Заголовок */}
        <div className="flex flex-col md:flex-row items-start justify-between mb-14 scroll-reveal">
          <div>
            <span className="text-[11px] font-mono text-black/40 tracking-widest">О ПРОИЗВОДСТВЕ</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3 font-bold leading-tight text-foreground">
              Почему выбирают<br />КонтрактКофе
            </h2>
          </div>
          {/* Сегменты */}
          <div className="mt-6 md:mt-0">
            <p className="text-[11px] font-mono text-black/40 mb-3 tracking-wider">РАБОТАЕМ С</p>
            <div className="flex flex-wrap gap-2">
              {SEGMENTS.map(s => (
                <div key={s.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-black/8 rounded-full text-xs text-black/60 shadow-sm">
                  <Icon name={s.icon} fallback="Circle" size={12} className="text-black/40" />
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Преимущества — accordion-список */}
        <div className="grid md:grid-cols-2 gap-3 scroll-reveal" data-delay="100">
          {ADVANTAGES.map((adv, i) => {
            const isOpen = active === i;
            return (
              <button key={adv.title}
                onClick={() => setActive(isOpen ? null : i)}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 group ${
                  isOpen
                    ? "bg-foreground text-white border-foreground shadow-lg"
                    : "bg-white border-black/8 hover:border-black/20 hover:shadow-sm"
                }`}>
                <div className="flex items-start gap-4">
                  {/* Иконка */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isOpen ? "bg-white/15" : "bg-black/5 group-hover:bg-black/8"
                  }`}>
                    <Icon name={adv.icon} fallback="Circle" size={18}
                      className={isOpen ? "text-white" : "text-foreground"} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-semibold text-[15px] ${isOpen ? "text-white" : "text-foreground"}`}>
                        {adv.title}
                      </h3>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isOpen
                          ? "bg-white/15 text-white"
                          : "bg-black/5 text-black/40"
                      }`}>{adv.tag}</span>
                    </div>
                    <p className={`text-[13px] mt-0.5 ${isOpen ? "text-white/70" : "text-black/50"}`}>
                      {adv.short}
                    </p>

                    {/* Раскрытое описание */}
                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-24 mt-3 opacity-100" : "max-h-0 opacity-0"}`}>
                      <p className="text-[13px] text-white/60 leading-relaxed">
                        {adv.detail}
                      </p>
                    </div>
                  </div>

                  <Icon
                    name={isOpen ? "ChevronUp" : "ChevronDown"}
                    size={16}
                    className={`flex-shrink-0 mt-1 transition-colors ${isOpen ? "text-white/60" : "text-black/30"}`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Нижняя плашка */}
        <div className="mt-8 grid md:grid-cols-3 gap-4 scroll-reveal" data-delay="200">
          {[
            { val: "500+",  label: "брендов создано",     icon: "Award"   },
            { val: "14 дн", label: "до первой партии",    icon: "Clock"   },
            { val: "50 кг", label: "минимальный заказ",   icon: "Package" },
          ].map(stat => (
            <div key={stat.val}
              className="flex items-center gap-4 bg-white border border-black/8 rounded-2xl px-5 py-4 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center flex-shrink-0">
                <Icon name={stat.icon} fallback="Circle" size={16} className="text-foreground" />
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-foreground">{stat.val}</p>
                <p className="text-[11px] text-black/50 font-mono mt-0.5">{stat.label.toUpperCase()}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;
