import { useState } from "react";
import Icon from "@/components/ui/icon";

// ── Визуальные вставки для каждого шага ─────────────────────

const Visual0 = () => (
  <div className="flex flex-col gap-2 w-full">
    {["Зерно: Арабика Перу", "Обжарка: Средняя", "Упаковка: Дой-пак"].map((line, i) => (
      <div key={i} className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
        <span className="text-[11px] font-mono text-muted-foreground">{line}</span>
      </div>
    ))}
    <div className="flex items-center justify-between px-1 pt-1">
      <span className="text-[10px] font-mono text-muted-foreground">ИТОГО / кг</span>
      <span className="text-sm font-bold text-primary">520 ₽</span>
    </div>
  </div>
);

const Visual1 = () => (
  <div className="flex flex-col gap-2 w-full">
    <div className="flex gap-2">
      <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon name="Bot" size={11} className="text-primary" />
      </div>
      <div className="bg-secondary border border-border rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] text-muted-foreground leading-snug">
        Ваш заказ получен! Уточните — зерно в зерне или молотый?
      </div>
    </div>
    <div className="flex justify-end">
      <div className="bg-primary rounded-2xl rounded-tr-sm px-3 py-2 text-[11px] text-white leading-snug max-w-[75%]">
        В зерне, 250г пакеты
      </div>
    </div>
    <div className="flex gap-2">
      <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon name="Bot" size={11} className="text-primary" />
      </div>
      <div className="bg-secondary border border-border rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] text-muted-foreground">
        Отлично, передаю бриф ✓
      </div>
    </div>
  </div>
);

const Visual2 = () => (
  <div className="w-full bg-card border border-border rounded-xl overflow-hidden">
    <div className="bg-secondary px-3 py-2 flex items-center gap-2 border-b border-border">
      <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center">
        <Icon name="Mail" size={10} className="text-primary" />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground">КонтрактКофе · счёт</span>
    </div>
    <div className="p-3 space-y-1">
      <p className="text-[10px] font-mono text-muted-foreground">АРАБИКА ПЕРУ · 100 КГ</p>
      <p className="text-[10px] font-mono text-muted-foreground">ДОЙ-ПАК 250Г · ДИЗАЙН</p>
      <div className="pt-2 border-t border-border flex justify-between items-center">
        <span className="text-[10px] font-mono text-muted-foreground">ИТОГО</span>
        <span className="text-base font-bold text-foreground">52 000 ₽</span>
      </div>
    </div>
  </div>
);

const Visual3 = () => (
  <div className="flex flex-col gap-2.5 w-full">
    {[
      { label: "Образцы отправлены",  done: true,  date: "День 3"  },
      { label: "Одобрение рецептуры", done: true,  date: "День 5"  },
      { label: "Запуск производства", done: false, date: "День 7"  },
      { label: "Отгрузка",            done: false, date: "День 14" },
    ].map((item) => (
      <div key={item.label} className="flex items-center gap-2.5">
        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
          item.done
            ? "bg-green-100 text-green-600"
            : "border border-border bg-card"
        }`}>
          {item.done && <Icon name="Check" size={9} />}
        </div>
        <span className={`text-[11px] flex-1 ${item.done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
          {item.label}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">{item.date}</span>
      </div>
    ))}
  </div>
);

const VISUALS = [<Visual0 />, <Visual1 />, <Visual2 />, <Visual3 />];

// ── Данные шагов ─────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    icon: "Calculator" as const,
    title: "Заполняете калькулятор",
    sub: "Выбираете зерно, обжарку, упаковку, объём",
    desc: "Онлайн-конфигуратор за 3 минуты собирает ваш заказ. Никаких звонков — сразу видите стоимость.",
    badge: null as string | null,
  },
  {
    number: "02",
    icon: "Bot" as const,
    title: "AI-ассистент уточняет",
    sub: "Диалог вместо длинной анкеты",
    desc: "После отправки — ИИ-ассистент напишет сам, уточнит нюансы и передаст готовый бриф менеджеру.",
    badge: "AI" as string | null,
  },
  {
    number: "03",
    icon: "Mail" as const,
    title: "Получаете счёт на email",
    sub: "В течение 30 минут в рабочее время",
    desc: "Менеджер формирует финальное КП и высылает счёт. Вы подтверждаете — мы стартуем.",
    badge: null as string | null,
  },
  {
    number: "04",
    icon: "Package" as const,
    title: "Образцы / запуск партии",
    sub: "Проба или сразу в производство",
    desc: "Отправляем образцы на дегустацию или запускаем партию. Трек-номер появится в личном кабинете.",
    badge: null as string | null,
  },
];

