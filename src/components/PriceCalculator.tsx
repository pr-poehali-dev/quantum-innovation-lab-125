import { useState } from "react";
import Icon from "@/components/ui/icon";

// ── Данные шагов ──────────────────────────────────────────────

const STEPS = [
  { id: "usage",     label: "Назначение",  icon: "Target"     },
  { id: "origin",    label: "Зерно",       icon: "Leaf"       },
  { id: "roast",     label: "Обжарка",     icon: "Flame"      },
  { id: "format",    label: "Формат",      icon: "Package"    },
  { id: "packaging", label: "Упаковка",    icon: "Box"        },
  { id: "design",    label: "Дизайн",      icon: "Palette"    },
  { id: "volume",    label: "Объём",       icon: "BarChart2"  },
];

const USAGES = [
  { label: "Эспрессо в кофейню", icon: "Coffee",      desc: "Зерно для кофемашины",    extra: 0  },
  { label: "Фильтр",             icon: "Droplets",    desc: "Пуровер, аэропресс",      extra: 20 },
  { label: "Вендинг",            icon: "Cpu",         desc: "Автоматы самообслуживания",extra: 0  },
  { label: "Розничная полка",    icon: "ShoppingBag", desc: "Ретейл, маркетплейсы",    extra: 40 },
];

const ORIGINS = [
  { label: "Бразилия",    flag: "🇧🇷", desc: "Шоколад, орех",    extra: 0  },
  { label: "Колумбия",    flag: "🇨🇴", desc: "Карамель, цитрус", extra: 30 },
  { label: "Эфиопия",     flag: "🇪🇹", desc: "Ягода, цветок",    extra: 60 },
  { label: "Своя смесь",  flag: "⚗️",  desc: "Под ваш профиль", extra: 50 },
];

const ROASTS = [
  { label: "Светлая",  desc: "Кислотность, fruity",   val: 0 },
  { label: "Средняя",  desc: "Баланс, карамель",       val: 1 },
  { label: "Тёмная",   desc: "Горечь, шоколад",        val: 2 },
];

const FORMATS = [
  { label: "Зерно",    icon: "Circle",    desc: "Целое зерно", extra: 0  },
  { label: "Молотый",  icon: "Settings2", desc: "Помол на заказ", extra: 10 },
];

const FАСОВКИ = [
  { label: "250 г",  desc: "Кофейни, ретейл", extra: 15 },
  { label: "1 кг",   desc: "Опт, HoReCa",     extra: 0  },
];

const PACKAGINGS = [
  { label: "Крафт",          desc: "Без брендинга",      extra: 0  },
  { label: "С логотипом",    desc: "Печать логотипа",     extra: 25 },
  { label: "Фольга",         desc: "Премиум защита",      extra: 45 },
  { label: "Премиум",        desc: "Дизайнерская упаковка",extra: 80 },
];

const DESIGNS = [
  { label: "Есть макет",      icon: "CheckCircle",  desc: "Загрузим ваши файлы",    extra: 0   },
  { label: "Нужен дизайн",    icon: "Brush",        desc: "Разработаем концепцию",   extra: 120 },
  { label: "Бренд с нуля",    icon: "Sparkles",     desc: "ИИ + дизайнер → V2",      extra: 0, soon: true },
];

const BASE_PRICE_PER_KG = 420;
const SLIDER_CSS = "w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer";

// ── Вспомогательные компоненты ────────────────────────────────

interface OptionCardProps {
  label: string;
  desc?: string;
  icon?: string;
  flag?: string;
  extra?: number;
  selected: boolean;
  soon?: boolean;
  onClick: () => void;
}

const OptionCard = ({ label, desc, icon, flag, extra, selected, soon, onClick }: OptionCardProps) => (
  <button
    onClick={onClick}
    disabled={soon}
    className={`relative p-3.5 rounded-xl border text-left transition-all w-full ${
      selected
        ? "border-primary bg-primary/5 text-primary"
        : soon
        ? "border-border/40 opacity-40 cursor-not-allowed"
        : "border-border hover:border-primary/40 hover:bg-secondary/50"
    }`}
  >
    {soon && (
      <span className="absolute top-1.5 right-1.5 text-[9px] font-mono bg-accent/10 text-accent border border-accent/20 rounded-full px-1.5 py-0.5">
        V2
      </span>
    )}
    <div className="flex items-start gap-2.5">
      {flag && <span className="text-xl leading-none mt-0.5">{flag}</span>}
      {icon && !flag && (
        <div className={`mt-0.5 ${selected ? "text-primary" : "text-muted-foreground"}`}>
          <Icon name={icon} fallback="Circle" size={16} />
        </div>
      )}
      <div>
        <p className="text-sm font-medium leading-tight">{label}</p>
        {desc && <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>}
        {extra !== undefined && extra > 0 && (
          <p className="text-[10px] font-mono text-muted-foreground mt-1">+{extra} ₽/кг</p>
        )}
      </div>
    </div>
    {selected && (
      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
        <Icon name="Check" size={10} className="text-primary-foreground" />
      </div>
    )}
  </button>
);

