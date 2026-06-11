import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const STEPS = [
  { id: "usage",     label: "Назначение", icon: "Target"    },
  { id: "origin",    label: "Зерно",      icon: "Leaf"      },
  { id: "roast",     label: "Обжарка",    icon: "Flame"     },
  { id: "format",    label: "Формат",     icon: "Package"   },
  { id: "packaging", label: "Упаковка",   icon: "Box"       },
  { id: "design",    label: "Дизайн",     icon: "Palette"   },
  { id: "volume",    label: "Объём",      icon: "BarChart2" },
];

const USAGES = [
  { label: "Эспрессо в кофейню", icon: "Coffee",      desc: "Зерно для кофемашины",     extra: 0  },
  { label: "Фильтр",             icon: "Droplets",    desc: "Пуровер, аэропресс",       extra: 20 },
  { label: "Вендинг",            icon: "Cpu",         desc: "Автоматы самообслуживания", extra: 0  },
  { label: "Розничная полка",    icon: "ShoppingBag", desc: "Ретейл, маркетплейсы",     extra: 40 },
];

const ORIGINS = [
  { label: "Бразилия",   flag: "🇧🇷", desc: "Шоколад, орех",    extra: 0  },
  { label: "Колумбия",   flag: "🇨🇴", desc: "Карамель, цитрус", extra: 30 },
  { label: "Эфиопия",    flag: "🇪🇹", desc: "Ягода, цветок",    extra: 60 },
  { label: "Своя смесь", flag: "⚗️",  desc: "Под ваш профиль",  extra: 50 },
];

const ROASTS = [
  { label: "Светлая", desc: "Кислотность, fruity", val: 0 },
  { label: "Средняя", desc: "Баланс, карамель",     val: 1 },
  { label: "Тёмная",  desc: "Горечь, шоколад",      val: 2 },
];

const FORMATS = [
  { label: "Зерно",   icon: "Circle",    desc: "Целое зерно",    extra: 0  },
  { label: "Молотый", icon: "Settings2", desc: "Помол на заказ", extra: 10 },
];

const FASOVKI = [
  { label: "250 г", desc: "Кофейни, ретейл", extra: 15 },
  { label: "1 кг",  desc: "Опт, HoReCa",     extra: 0  },
];

const PACKAGINGS = [
  { label: "Крафт",       desc: "Без брендинга",        extra: 0  },
  { label: "С логотипом", desc: "Печать логотипа",       extra: 25 },
  { label: "Фольга",      desc: "Премиум защита",        extra: 45 },
  { label: "Премиум",     desc: "Дизайнерская упаковка", extra: 80 },
];

const DESIGNS = [
  { label: "Есть макет",   icon: "CheckCircle", desc: "Загрузим ваши файлы",   extra: 0,   soon: false },
  { label: "Нужен дизайн", icon: "Brush",       desc: "Разработаем концепцию", extra: 120, soon: false },
  { label: "Бренд с нуля", icon: "Sparkles",    desc: "ИИ + дизайнер → V2",    extra: 0,   soon: true  },
];

