import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useLeadModal } from "@/context/LeadModalContext";

// ── AI-подсказки для каждого шага ─────────────────────────────

const AI_HINTS: Record<number, { q: string; a: string }[]> = {
  0: [
    { q: "Что выбрать для кофейни?",          a: "Арабика Перу или Бразилия — классический нейтральный профиль, подходит под эспрессо и капучино. Для specialty берите Эфиопию." },
    { q: "Чем Арабика отличается от Робусты?", a: "Арабика — мягче, ароматнее, меньше кофеина. Робуста — крепче, горче, больше крема в эспрессо, дешевле. Вендинг часто работает на Робусте." },
    { q: "Что выбрать для первого заказа?",    a: "Арабика Перу — оптимальный старт: базовая цена, мягкий вкус, нравится большинству гостей." },
  ],
  1: [
    { q: "Какую обжарку взять для кофейни?",  a: "Средняя — универсальный выбор: подходит и для эспрессо, и для фильтра. Светлая — для specialty с кислотностью. Тёмная — для вендинга." },
    { q: "Влияет ли обжарка на цену?",         a: "Тёмная обжарка — небольшая доплата +10 ₽/кг из-за более длительного процесса. Светлая и средняя включены в базовую цену." },
  ],
  2: [
    { q: "Что такое квадропак?",               a: "Прямостоячий пакет с плоским дном — хорошо стоит на полке, смотрится premium. Самый популярный формат для ретейла." },
    { q: "Крафт — это дёшево выглядит?",       a: "Нет! Крафт сейчас на пике тренда в specialty-сегменте. Выглядит экологично и премиально. Отлично работает для авторских брендов." },
    { q: "С какой упаковки начать?",           a: "Для старта рекомендуем дой-пак с клапаном — хорошая защита, выгодная цена, легко встаёт на полку." },
  ],
  3: [
    { q: "У меня нет дизайнера — что делать?", a: "Выберите «Индивидуальный» — мы разработаем концепцию этикетки под ваш бренд. Включает 2 варианта и правки." },
    { q: "Что такое готовый шаблон?",           a: "Набор проверенных макетов, куда подставляем ваш логотип, название и цвета. Быстро и дёшево — отлично для старта." },
  ],
  4: [
    { q: "С какого объёма начать?",        a: "100 кг — хороший старт: проверяете спрос, не замораживаете большой бюджет. 300+ кг — уже со скидкой 5%." },
    { q: "Есть ли скидки за объём?",       a: "Да: от 200 кг — скидка 5%, от 500 кг — скидка 10%. Действует автоматически, видно в итоговой сумме." },
  ],
};

// ── База ответов для свободного чата ────────────────────────────

const CALC_BOT_KB: Record<string, string> = {
  "зерно":          "Выбор зерна — основа вкуса. Арабика Перу — мягкая, шоколад. Бразилия — классика для эспрессо. Эфиопия — яркая, ягодная. Робуста Вьетнам — крепкая, дешевле.",
  "арабика":        "Арабика — мягче, ароматнее, меньше кофеина. Подходит для кофеен, ретейла, specialty. Бразилия и Перу — популярные базовые варианты.",
  "робуста":        "Робуста крепче и горче, больше кофеина и крема. Отлично для вендинговых автоматов и крепкого эспрессо. Цена ниже арабики.",
  "обжарка":        "Светлая — fruity, кислотность, specialty. Средняя — универсал, карамель, баланс. Тёмная — насыщенная, горечь, вендинг. Тёмная стоит чуть дороже (+10 ₽/кг).",
  "упаковка":       "Квадропак — стоит на полке, premium. Дой-пак — популярный ретейл. Трёхшовный — бюджетный. Крафт — эко-тренд, specialty. Флоу-пак — линейка и подарки.",
  "квадропак":      "Прямостоячий пакет с плоским дном. Отлично стоит на полке, выглядит дорого. Популярен в ретейле и кофейнях.",
  "дой-пак":        "Классический зип-пакет с клапаном дегазации. Хорошая защита, доступная цена. Оптимальный старт для нового бренда.",
  "дизайн":         "Готовый шаблон — быстро и дёшево (+15 ₽/кг). Индивидуальный — разработаем под ваш бренд (+40 ₽/кг). Есть свой макет — бесплатно.",
  "цена":           "Итог = базовая цена зерна + обжарка + упаковка + дизайн. Скидки: от 200 кг — 5%, от 500 кг — 10%. Точную цену показывает калькулятор справа.",
  "стоимость":      "Стоимость зависит от зерна, упаковки и объёма. Ориентир: от 380 ₽/кг для базового варианта. Используйте калькулятор для точного расчёта.",
  "объём":          "Минимальный заказ — 50 кг. Скидка 5% от 200 кг, скидка 10% от 500 кг. Чем больше объём — тем ниже цена за кг.",
  "минимальный":    "Минимальная партия — 50 кг. Это ~200 пачек по 250г. Отлично для пробного запуска или небольшой кофейни.",
  "срок":           "Первая партия — от 14 дней для объёмов до 200 кг. 200–500 кг — 18 дней. Свыше 500 кг — 25 дней.",
  "скидка":         "Скидки за объём: от 200 кг — 5%, от 500 кг — 10%. Применяются автоматически в итоговой сумме.",
  "вендинг":        "Для вендинга рекомендуем Робусту Вьетнам или купаж Арабика+Робуста, тёмную обжарку. Подстраиваем помол под модель вашего автомата.",
  "кофейня":        "Для кофейни лучше: Арабика Перу или Бразилия, средняя обжарка, зерно (не молотый), 1кг фасовка или 250г для ретейла.",
  "default":        "Спасибо за вопрос! Если не нашёл ответ — напишите нам в Telegram или нажмите «Получить предложение». Менеджер ответит за 30 минут.",
};