// ── Главный компонент ─────────────────────────────────────────

const PriceCalculator = () => {
  const [step, setStep] = useState(0);
  const [usage,    setUsage]    = useState(-1);
  const [origin,   setOrigin]   = useState(-1);
  const [roast,    setRoast]    = useState(1);
  const [format,   setFormat]   = useState(0);
  const [fasovka,  setFasovka]  = useState(1);
  const [pkg,      setPkg]      = useState(1);
  const [design,   setDesign]   = useState(-1);
  const [volume,   setVolume]   = useState(100);

  const canNext = () => {
    if (step === 0) return usage   >= 0;
    if (step === 1) return origin  >= 0;
    if (step === 2) return true;
    if (step === 3) return true;
    if (step === 4) return pkg     >= 0;
    if (step === 5) return design  >= 0;
    return true;
  };

  // Расчёт цены
  const usageExtra   = usage   >= 0 ? USAGES[usage].extra   : 0;
  const originExtra  = origin  >= 0 ? ORIGINS[origin].extra : 0;
  const formatExtra  = FORMATS[format].extra;
  const fasovkaExtra = FАСОВКИ[fasovka].extra;
  const pkgExtra     = pkg >= 0 ? PACKAGINGS[pkg].extra : 0;
  const designExtra  = design >= 0 && !DESIGNS[design].soon ? DESIGNS[design].extra : 0;

  const pricePerKg = BASE_PRICE_PER_KG + usageExtra + originExtra + formatExtra + fasovkaExtra + pkgExtra;
  const discount   = volume >= 500 ? 0.1 : volume >= 200 ? 0.05 : 0;
  const total      = Math.round(volume * pricePerKg * (1 - discount));
  const leadTime   = volume <= 200 ? 14 : volume <= 500 ? 18 : 25;

  const isLast = step === STEPS.length - 1;

  return (
    <section id="calculator" className="py-24 bg-secondary/20">
      <div className="max-w-5xl mx-auto px-6">

        {/* Header */}
        <div className="scroll-reveal mb-10">
          <span className="text-xs font-mono text-primary tracking-wider">ПРОИЗВОДСТВЕННЫЙ БРИФ</span>
          <h2 className="font-serif text-4xl md:text-5xl mt-3 font-bold">
            Рассчитайте стоимость<br />
            <span className="text-primary">своей партии</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start scroll-reveal" data-delay="100">

          {/* Левая панель — шаги */}
          <div className="lg:col-span-2">

            {/* Прогресс шагов */}
            <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => i < step || (i <= step) ? setStep(i) : null}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                    i === step
                      ? "bg-primary text-primary-foreground border-primary"
                      : i < step
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-card text-muted-foreground border-border"
                  }`}
                >
                  {i < step
                    ? <Icon name="Check" size={11} />
                    : <Icon name={s.icon} fallback="Circle" size={11} />
                  }
                  {s.label}
                </button>
              ))}
            </div>

            {/* Карточка шага */}
            <div className="bg-card border border-border rounded-2xl p-7 shadow-sm min-h-[320px]">

              {/* Шаг 0 — Назначение */}
              {step === 0 && (
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-1">ШАГ 01</p>
                  <h3 className="font-semibold text-lg mb-5">Для чего нужен кофе?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {USAGES.map((u, i) => (
                      <OptionCard key={u.label} {...u} selected={usage === i} onClick={() => setUsage(i)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Шаг 1 — Зерно */}
              {step === 1 && (
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-1">ШАГ 02</p>
                  <h3 className="font-semibold text-lg mb-5">Выберите зерно</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {ORIGINS.map((o, i) => (
                      <OptionCard key={o.label} {...o} selected={origin === i} onClick={() => setOrigin(i)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Шаг 2 — Обжарка */}
              {step === 2 && (
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-1">ШАГ 03</p>
                  <h3 className="font-semibold text-lg mb-6">Степень обжарки</h3>

                  {/* Визуальный слайдер обжарки */}
                  <div className="relative mb-8">
                    <div className="h-8 rounded-full overflow-hidden flex">
                      <div className="flex-1 bg-gradient-to-r from-amber-200 via-amber-500 to-amber-900" />
                    </div>
                    <input
                      type="range" min={0} max={2} step={1} value={roast}
                      onChange={(e) => setRoast(Number(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-8"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-primary transition-all pointer-events-none"
                      style={{ left: `calc(${(roast / 2) * 100}% - 12px)` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {ROASTS.map((r, i) => (
                      <button
                        key={r.label}
                        onClick={() => setRoast(i)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          roast === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <p className={`text-sm font-semibold ${roast === i ? "text-primary" : ""}`}>{r.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Шаг 3 — Формат */}
              {step === 3 && (
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-1">ШАГ 04</p>
                  <h3 className="font-semibold text-lg mb-5">Формат и фасовка</h3>
                  <div className="mb-5">
                    <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wider">Помол</p>
                    <div className="grid grid-cols-2 gap-3">
                      {FORMATS.map((f, i) => (
                        <OptionCard key={f.label} {...f} selected={format === i} onClick={() => setFormat(i)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wider">Фасовка</p>
                    <div className="grid grid-cols-2 gap-3">
                      {FАСОВКИ.map((f, i) => (
                        <OptionCard key={f.label} label={f.label} desc={f.desc} extra={f.extra} selected={fasovka === i} onClick={() => setFasovka(i)} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Шаг 4 — Упаковка */}
              {step === 4 && (
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-1">ШАГ 05</p>
                  <h3 className="font-semibold text-lg mb-5">Тип упаковки</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {PACKAGINGS.map((p, i) => (
                      <OptionCard key={p.label} label={p.label} desc={p.desc} extra={p.extra} selected={pkg === i} onClick={() => setPkg(i)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Шаг 5 — Дизайн */}
              {step === 5 && (
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-1">ШАГ 06</p>
                  <h3 className="font-semibold text-lg mb-5">Дизайн упаковки</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {DESIGNS.map((d, i) => (
                      <OptionCard key={d.label} label={d.label} icon={d.icon} desc={d.desc} extra={d.extra} soon={d.soon} selected={design === i} onClick={() => !d.soon && setDesign(i)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Шаг 6 — Объём */}
              {step === 6 && (
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-1">ШАГ 07</p>
                  <h3 className="font-semibold text-lg mb-6">Объём партии</h3>

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-muted-foreground">Количество</span>
                    <span className="text-2xl font-serif font-bold text-primary">{volume} кг</span>
                  </div>
                  <input
                    type="range" min={50} max={1000} step={50} value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className={SLIDER_CSS}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1 mb-6">
                    <span>50 кг</span><span>1 000 кг</span>
                  </div>

                  {/* Подсказки по объёму */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { vol: 100,  label: "Старт",    desc: "Тест рынка"    },
                      { vol: 300,  label: "Бизнес",   desc: "Скидка 5%"     },
                      { vol: 600,  label: "Партнёр",  desc: "Скидка 10%"    },
                    ].map((q) => (
                      <button
                        key={q.vol}
                        onClick={() => setVolume(q.vol)}
                        className={`p-2.5 rounded-xl border text-center transition-all text-sm ${
                          volume === q.vol ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <p className="font-semibold">{q.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{q.vol} кг · {q.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Кнопки навигации */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <button
                  onClick={() => setStep(s => s - 1)}
                  disabled={step === 0}
                  className="px-5 py-2.5 rounded-full text-sm border border-border hover:bg-secondary transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Icon name="ArrowLeft" size={14} />
                  Назад
                </button>

                {!isLast ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={!canNext()}
                    className="px-6 py-2.5 rounded-full text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
                  >
                    Далее
                    <Icon name="ArrowRight" size={14} />
                  </button>
                ) : (
                  <button className="px-6 py-2.5 rounded-full text-sm bg-accent text-accent-foreground hover:bg-accent/90 transition-all flex items-center gap-1.5 font-semibold shadow-lg shadow-accent/20">
                    <Icon name="Send" size={14} />
                    Отправить бриф
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Правая панель — итог */}
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="bg-primary rounded-2xl p-6 text-primary-foreground shadow-xl shadow-primary/20">
              <p className="text-[10px] font-mono opacity-60 mb-1 tracking-wider">ИТОГО ЗА ПАРТИЮ</p>
              <p className="font-serif text-4xl font-bold">
                {total.toLocaleString("ru-RU")} ₽
              </p>
              <p className="text-sm opacity-70 mt-1">
                {Math.round(total / volume).toLocaleString("ru-RU")} ₽ / кг
              </p>

              {discount > 0 && (
                <div className="mt-3 bg-white/15 rounded-xl px-3 py-2 flex items-center gap-2 text-sm">
                  <Icon name="Tag" size={13} />
                  Скидка {discount * 100}% за объём
                </div>
              )}

              <div className="mt-5 space-y-2 pt-4 border-t border-white/20">
                {[
                  { label: "Зерно",    val: origin  >= 0 ? ORIGINS[origin].label  : "—" },
                  { label: "Обжарка",  val: ROASTS[roast].label },
                  { label: "Формат",   val: FORMATS[format].label + " · " + FАСОВКИ[fasovka].label },
                  { label: "Упаковка", val: pkg >= 0 ? PACKAGINGS[pkg].label : "—" },
                  { label: "Объём",    val: volume + " кг" },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between text-xs opacity-75">
                    <span>{r.label}</span>
                    <span className="font-mono">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Срок */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Clock" size={15} className="text-primary" />
                <span className="text-sm font-semibold">Срок производства</span>
              </div>
              <p className="text-3xl font-serif font-bold text-primary">{leadTime} дней</p>
              <p className="text-[11px] text-muted-foreground mt-1">с момента подтверждения</p>
            </div>

            {/* Шаг из 7 */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Прогресс брифа</span>
                <span className="font-mono text-primary">{step + 1} / {STEPS.length}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PriceCalculator;
