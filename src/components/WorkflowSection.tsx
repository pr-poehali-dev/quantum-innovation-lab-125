import { useState } from "react";
import Icon from "@/components/ui/icon";

// Все визуалы рендерятся как компоненты, не JSX в данных — чтобы избежать проблем
const STEPS = [
  {
    number: "01",
    icon: "Calculator",
    title: "Заполняете калькулятор",
    sub: "Выбираете зерно, обжарку, упаковку, объём",
    desc: "Онлайн-конфигуратор за 3 минуты собирает ваш заказ. Никаких звонков — сразу видите стоимость.",
    badge: null as string | null,
  },
  {
    number: "02",
    icon: "Bot",
    title: "AI-ассистент уточняет детали",
    sub: "Диалог вместо длинной анкеты",
    desc: "После отправки — ИИ-ассистент напишет сам, уточнит нюансы и передаст готовый бриф менеджеру.",
    badge: "AI" as string | null,
  },
  {
    number: "03",
    icon: "Mail",
    title: "Получаете счёт на email",
    sub: "В течение 30 минут в рабочее время",
    desc: "Менеджер формирует финальное коммерческое предложение и высылает счёт. Вы подтверждаете — старт.",
    badge: null as string | null,
  },
  {
    number: "04",
    icon: "Package",
    title: "Образцы / запуск партии",
    sub: "Пробная партия или сразу в производство",
    desc: "Отправляем образцы на дегустацию или запускаем партию. Трек-номер появится в личном кабинете.",
    badge: null as string | null,
  },
];