function calcBotReply(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, answer] of Object.entries(CALC_BOT_KB)) {
    if (key !== "default" && lower.includes(key)) return answer;
  }
  return CALC_BOT_KB["default"];
}

interface ChatMsg { role: "user" | "bot"; text: string }

// ── Компонент AI-помощника калькулятора ─────────────────────────

const AiHint = ({ step }: { step: number }) => {
  const [open,    setOpen]    = useState(false);
  const [mode,    setMode]    = useState<"hints" | "chat">("hints");
  const [active,  setActive]  = useState<number | null>(null);
  const [msgs,    setMsgs]    = useState<ChatMsg[]>([
    { role: "bot", text: "Привет! Задайте любой вопрос о зерне, обжарке, упаковке или ценах — помогу разобраться." },
  ]);
  const [input,   setInput]   = useState("");
  const [typing,  setTyping]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hints = AI_HINTS[step] ?? [];

  useEffect(() => {
    if (open && mode === "chat") {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [msgs, open, mode]);

  const sendMsg = (text: string) => {
    if (!text.trim()) return;
    setMsgs(m => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMsgs(m => [...m, { role: "bot", text: calcBotReply(text) }]);
      setTyping(false);
    }, 700 + Math.random() * 400);
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-full border transition-all ${
          open
            ? "bg-foreground border-foreground text-white"
            : "border-black/15 text-black/50 hover:border-black/30 hover:text-black/70 hover:bg-black/4"
        }`}
      >
        <Icon name="Sparkles" size={13} />
        AI-помощник
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={12} />
      </button>

      {open && (
        <div className="mt-3 bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm">
          {/* Шапка с переключением режима */}
          <div className="px-4 py-3 border-b border-black/8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-black/8 flex items-center justify-center">
                <Icon name="Bot" size={11} className="text-foreground" />
              </div>
              <span className="text-[11px] font-semibold text-black/60">AI-помощник</span>
            </div>
            {/* Переключатель */}
            <div className="flex gap-0.5 bg-black/5 rounded-full p-0.5">
              {(["hints", "chat"] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded-full transition-all ${
                    mode === m
                      ? "bg-white text-foreground shadow-sm font-semibold"
                      : "text-black/40 hover:text-black/60"
                  }`}>
                  {m === "hints" ? "ВОПРОСЫ" : "ЧАТ"}
                </button>
              ))}
            </div>
          </div>

          {/* Режим: готовые вопросы */}
          {mode === "hints" && (
            <div className="p-3 space-y-2">
              {hints.length > 0 ? hints.map((h, i) => (
                <div key={i}>
                  <button
                    onClick={() => setActive(active === i ? null : i)}
                    className={`w-full text-left flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-[13px] transition-all ${
                      active === i
                        ? "bg-foreground text-white font-medium"
                        : "bg-black/3 border border-black/8 hover:border-black/20 text-foreground"
                    }`}
                  >
                    <span>{h.q}</span>
                    <Icon name={active === i ? "ChevronUp" : "ChevronDown"} size={13}
                      className={`flex-shrink-0 ${active === i ? "text-white/60" : "text-black/30"}`} />
                  </button>
                  {active === i && (
                    <div className="mt-1.5 px-4 py-3 bg-black/3 border border-black/8 rounded-xl text-[13px] leading-relaxed text-foreground">
                      <div className="flex gap-2">
                        <Icon name="Bot" size={13} className="text-black/40 flex-shrink-0 mt-0.5" />
                        <span>{h.a}</span>
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-[12px] text-black/40 text-center py-3">
                  Нет подсказок для этого шага — попробуйте чат
                </p>
              )}
            </div>
          )}

          {/* Режим: свободный чат */}
          {mode === "chat" && (
            <div>
              <div className="p-3 space-y-2 max-h-52 overflow-y-auto">
                {msgs.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "bot" && (
                      <div className="w-5 h-5 rounded-full bg-black/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon name="Bot" size={10} className="text-foreground" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-[12px] leading-relaxed ${
                      m.role === "user"
                        ? "bg-foreground text-white rounded-tr-sm"
                        : "bg-black/4 text-foreground rounded-tl-sm"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-black/8 flex items-center justify-center flex-shrink-0">
                      <Icon name="Bot" size={10} className="text-foreground" />
                    </div>
                    <div className="bg-black/4 rounded-2xl rounded-tl-sm px-3 py-2 flex gap-1">
                      {[0, 1, 2].map(d => (
                        <div key={d} className="w-1.5 h-1.5 rounded-full bg-black/30 animate-bounce"
                          style={{ animationDelay: `${d * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-black/8 p-2 flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMsg(input)}
                  placeholder="Спросите о зерне, цене, упаковке..."
                  className="flex-1 text-[12px] px-3 py-2 bg-black/4 rounded-xl border-none outline-none placeholder:text-black/30 text-foreground"
                />
                <button onClick={() => sendMsg(input)} disabled={!input.trim()}
                  className="w-8 h-8 rounded-xl bg-foreground text-white flex items-center justify-center disabled:opacity-30 transition-opacity flex-shrink-0">
                  <Icon name="Send" size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const STEPS = [
  { id: "origin",    label: "Зерно",    icon: "Leaf"      },
  { id: "roast",     label: "Обжарка",  icon: "Flame"     },
  { id: "packaging", label: "Упаковка", icon: "Box"       },
  { id: "design",    label: "Дизайн",   icon: "Palette"   },
  { id: "volume",    label: "Объём",    icon: "BarChart2" },
];

// Зелёное зерно — цена за кг (базовая)
const ORIGINS = [
  { label: "Арабика Перу",       flag: "🇵🇪", desc: "Мягкий, орех, шоколад",   extra: 0   },
  { label: "Арабика Бразилия",   flag: "🇧🇷", desc: "Классика, карамель",       extra: 20  },
  { label: "Арабика Колумбия",   flag: "🇨🇴", desc: "Карамель, цитрус",         extra: 40  },
  { label: "Арабика Эфиопия",    flag: "🇪🇹", desc: "Ягода, цветок, яркость",  extra: 70  },
  { label: "Робуста Вьетнам",    flag: "🇻🇳", desc: "Крепкий, горький, крема", extra: -30 },
  { label: "Своя смесь / купаж", flag: "⚗️",  desc: "Под ваш вкусовой профиль", extra: 50  },
];

// Степень обжарки — доплата
const ROASTS = [
  { label: "Светлая", desc: "Specialty, fruity, кислотность",  extra: 0  },
  { label: "Средняя", desc: "Универсальная, карамель, баланс", extra: 0  },
  { label: "Тёмная",  desc: "Эспрессо, вендинг, насыщенность", extra: 10 },
];

// Тип упаковки — цена за штуку (в ₽/кг пересчитана условно)
const PACKAGINGS = [
  { label: "Квадропак",              desc: "Прямостоячий, с клапаном",  extra: 60  },
  { label: "Дой-пак с клапаном",    desc: "Популярный ретейл-формат",   extra: 50  },
  { label: "Трёхшовный пакет",      desc: "Бюджетный, плоский",         extra: 25  },
  { label: "Крафт-пакет",           desc: "Эко-тренд, specialty-стиль", extra: 40  },
  { label: "Флоу-пак с клапаном",   desc: "Для линейки и подарков",     extra: 35  },
];

// Дизайн — единоразово или ₽/кг
const DESIGNS = [
  { label: "Готовый шаблон",    icon: "Layout",      desc: "Выбор из наших макетов",   extra: 15,  soon: false },
  { label: "Индивидуальный",    icon: "Brush",       desc: "Разработаем под ваш бренд", extra: 40,  soon: false },
  { label: "Есть свой макет",   icon: "CheckCircle", desc: "Загрузите готовый файл",    extra: 0,   soon: false },
  { label: "Бренд с нуля",      icon: "Sparkles",    desc: "ИИ + дизайнер → скоро",    extra: 0,   soon: true  },
];

// Удалены неиспользуемые USAGES/FORMATS/FASOVKI
const BASE = 380;

// ── Анимированная карточка ────────────────────────────────────

interface OptionCardProps {
  label: string; desc?: string; icon?: string; flag?: string;
  extra?: number; selected: boolean; soon?: boolean; onClick: () => void;
}

const OptionCard = ({ label, desc, icon, flag, extra, selected, soon, onClick }: OptionCardProps) => (
  <button
    onClick={onClick}
    disabled={soon}
    className={`relative p-3.5 rounded-2xl border text-left transition-all duration-200 w-full group ${
      selected
        ? "border-primary bg-primary/8 shadow-sm shadow-primary/10"
        : soon
        ? "border-border/40 opacity-40 cursor-not-allowed"
        : "border-border hover:border-primary/50 hover:bg-secondary/60 hover:scale-[1.01]"
    }`}
  >
    {soon && (
      <span className="absolute top-2 right-2 text-[9px] font-mono bg-accent/10 text-accent border border-accent/20 rounded-full px-1.5 py-0.5">V2</span>
    )}
    <div className="flex items-start gap-3">
      {flag && <span className="text-2xl leading-none mt-0.5">{flag}</span>}
      {icon && !flag && (
        <div className={`mt-0.5 transition-colors ${selected ? "text-primary" : "text-muted-foreground group-hover:text-primary/60"}`}>
          <Icon name={icon} fallback="Circle" size={18} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight transition-colors ${selected ? "text-primary" : ""}`}>{label}</p>
        {desc && <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>}
        {extra !== undefined && extra > 0 && (
          <p className="text-[10px] font-mono text-muted-foreground/70 mt-1">+{extra} ₽/кг</p>
        )}
      </div>
    </div>
    {selected && (
      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
        <Icon name="Check" size={11} className="text-primary-foreground" />
      </div>
    )}
  </button>
);

// ── Контент шага с анимацией появления ───────────────────────

const StepContent = ({ children, stepKey }: { children: React.ReactNode; stepKey: number }) => {
  const [visible, setVisible] = useState(false);
  const prev = useRef(stepKey);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => { setVisible(true); prev.current = stepKey; }, 60);
    return () => clearTimeout(t);
  }, [stepKey]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.28s ease, transform 0.28s ease",
    }}>
      {children}
    </div>
  );
};

// ── Главный компонент ─────────────────────────────────────────

const PriceCalculator = () => {
  const [step, setStep]     = useState(0);
  const [origin, setOrigin] = useState(-1);
  const [roast, setRoast]   = useState(1);
  const [pkg, setPkg]       = useState(-1);
  const [design, setDesign] = useState(-1);
  const [volume, setVolume] = useState(100);

  const canNext = () => {
    if (step === 0) return origin >= 0;
    if (step === 2) return pkg    >= 0;
    if (step === 3) return design >= 0;
    return true;
  };

  const originExtra = origin >= 0 ? ORIGINS[origin].extra  : 0;
  const roastExtra  = ROASTS[roast].extra;
  const pkgExtra    = pkg    >= 0 ? PACKAGINGS[pkg].extra   : 0;
  const designExtra = design >= 0 && !DESIGNS[design].soon ? DESIGNS[design].extra : 0;
  const pricePerKg  = BASE + originExtra + roastExtra + pkgExtra + designExtra;
  const discount    = volume >= 500 ? 0.1 : volume >= 200 ? 0.05 : 0;
  const total       = Math.round(volume * pricePerKg * (1 - discount));
  const leadTime    = volume <= 200 ? 14 : volume <= 500 ? 18 : 25;
  const isLast      = step === STEPS.length - 1;
  const { openModal } = useLeadModal();

  const goNext = () => { if (canNext() && !isLast) setStep(s => s + 1); };

  return (
    <section id="calculator" className="py-24">
      <div className="max-w-5xl mx-auto px-6">

        {/* Заголовок */}
        <div className="scroll-reveal mb-10">
          <span className="text-xs font-mono text-primary tracking-wider">ПРОИЗВОДСТВЕННЫЙ БРИФ</span>
          <h2 className="font-serif text-4xl md:text-5xl mt-3 font-bold">
            Рассчитайте стоимость<br />
            <span className="text-primary">своей партии</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* ── Основная панель ── */}
          <div className="lg:col-span-2">

            {/* Игровой прогресс-трек */}
            <div className="bg-card border border-border rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-0">
                {STEPS.map((s, i) => {
                  const done    = i < step;
                  const active  = i === step;
                  const locked  = i > step;
                  return (
                    <div key={s.id} className="flex items-center flex-1 min-w-0">
                      {/* Узел */}
                      <button
                        onClick={() => (done || active) && setStep(i)}
                        disabled={locked}
                        className={`relative flex-shrink-0 flex flex-col items-center gap-1 group transition-all duration-300 ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}
                        style={{ minWidth: 44 }}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                          active  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-110"
                          : done  ? "bg-primary/20 text-primary"
                          : "bg-secondary text-muted-foreground"
                        }`}>
                          {done
                            ? <Icon name="Check" size={13} />
                            : <Icon name={s.icon} fallback="Circle" size={13} />
                          }
                        </div>
                        <span className={`text-[9px] font-mono whitespace-nowrap transition-colors ${
                          active ? "text-primary font-bold" : done ? "text-primary/70" : "text-muted-foreground"
                        }`}>
                          {s.label}
                        </span>
                        {/* Пульс на активном */}
                        {active && (
                          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary/20 animate-ping" />
                        )}
                      </button>
                      {/* Соединительная линия */}
                      {i < STEPS.length - 1 && (
                        <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden bg-border">
                          <div
                            className="h-full bg-primary transition-all duration-500 rounded-full"
                            style={{ width: i < step ? "100%" : "0%" }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Карточка шага */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              {/* Шапка шага */}
              <div className="px-6 pt-5 pb-4 border-b border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground tracking-widest">
                    ШАГ {String(step + 1).padStart(2, "0")} / {STEPS.length}
                  </span>
                  <h3 className="font-bold text-lg mt-0.5 leading-tight">
                    {[
                      "Выберите зелёное зерно",
                      "Степень обжарки",
                      "Тип упаковки",
                      "Дизайн упаковки",
                      "Объём партии",
                    ][step]}
                  </h3>
                </div>
                <div className="text-3xl opacity-40">
                  {["🌿","🔥","📦","🎨","⚖️"][step]}
                </div>
              </div>

              {/* Контент шага */}
              <div className="p-6 min-h-[260px]">
                <StepContent stepKey={step}>

                  {/* 0 — Зерно */}
                  {step === 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {ORIGINS.map((o, i) => (
                        <OptionCard key={o.label} {...o} selected={origin === i}
                          onClick={() => { setOrigin(i); }} />
                      ))}
                    </div>
                  )}

                  {/* 1 — Обжарка */}
                  {step === 1 && (
                    <div>
                      <div className="relative mb-6">
                        <div className="h-10 rounded-2xl overflow-hidden"
                          style={{ background: "linear-gradient(to right, #fef9c3, #f59e0b, #92400e)" }} />
                        <input type="range" min={0} max={2} step={1} value={roast}
                          onChange={e => setRoast(Number(e.target.value))}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer h-10" />
                        <div className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-lg border-2 border-primary transition-all pointer-events-none"
                          style={{ left: `calc(${(roast / 2) * 100}% - 14px)` }}>
                          <div className="w-full h-full rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {ROASTS.map((r, i) => (
                          <button key={r.label} onClick={() => setRoast(i)}
                            className={`p-3.5 rounded-2xl border text-center transition-all duration-200 ${
                              roast === i
                                ? "border-primary bg-primary/8 shadow-sm"
                                : "border-border hover:border-primary/40 hover:scale-[1.01]"
                            }`}>
                            <p className={`text-sm font-semibold ${roast === i ? "text-primary" : ""}`}>{r.label}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">{r.desc}</p>
                            {r.extra > 0 && <p className="text-[10px] font-mono text-muted-foreground/70 mt-1">+{r.extra} ₽/кг</p>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2 — Упаковка */}
                  {step === 2 && (
                    <div className="grid grid-cols-2 gap-3">
                      {PACKAGINGS.map((p, i) => (
                        <OptionCard key={p.label} label={p.label} desc={p.desc} extra={p.extra}
                          selected={pkg === i} onClick={() => setPkg(i)} />
                      ))}
                    </div>
                  )}

                  {/* 3 — Дизайн */}
                  {step === 3 && (
                    <div className="space-y-3">
                      {DESIGNS.map((d, i) => (
                        <OptionCard key={d.label} label={d.label} icon={d.icon} desc={d.desc}
                          extra={d.extra} soon={d.soon} selected={design === i}
                          onClick={() => !d.soon && setDesign(i)} />
                      ))}
                    </div>
                  )}

                  {/* 4 — Объём */}
                  {step === 4 && (
                    <div>
                      <div className="flex justify-between items-baseline mb-3">
                        <span className="text-sm text-muted-foreground">Количество</span>
                        <span className="font-serif text-3xl font-bold text-primary">{volume} кг</span>
                      </div>
                      <input type="range" min={50} max={1000} step={50} value={volume}
                        onChange={e => setVolume(Number(e.target.value))}
                        className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer mb-1 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md" />
                      <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-6">
                        <span>50 кг</span><span>1 000 кг</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { vol: 100, label: "Старт",   desc: "Тест рынка"  },
                          { vol: 300, label: "Бизнес",  desc: "Скидка 5%"   },
                          { vol: 600, label: "Партнёр", desc: "Скидка 10%"  },
                        ].map(q => (
                          <button key={q.vol} onClick={() => setVolume(q.vol)}
                            className={`p-3 rounded-2xl border text-center transition-all duration-200 ${
                              volume === q.vol
                                ? "border-primary bg-primary/8 text-primary"
                                : "border-border hover:border-primary/30 hover:scale-[1.01]"
                            }`}>
                            <p className="font-semibold text-sm">{q.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{q.vol} кг · {q.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </StepContent>

                {/* AI-подсказки */}
                <AiHint step={step} />

              </div>

              {/* Навигация */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-border/60 bg-secondary/20">
                <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border border-border hover:bg-card transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  <Icon name="ArrowLeft" size={14} /> Назад
                </button>

                {!isLast ? (
                  <button onClick={goNext} disabled={!canNext()}
                    className="flex items-center gap-1.5 px-6 py-2 rounded-full text-sm bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:shadow-primary/20">
                    Далее <Icon name="ArrowRight" size={14} />
                  </button>
                ) : (
                  <button onClick={openModal} className="flex items-center gap-1.5 px-6 py-2 rounded-full text-sm bg-accent text-accent-foreground font-bold hover:bg-accent/90 transition-all shadow-md shadow-accent/20">
                    <Icon name="Send" size={14} /> Отправить бриф
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Правая панель — итог ── */}
          <div className="space-y-3 lg:sticky lg:top-24">
            <div className="bg-primary rounded-2xl p-6 text-primary-foreground shadow-xl shadow-primary/20">
              <p className="text-[10px] font-mono opacity-60 mb-1 tracking-wider">ИТОГО ЗА ПАРТИЮ</p>
              <p className="font-serif text-4xl font-bold">{total.toLocaleString("ru-RU")} ₽</p>
              <p className="text-sm opacity-70 mt-1">{Math.round(total / volume).toLocaleString("ru-RU")} ₽ / кг</p>
              {discount > 0 && (
                <div className="mt-3 bg-white/15 rounded-xl px-3 py-2 flex items-center gap-2 text-sm">
                  <Icon name="Tag" size={13} /> Скидка {discount * 100}% за объём
                </div>
              )}
              <div className="mt-5 space-y-2 pt-4 border-t border-white/20">
                {[
                  { label: "Зерно",    val: origin >= 0 ? ORIGINS[origin].label    : "—" },
                  { label: "Обжарка",  val: ROASTS[roast].label                          },
                  { label: "Упаковка", val: pkg    >= 0 ? PACKAGINGS[pkg].label    : "—" },
                  { label: "Дизайн",   val: design >= 0 && !DESIGNS[design].soon ? DESIGNS[design].label : "—" },
                  { label: "Объём",    val: volume + " кг"                                },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-xs opacity-75">
                    <span>{r.label}</span>
                    <span className="font-mono">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Clock" size={15} className="text-primary" />
                <span className="text-sm font-semibold">Срок производства</span>
              </div>
              <p className="text-3xl font-serif font-bold text-primary">{leadTime} дней</p>
              <p className="text-[11px] text-muted-foreground mt-1">с момента подтверждения</p>
            </div>

            {/* Прогресс-бар брифа */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Заполнено</span>
                <span className="font-mono text-primary font-semibold">{step + 1} / {STEPS.length}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
              </div>
              <div className="flex justify-between mt-2">
                {STEPS.map((s, i) => (
                  <div key={s.id} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= step ? "bg-primary" : "bg-border"}`} />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PriceCalculator;