// ── Компонент ─────────────────────────────────────────────────

const WorkflowSection = () => {
  const [openStep, setOpenStep] = useState<number | null>(null);

  return (
    <section id="workflow" className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-6">

        {/* Заголовок */}
        <div className="flex flex-col md:flex-row items-start justify-between mb-14 scroll-reveal">
          <div>
            <span className="text-[11px] font-mono text-primary tracking-widest">КАК ЭТО РАБОТАЕТ · КОФЕ ПОД СТМ</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3 font-bold leading-tight">
              4 шага от заявки<br />до вашей пачки
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs hidden md:block mt-2 leading-relaxed">
            Прозрачный процесс без неожиданностей. Вы видите статус на каждом этапе.
          </p>
        </div>

        {/* Шаги */}
        <div className="grid md:grid-cols-4 gap-5">
          {STEPS.map((step, index) => (
            <div key={step.number} className="flex flex-col scroll-reveal" data-delay={String(index * 80)}>

              {/* Шапка карточки: номер + стрелка + иконка */}
              <div className="flex items-center gap-2 mb-4">
                {/* Номер */}
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-[11px] font-mono font-bold shadow-sm shadow-primary/20">
                  {step.number}
                </div>

                {/* Стрелка между шагами */}
                {index < STEPS.length - 1 && (
                  <div className="flex-1 flex items-center gap-1">
                    <div className="flex-1 h-px bg-border" />
                    <Icon name="ChevronRight" size={14} className="text-muted-foreground flex-shrink-0" />
                  </div>
                )}

                {/* Иконка шага (только у последнего, где нет стрелки) */}
                {index === STEPS.length - 1 && (
                  <div className="ml-auto w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center">
                    <Icon name={step.icon} fallback="Circle" size={15} className="text-primary" />
                  </div>
                )}
              </div>

              {/* Карточка */}
              <div className="bg-background border border-border rounded-2xl overflow-hidden flex flex-col flex-1 shadow-sm">
                {/* Визуал — фиксированная высота */}
                <div className="p-4 border-b border-border" style={{ minHeight: 148 }}>
                  <div className="h-full flex items-start">
                    {VISUALS[index]}
                  </div>
                </div>

                {/* Текстовая часть */}
                <div className="p-4 flex flex-col flex-1">
                  {/* Заголовок — фиксированная высота на 2 строки */}
                  <div className="flex items-start justify-between gap-2 mb-1" style={{ minHeight: 40 }}>
                    <h3 className="font-semibold text-[14px] leading-snug">{step.title}</h3>
                    {step.badge && (
                      <span className="text-[9px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 flex-shrink-0">
                        {step.badge}
                      </span>
                    )}
                  </div>
                  {/* Подзаголовок — фиксированная высота */}
                  <p className="text-[11px] text-muted-foreground font-mono" style={{ minHeight: 32 }}>{step.sub}</p>

                  {/* Раскрытие — прижато к низу */}
                  <button
                    onClick={() => setOpenStep(openStep === index ? null : index)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors mt-auto pt-3">
                    <Icon name={openStep === index ? "ChevronUp" : "ChevronDown"} size={11} />
                    {openStep === index ? "Скрыть" : "Подробнее"}
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${openStep === index ? "max-h-20 opacity-100 mt-2" : "max-h-0 opacity-0"}`}>
                    <p className="text-[12px] text-muted-foreground leading-relaxed border-t border-border pt-2">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="#calculator"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95">
            <Icon name="Calculator" size={14} /> Открыть калькулятор
          </a>
          <a href="https://t.me/kontraktkafe" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-full text-sm font-medium hover:bg-secondary hover:border-primary/30 transition-all">
            <Icon name="Send" size={14} /> Написать в Telegram
          </a>
        </div>

      </div>
    </section>
  );
};

export default WorkflowSection;