const StepVisual = ({ index }: { index: number }) => {
  if (index === 0) return (
    <div className="flex flex-col gap-2 w-full">
      {["Зерно: Арабика Перу", "Обжарка: Средняя", "Упаковка: Дой-пак"].map((line, i) => (
        <div key={i} className="flex items-center gap-2 bg-white border border-black/8 rounded-lg px-3 py-2 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0" />
          <span className="text-[11px] font-mono text-black/60">{line}</span>
        </div>
      ))}
      <div className="flex items-center justify-between mt-1 px-1">
        <span className="text-[10px] font-mono text-black/40">ИТОГО / кг</span>
        <span className="text-sm font-bold text-foreground">520 ₽</span>
      </div>
    </div>
  );

  if (index === 1) return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon name="Bot" size={11} className="text-foreground" />
        </div>
        <div className="bg-white border border-black/8 rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] text-black/60 leading-relaxed shadow-sm">
          Ваш заказ получен! Уточните — зерно в зерне или молотый?
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <div className="bg-foreground rounded-2xl rounded-tr-sm px-3 py-2 text-[11px] text-white leading-relaxed">
          В зерне, 250г пакеты
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon name="Bot" size={11} className="text-foreground" />
        </div>
        <div className="bg-white border border-black/8 rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] text-black/60 shadow-sm">
          Отлично, передаю бриф ✓
        </div>
      </div>
    </div>
  );

  if (index === 2) return (
    <div className="w-full bg-white border border-black/8 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-black/4 px-3 py-2 flex items-center gap-2 border-b border-black/6">
        <div className="w-4 h-4 rounded bg-black/10 flex items-center justify-center">
          <Icon name="Mail" size={10} className="text-foreground" />
        </div>
        <span className="text-[10px] font-mono text-black/50">КонтрактКофе · счёт</span>
      </div>
      <div className="p-3 space-y-1">
        <p className="text-[10px] font-mono text-black/40">АРАБИКА ПЕРУ · 100 КГ</p>
        <p className="text-[10px] font-mono text-black/40">ДОЙ-ПАК 250Г · ДИЗАЙН</p>
        <div className="pt-2 border-t border-black/6 flex justify-between items-center">
          <span className="text-[10px] font-mono text-black/40">ИТОГО</span>
          <span className="text-base font-bold text-foreground">52 000 ₽</span>
        </div>
      </div>
    </div>
  );

  // index === 3
  return (
    <div className="flex flex-col gap-2 w-full">
      {[
        { label: "Образцы отправлены",  done: true,  date: "День 3"  },
        { label: "Одобрение рецептуры", done: true,  date: "День 5"  },
        { label: "Запуск производства", done: false, date: "День 7"  },
        { label: "Отгрузка",            done: false, date: "День 14" },
      ].map((item) => (
        <div key={item.label} className="flex items-center gap-2.5">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
            item.done ? "bg-green-500/15 text-green-700" : "border border-black/15 bg-transparent"
          }`}>
            {item.done && <Icon name="Check" size={9} />}
          </div>
          <span className={`text-[11px] flex-1 ${item.done ? "text-foreground font-medium" : "text-black/40"}`}>
            {item.label}
          </span>
          <span className="text-[10px] font-mono text-black/30">{item.date}</span>
        </div>
      ))}
    </div>
  );
};

const WorkflowSection = () => {
  const [openStep, setOpenStep] = useState<number | null>(null);

  return (
    <section id="workflow" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        {/* Заголовок */}
        <div className="flex flex-col md:flex-row items-start justify-between mb-14 scroll-reveal">
          <div>
            <span className="text-[11px] font-mono text-black/40 tracking-widest">КАК ЭТО РАБОТАЕТ · КОФЕ ПОД СТМ</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3 font-bold leading-tight text-foreground">
              4 шага от заявки<br />до вашей пачки
            </h2>
          </div>
          <p className="text-sm text-black/50 max-w-xs hidden md:block mt-2 leading-relaxed">
            Прозрачный процесс без неожиданностей. Вы видите статус на каждом этапе.
          </p>
        </div>

        {/* Шаги с фиксированной высотой визуала */}
        <div className="relative">
          {/* Соединительная линия (desktop) */}
          <div className="hidden md:block absolute top-[72px] left-[12.5%] right-[12.5%] h-px bg-black/10 z-0" />

          <div className="grid md:grid-cols-4 gap-5 relative z-10">
            {STEPS.map((step, index) => (
              <div key={step.number} className="flex flex-col scroll-reveal" data-delay={String(index * 80)}>

                {/* Номер — строго по верхнему краю */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-foreground text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-[11px] font-mono font-bold">{step.number}</span>
                    </div>
                    {/* Стрелка вправо */}
                    {index < STEPS.length - 1 && (
                      <div className="hidden md:flex absolute items-center"
                        style={{ left: `calc(${(index + 1) * 25}% - 12px)`, top: "28px" }}>
                        <Icon name="ChevronRight" size={16} className="text-black/20" />
                      </div>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center">
                    <Icon name={step.icon} fallback="Circle" size={15} className="text-foreground" />
                  </div>
                  {step.badge && (
                    <span className="text-[9px] font-mono font-bold bg-black/8 text-foreground border border-black/10 rounded-full px-2 py-0.5">
                      {step.badge}
                    </span>
                  )}
                </div>

                {/* Визуал — фиксированная высота 140px */}
                <div className="bg-black/3 border border-black/6 rounded-2xl p-4 mb-4 flex items-center"
                  style={{ minHeight: 140 }}>
                  <StepVisual index={index} />
                </div>

                {/* Текст */}
                <h3 className="font-semibold text-[15px] leading-snug text-foreground mb-1">{step.title}</h3>
                <p className="text-[11px] font-mono text-black/40 mb-2">{step.sub}</p>

                {/* Раскрытие */}
                <button
                  onClick={() => setOpenStep(openStep === index ? null : index)}
                  className="flex items-center gap-1 text-[11px] text-black/40 hover:text-black/70 transition-colors mt-auto">
                  <Icon name={openStep === index ? "ChevronUp" : "ChevronDown"} size={11} />
                  {openStep === index ? "Скрыть" : "Подробнее"}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openStep === index ? "max-h-24 opacity-100 mt-2" : "max-h-0 opacity-0"}`}>
                  <p className="text-xs text-black/50 leading-relaxed border-t border-black/6 pt-2">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="#calculator"
            className="inline-flex items-center gap-2 bg-foreground text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-black/80 transition-all active:scale-95">
            <Icon name="Calculator" size={14} /> Открыть калькулятор
          </a>
          <a href="https://t.me/kontraktkafe" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-black/15 text-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-black/4 transition-all">
            <Icon name="Send" size={14} /> Написать в Telegram
          </a>
        </div>

      </div>
    </section>
  );
};

export default WorkflowSection;