const BASE = 420;

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
  const [step, setStep]       = useState(0);
  const [usage, setUsage]     = useState(-1);
  const [origin, setOrigin]   = useState(-1);
  const [roast, setRoast]     = useState(1);
  const [format, setFormat]   = useState(0);
  const [fasovka, setFasovka] = useState(1);
  const [pkg, setPkg]         = useState(1);
  const [design, setDesign]   = useState(-1);
  const [volume, setVolume]   = useState(100);

  const canNext = () => {
    if (step === 0) return usage  >= 0;
    if (step === 1) return origin >= 0;
    if (step === 5) return design >= 0;
    return true;
  };

  const usageExtra  = usage  >= 0 ? USAGES[usage].extra   : 0;
  const originExtra = origin >= 0 ? ORIGINS[origin].extra : 0;
  const pkgExtra    = pkg    >= 0 ? PACKAGINGS[pkg].extra  : 0;
  const designExtra = design >= 0 && !DESIGNS[design].soon ? DESIGNS[design].extra : 0;
  const pricePerKg  = BASE + usageExtra + originExtra + FORMATS[format].extra + FASOVKI[fasovka].extra + pkgExtra;
  const discount    = volume >= 500 ? 0.1 : volume >= 200 ? 0.05 : 0;
  const total       = Math.round(volume * pricePerKg * (1 - discount));
  const leadTime    = volume <= 200 ? 14 : volume <= 500 ? 18 : 25;
  const isLast      = step === STEPS.length - 1;

  const goNext = () => { if (canNext() && !isLast) setStep(s => s + 1); };

  // Автопереход при выборе на шагах с одним выбором
  const pick = (setter: (v: number) => void, val: number, autoNext = false) => {
    setter(val);
    if (autoNext && !isLast) setTimeout(() => setStep(s => s + 1), 320);
  };

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
                      "Для чего нужен кофе?",
                      "Выберите зерно",
                      "Степень обжарки",
                      "Формат и фасовка",
                      "Тип упаковки",
                      "Дизайн упаковки",
                      "Объём партии",
                    ][step]}
                  </h3>
                </div>
                <div className="text-3xl opacity-40">
                  {["🎯","🌿","🔥","📦","🎁","🎨","⚖️"][step]}
                </div>
              </div>

              {/* Контент шага */}
              <div className="p-6 min-h-[260px]">
                <StepContent stepKey={step}>

                  {/* 0 — Назначение */}
                  {step === 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {USAGES.map((u, i) => (
                        <OptionCard key={u.label} {...u} selected={usage === i}
                          onClick={() => pick(setUsage, i, true)} />
                      ))}
                    </div>
                  )}

                  {/* 1 — Зерно */}
                  {step === 1 && (
                    <div className="grid grid-cols-2 gap-3">
                      {ORIGINS.map((o, i) => (
                        <OptionCard key={o.label} {...o} selected={origin === i}
                          onClick={() => pick(setOrigin, i, true)} />
                      ))}
                    </div>
                  )}

                  {/* 2 — Обжарка */}
                  {step === 2 && (
                    <div>
                      {/* Слайдер-градиент */}
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
                        <div className="flex justify-between text-[10px] font-mono text-white/80 px-3 pt-1 pointer-events-none absolute inset-x-0 top-0 h-10 items-center">
                          <span>СВЕТЛАЯ</span><span>СРЕДНЯЯ</span><span>ТЁМНАЯ</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {ROASTS.map((r, i) => (
                          <button key={r.label} onClick={() => pick(setRoast, i, true)}
                            className={`p-3.5 rounded-2xl border text-center transition-all duration-200 ${
                              roast === i
                                ? "border-primary bg-primary/8 shadow-sm"
                                : "border-border hover:border-primary/40 hover:scale-[1.01]"
                            }`}>
                            <p className={`text-sm font-semibold ${roast === i ? "text-primary" : ""}`}>{r.label}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">{r.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3 — Формат */}
                  {step === 3 && (
                    <div className="space-y-5">
                      <div>
                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-3">Помол</p>
                        <div className="grid grid-cols-2 gap-3">
                          {FORMATS.map((f, i) => (
                            <OptionCard key={f.label} {...f} selected={format === i}
                              onClick={() => setFormat(i)} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-3">Фасовка</p>
                        <div className="grid grid-cols-2 gap-3">
                          {FASOVKI.map((f, i) => (
                            <OptionCard key={f.label} label={f.label} desc={f.desc} extra={f.extra}
                              selected={fasovka === i} onClick={() => setFasovka(i)} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4 — Упаковка */}
                  {step === 4 && (
                    <div className="grid grid-cols-2 gap-3">
                      {PACKAGINGS.map((p, i) => (
                        <OptionCard key={p.label} label={p.label} desc={p.desc} extra={p.extra}
                          selected={pkg === i} onClick={() => pick(setPkg, i, true)} />
                      ))}
                    </div>
                  )}

                  {/* 5 — Дизайн */}
                  {step === 5 && (
                    <div className="space-y-3">
                      {DESIGNS.map((d, i) => (
                        <OptionCard key={d.label} label={d.label} icon={d.icon} desc={d.desc}
                          extra={d.extra} soon={d.soon} selected={design === i}
                          onClick={() => !d.soon && pick(setDesign, i, true)} />
                      ))}
                    </div>
                  )}

                  {/* 6 — Объём */}
                  {step === 6 && (
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
                  <button className="flex items-center gap-1.5 px-6 py-2 rounded-full text-sm bg-accent text-accent-foreground font-bold hover:bg-accent/90 transition-all shadow-md shadow-accent/20">
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
                  { label: "Зерно",    val: origin  >= 0 ? ORIGINS[origin].label   : "—" },
                  { label: "Обжарка",  val: ROASTS[roast].label                         },
                  { label: "Формат",   val: FORMATS[format].label + " · " + FASOVKI[fasovka].label },
                  { label: "Упаковка", val: pkg >= 0 ? PACKAGINGS[pkg].label        : "—" },
                  { label: "Объём",    val: volume + " кг"                               },
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
