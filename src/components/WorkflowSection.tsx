import { useState } from "react";
import Icon from "@/components/ui/icon";

const STEPS = [
  {
    number: "01",
    icon: "Calculator",
    title: "Заполняете калькулятор",
    sub: "Выбираете зерно, обжарку, упаковку, объём",
    desc: "Онлайн-конфигуратор за 3 минуты собирает ваш заказ. Никаких звонков — сразу видите стоимость.",
    badge: null,
    color: "bg-primary/10 border-primary/20 text-primary",
    visual: (
      <div className="flex flex-col gap-2 w-full">
        {["Зерно: Арабика Перу", "Обжарка: Средняя", "Упаковка: Дой-пак"].map((line, i) => (
          <div key={i} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            <span className="text-[11px] font-mono text-muted-foreground">{line}</span>
          </div>
        ))}
        <div className="flex items-center justify-between mt-1 px-1">
          <span className="text-[10px] font-mono text-muted-foreground">ИТОГО / кг</span>
          <span className="text-sm font-bold text-primary">520 ₽</span>
        </div>
      </div>
    ),
  },
  {
    number: "02",
    icon: "Bot",
    title: "AI-ассистент уточняет детали",
    sub: "Диалог вместо длинной анкеты",
    desc: "После отправки калькулятора — ИИ-ассистент сам напишет, уточнит нюансы и передаст бриф менеджеру.",
    badge: "AI",
    color: "bg-violet-500/10 border-violet-500/20 text-violet-600",
    visual: (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon name="Bot" size={12} className="text-primary" />
          </div>
          <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] text-muted-foreground leading-relaxed max-w-[180px]">
            Ваш заказ получен! Уточните — зерно в зерне или молотый?
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <div className="bg-primary rounded-2xl rounded-tr-sm px-3 py-2 text-[11px] text-white leading-relaxed max-w-[160px]">
            В зерне, 250г пакеты
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon name="Bot" size={12} className="text-primary" />
          </div>
          <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] text-muted-foreground">
            Отлично, передаю бриф ✓
          </div>
        </div>
      </div>
    ),
  },
  {
    number: "03",
    icon: "Mail",
    title: "Получаете счёт на email",
    sub: "В течение 30 минут в рабочее время",
    desc: "Менеджер формирует финальное коммерческое предложение и высылает счёт. Вы подтверждаете — и мы стартуем.",
    badge: null,
    color: "bg-green-500/10 border-green-500/20 text-green-600",
    visual: (
      <div className="w-full bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-secondary/60 px-3 py-2 flex items-center gap-2 border-b border-border">
          <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center">
            <Icon name="Mail" size={10} className="text-primary" />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">КонтрактКофе · счёт</span>
        </div>
        <div className="p-3 space-y-1.5">
          <p className="text-[10px] font-mono text-muted-foreground">АРАБИКА ПЕРУ · 100 КГ</p>
          <p className="text-[10px] font-mono text-muted-foreground">ДОЙ-ПАК 250Г · ДИЗАЙН</p>
          <div className="pt-2 border-t border-border flex justify-between items-center">
            <span className="text-[10px] font-mono text-muted-foreground">ИТОГО</span>
            <span className="text-sm font-bold text-foreground">52 000 ₽</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    number: "04",
    icon: "Package",
    title: "Образцы / запуск партии",
    sub: "Пробная партия или сразу в производство",
    desc: "Отправляем образцы на дегустацию или сразу запускаем партию. Трек-номер — в личный кабинет.",
    badge: null,
    color: "bg-amber-500/10 border-amber-500/20 text-amber-600",
    visual: (
      <div className="flex flex-col gap-2 w-full">
        {[
          { label: "Образцы отправлены",   done: true,  date: "День 3"  },
          { label: "Одобрение рецептуры",  done: true,  date: "День 5"  },
          { label: "Запуск производства",  done: false, date: "День 7"  },
          { label: "Отгрузка",             done: false, date: "День 14" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
              item.done ? "bg-green-500/20 text-green-600" : "bg-secondary border border-border"
            }`}>
              {item.done && <Icon name="Check" size={9} />}
            </div>
            <span className={`text-[11px] flex-1 ${item.done ? "text-foreground" : "text-muted-foreground"}`}>
              {item.label}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">{item.date}</span>
          </div>
        ))}
      </div>
    ),
  },
];

const WorkflowSection = () => {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section id="workflow" className="py-24">
      <div className="max-w-7xl mx-auto px-6">

        {/* Заголовок */}
        <div className="flex flex-col md:flex-row items-start justify-between mb-16 scroll-reveal">
          <div>
            <span className="text-xs font-mono text-primary tracking-wider">КАК ЭТО РАБОТАЕТ</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3 font-bold max-w-md leading-tight">
              Кофе под СТМ —<br />
              <span className="text-primary">4 шага.</span>
            </h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs hidden md:block mt-2 leading-relaxed">
            От калькулятора до готовой партии с вашим логотипом — прозрачно и быстро.
          </p>
        </div>

        {/* Шаги */}
        <div className="grid md:grid-cols-4 gap-5">
          {STEPS.map((step, index) => (
            <div key={step.number}
              className="relative scroll-reveal"
              data-delay={String(index * 80)}>
              <div
                className={`bg-card border border-border rounded-2xl p-5 h-full flex flex-col cursor-pointer transition-all duration-300 ${
                  active === index ? "border-primary/40 shadow-lg shadow-primary/8 -translate-y-1" : "hover:border-border hover:shadow-md"
                }`}
                onClick={() => setActive(active === index ? null : index)}
              >
                {/* Номер + иконка */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${step.color}`}>
                    {step.number}
                  </span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${step.color}`}>
                    <Icon name={step.icon} fallback="Circle" size={15} />
                  </div>
                  {step.badge && (
                    <span className="text-[9px] font-mono font-bold bg-violet-500/15 text-violet-600 border border-violet-500/25 rounded-full px-2 py-0.5">
                      {step.badge}
                    </span>
                  )}
                </div>

                {/* Визуал */}
                <div className="bg-secondary/40 rounded-xl p-3 mb-4 min-h-[110px] flex items-center">
                  {step.visual}
                </div>

                {/* Текст */}
                <h3 className="font-semibold text-sm mb-0.5 leading-tight">{step.title}</h3>
                <p className="text-[11px] font-mono text-muted-foreground mb-2">{step.sub}</p>

                {/* Раскрытое описание */}
                <div className={`overflow-hidden transition-all duration-300 ${active === index ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border">
                    {step.desc}
                  </p>
                </div>

                {/* Подсказка раскрыть */}
                <div className="mt-auto pt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Icon name={active === index ? "ChevronUp" : "ChevronDown"} size={11} />
                  {active === index ? "Скрыть" : "Подробнее"}
                </div>
              </div>

              {/* Стрелка между шагами */}
              {index < STEPS.length - 1 && (
                <div className="hidden md:flex absolute top-1/3 -right-3 z-10 items-center justify-center w-6 h-6">
                  <Icon name="ChevronRight" size={16} className="text-border" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA под шагами */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#calculator"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-95">
            <Icon name="Calculator" size={15} /> Открыть калькулятор
          </a>
          <a href="https://t.me/kontraktkafe" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-full text-sm font-medium hover:bg-secondary hover:border-primary/30 transition-all">
            <Icon name="Send" size={15} /> Написать в Telegram
          </a>
        </div>

      </div>
    </section>
  );
};

export default WorkflowSection;
