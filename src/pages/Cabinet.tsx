import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

// ── Данные ──────────────────────────────────────────────────

const PASSPORT = {
  id: "PP-0042",
  brand: "NORD ROAST",
  sub: "SPECIALTY · ETHIOPIA",
  accent: "#60a5fa",
  colorTop: "#1e40af",
  colorBottom: "#0f172a",
  versions: [
    {
      v: "v3", date: "05.06.2026", active: true,
      note: "Обжарка переведена на более тёмный профиль (по запросу клиента)",
      params: [
        { label: "Зерно",    val: "Эфиопия Иргачеффе"   },
        { label: "Смесь",    val: "100% моносорт"        },
        { label: "Обжарка",  val: "Тёмная · 220°C"       },
        { label: "Формат",   val: "Зерно · 250г"         },
        { label: "Упаковка", val: "Фольга с логотипом"   },
        { label: "Дизайн",   val: "Макет v3 (финал)"     },
      ],
    },
    { v: "v2", date: "12.04.2026", active: false, note: "Изменена фасовка с 1кг на 250г", params: [] },
    { v: "v1", date: "18.02.2026", active: false, note: "Первый согласованный рецепт",    params: [] },
  ],
};

const TIMELINE = [
  { id: 1, label: "Зерно на складе",   icon: "Leaf",        done: true,  date: "01.06", desc: "200 кг · Эфиопия"         },
  { id: 2, label: "Обжарка",           icon: "Flame",        done: true,  date: "04.06", desc: "Тёмный профиль"           },
  { id: 3, label: "Фасовка",           icon: "Package",      done: true,  date: "07.06", desc: "800 пакетов 250г"         },
  { id: 4, label: "Контроль качества", icon: "ShieldCheck",  done: false, date: "09.06", desc: "В процессе"               },
  { id: 5, label: "Отгрузка",          icon: "Truck",        done: false, date: "11.06", desc: "СДЭК · ожидание"         },
];

const ORDERS_HISTORY = [
  { id: "ORD-2847", date: "05.06.2026", brand: "NORD ROAST",  volume: 200, total: "97 400 ₽",  status: "production" },
  { id: "ORD-2601", date: "12.04.2026", brand: "TERRA VERDE", volume: 300, total: "138 600 ₽", status: "done"       },
  { id: "ORD-2390", date: "18.02.2026", brand: "NORD ROAST",  volume: 150, total: "63 000 ₽",  status: "done"       },
];

const DOCS = [
  { name: "Счёт №847 от 05.06.2026",    type: "Счёт",      order: "ORD-2847", size: "84 КБ"  },
  { name: "УПД №601 от 12.04.2026",     type: "Накладная", order: "ORD-2601", size: "112 КБ" },
  { name: "Акт выполненных работ №601", type: "Акт",       order: "ORD-2601", size: "96 КБ"  },
  { name: "Декларация соответствия",    type: "Документ",  order: "ORD-2601", size: "210 КБ" },
  { name: "Счёт №390 от 18.02.2026",    type: "Счёт",      order: "ORD-2390", size: "78 КБ"  },
];

const MOCKUPS = [
  { name: "nord_label_v3_ФИНАЛ.pdf", date: "05.06.2026", status: "approved", comment: ""                     },
  { name: "nord_label_v2.pdf",       date: "12.04.2026", status: "archived", comment: "Устарел — заменён v3" },
  { name: "brand_guide_nord.ai",     date: "18.02.2026", status: "approved", comment: ""                     },
];

type Tab = "passport" | "live" | "reorder" | "docs";

const TABS: { id: Tab; label: string; icon: string; badge?: string }[] = [
  { id: "passport", label: "Паспорт продукта", icon: "BookOpen"            },
  { id: "live",     label: "Партия в эфире",   icon: "Radio",  badge: "LIVE" },
  { id: "reorder",  label: "Повторить партию", icon: "RefreshCw"           },
  { id: "docs",     label: "Документы",        icon: "FileText"            },
];

const StatusDot = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    done: "bg-green-500", production: "bg-amber-400 animate-pulse",
    approved: "bg-green-500", archived: "bg-border",
  };
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${map[status] ?? "bg-border"}`} />;
};

// ── Страница ─────────────────────────────────────────────────

const Cabinet = () => {
  const [tab, setTab] = useState<Tab>("passport");
  const [passportVer, setPassportVer] = useState(0);
  const [reorderVolume, setReorderVolume] = useState(200);
  const [reorderSent, setReorderSent] = useState(false);

  const activeVersion   = PASSPORT.versions[passportVer];
  const currentProgress = TIMELINE.filter(t => t.done).length;
  const totalProgress   = TIMELINE.length;

  return (
    <div className="min-h-screen bg-background">

      {/* Шапка */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 7h8v3.5A3 3 0 0 1 8 13.5 3 3 0 0 1 3 10.5Z" fill="white" opacity="0.95"/>
                  <path d="M11 8.5h1a1.5 1.5 0 0 1 0 3h-1" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                  <path d="M5 5C5 4.2 5.8 3.8 5.8 3S5 1.8 5 1M7.5 5C7.5 4.2 8.3 3.8 8.3 3S7.5 1.8 7.5 1M10 5C10 4.2 10.8 3.8 10.8 3S10 1.8 10 1" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.8"/>
                </svg>
              </div>
              <span className="font-serif text-sm font-bold">КонтрактКофе</span>
            </Link>
            <span className="text-border text-lg">/</span>
            <span className="text-sm text-muted-foreground">Личный кабинет</span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={14} /> На сайт
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Дашборд-шапка */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Активный бренд */}
          <div className="col-span-2 rounded-2xl overflow-hidden relative"
            style={{ background: `linear-gradient(135deg, ${PASSPORT.colorTop}, ${PASSPORT.colorBottom})`, minHeight: 130 }}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
            <div className="relative p-5 h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-mono text-white/50 tracking-widest mb-1">АКТИВНЫЙ БРЕНД · {PASSPORT.id}</p>
                  <p className="font-serif text-2xl font-bold text-white">{PASSPORT.brand}</p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: PASSPORT.accent }}>{PASSPORT.sub}</p>
                </div>
                <div className="text-[10px] font-mono mt-1 px-2 py-1 rounded-full border border-white/20 text-white/60">
                  {activeVersion.v} · {activeVersion.date}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {["Зерно", "Обжарка", "Упаковка"].map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Live-этапы */}
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:border-amber-400/40 transition-colors"
            onClick={() => setTab("live")}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-mono text-amber-500 font-bold">LIVE</span>
              </div>
              <Icon name="Radio" size={14} className="text-amber-400" />
            </div>
            <div>
              <p className="font-serif text-3xl font-bold">{Math.round((currentProgress / totalProgress) * 100)}%</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">партия готова</p>
            </div>
            <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                style={{ width: `${(currentProgress / totalProgress) * 100}%` }} />
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-2">ORD-2847 · {TIMELINE.find(t => !t.done)?.label}</p>
          </div>

          {/* Отгрузка */}
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-muted-foreground">ОТГРУЗКА</span>
              <Icon name="Truck" size={14} className="text-primary" />
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-primary">11 июн</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">200 кг · СДЭК</p>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-mono text-muted-foreground">ожидание трек-номера</span>
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex gap-1 mb-6 bg-secondary/40 rounded-xl p-1 w-fit overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              <Icon name={t.icon} fallback="Circle" size={14} />
              {t.label}
              {t.badge && (
                <span className="text-[9px] font-mono bg-amber-400/15 text-amber-600 border border-amber-400/25 rounded-full px-1.5 py-0.5">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── ПАСПОРТ ПРОДУКТА ── */}
        {tab === "passport" && (
          <div className="grid md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-4">
              {/* Параметры рецептуры */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground tracking-wider mb-0.5">ПАСПОРТ · {PASSPORT.id}</p>
                    <h2 className="font-serif text-xl font-bold">{PASSPORT.brand}</h2>
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-green-600 bg-green-500/8 border border-green-500/20 rounded-full px-3 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Активная версия
                  </span>
                </div>
                {activeVersion.params.length > 0 && (
                  <div className="p-5 grid grid-cols-2 gap-3">
                    {activeVersion.params.map(p => (
                      <div key={p.label} className="bg-secondary/40 rounded-xl px-4 py-3 border border-border/50">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{p.label}</p>
                        <p className="text-sm font-semibold">{p.val}</p>
                      </div>
                    ))}
                  </div>
                )}
                {activeVersion.note && (
                  <div className="mx-5 mb-5 flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
                    <Icon name="Info" size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{activeVersion.note}</p>
                  </div>
                )}
              </div>

              {/* Макеты */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold">Макеты упаковки</h3>
                  <button className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/80 transition-colors">
                    <Icon name="Upload" size={13} /> Загрузить
                  </button>
                </div>
                <div className="divide-y divide-border">
                  {MOCKUPS.map((m, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3.5 hover:bg-secondary/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                          <Icon name="FileImage" size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <StatusDot status={m.status} />
                            <span className="text-[11px] text-muted-foreground">
                              {m.status === "approved" ? "Согласован" : "Архив"} · {m.date}
                              {m.comment ? ` · ${m.comment}` : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="p-2 rounded-lg hover:bg-primary/8 text-primary hover:text-primary/80 transition-colors">
                        <Icon name="Download" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* История версий */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden self-start">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-sm">История рецептур</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Кликните для просмотра</p>
              </div>
              <div className="p-4 space-y-2">
                {PASSPORT.versions.map((v, i) => (
                  <button key={v.v} onClick={() => setPassportVer(i)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      passportVer === i
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30 hover:bg-secondary/30"
                    }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold font-mono ${passportVer === i ? "text-primary" : ""}`}>{v.v}</span>
                        {v.active && (
                          <span className="text-[9px] font-mono bg-green-500/15 text-green-600 border border-green-500/25 rounded-full px-1.5 py-0.5">
                            текущая
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{v.date}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{v.note}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ПАРТИЯ В ПРЯМОМ ЭФИРЕ ── */}
        {tab === "live" && (
          <div className="space-y-5">
            {/* Статус-карта */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-mono text-amber-500 font-bold tracking-wider">ПРОИЗВОДСТВО · В ПРЯМОМ ЭФИРЕ</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold">Заказ ORD-2847</h2>
                  <p className="text-muted-foreground text-sm mt-0.5">NORD ROAST · 200 кг · Тёмная обжарка</p>
                </div>
                <div className="text-right bg-amber-500/8 border border-amber-500/20 rounded-2xl px-5 py-3">
                  <p className="text-[10px] font-mono text-muted-foreground">ГОТОВНОСТЬ</p>
                  <p className="font-serif text-4xl font-bold text-amber-500">
                    {Math.round((currentProgress / totalProgress) * 100)}%
                  </p>
                </div>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(currentProgress / totalProgress) * 100}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>Старт 01.06</span>
                <span>Отгрузка 11.06</span>
              </div>
            </div>

            {/* Таймлайн этапов */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-semibold">Этапы производства</h3>
              </div>
              <div className="p-5 space-y-1">
                {TIMELINE.map((item, i) => {
                  const isActive = !item.done && (i === 0 || TIMELINE[i - 1].done);
                  return (
                    <div key={item.id}>
                      <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                        item.done  ? "bg-green-500/5 border border-green-500/15"
                        : isActive ? "bg-amber-500/8 border border-amber-500/20"
                        :            "border border-transparent bg-secondary/20"
                      }`}>
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.done  ? "bg-green-500/15 text-green-600"
                          : isActive ? "bg-amber-500/15 text-amber-500"
                          :            "bg-secondary text-muted-foreground"
                        }`}>
                          <Icon name={item.done ? "CheckCircle2" : item.icon} fallback="Circle" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-semibold ${
                              item.done ? "" : isActive ? "text-amber-600" : "text-muted-foreground"
                            }`}>{item.label}</p>
                            {isActive && (
                              <span className="text-[9px] font-mono bg-amber-400/20 text-amber-600 border border-amber-400/30 rounded-full px-2 py-0.5">
                                СЕЙЧАС
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                        <span className={`text-sm font-mono font-bold flex-shrink-0 ${
                          item.done ? "text-green-600" : isActive ? "text-amber-500" : "text-muted-foreground"
                        }`}>{item.date}</span>
                      </div>
                      {i < TIMELINE.length - 1 && (
                        <div className="ml-9 flex">
                          <div className={`w-0.5 h-3 ${item.done ? "bg-green-500/30" : "bg-border"}`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Трек-номер ожидание */}
            <div className="bg-secondary/30 border border-dashed border-border rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <Icon name="MapPin" size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Трек-номер появится после отгрузки</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Ожидается 11 июня · СДЭК</p>
              </div>
            </div>
          </div>
        )}

        {/* ── ПОВТОРИТЬ ПАРТИЮ ── */}
        {tab === "reorder" && (
          <div className="max-w-2xl">
            {!reorderSent ? (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${PASSPORT.colorTop}, ${PASSPORT.colorBottom})` }}>
                      <Icon name="BookOpen" size={15} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{PASSPORT.brand} · {PASSPORT.id}</p>
                      <p className="text-[11px] text-muted-foreground">Рецептура {activeVersion.v} от {activeVersion.date} · без изменений</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-[11px] text-green-600 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Актуальная
                    </span>
                  </div>
                  <div className="p-5 grid grid-cols-3 gap-2">
                    {activeVersion.params.map(p => (
                      <div key={p.label} className="text-center p-3 bg-secondary/40 rounded-xl border border-border/50">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{p.label}</p>
                        <p className="text-xs font-semibold leading-tight">{p.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-baseline justify-between mb-5">
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground tracking-wider mb-0.5">ТОЛЬКО МЕНЯЕМ</p>
                      <h3 className="font-semibold text-lg">Объём партии</h3>
                    </div>
                    <span className="font-serif text-4xl font-bold text-primary">{reorderVolume}<span className="text-2xl ml-1">кг</span></span>
                  </div>

                  <input type="range" min={50} max={1000} step={50} value={reorderVolume}
                    onChange={e => setReorderVolume(Number(e.target.value))}
                    className="w-full h-2.5 bg-secondary rounded-full appearance-none cursor-pointer mb-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md" />
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-5">
                    <span>50 кг</span><span>1 000 кг</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {[
                      { vol: 100, label: "Как прошлый раз", hint: "~100 кг" },
                      { vol: 300, label: "Увеличить ×2",    hint: "Скидка 5%" },
                      { vol: 600, label: "По максимуму",    hint: "Скидка 10%" },
                    ].map(q => (
                      <button key={q.vol} onClick={() => setReorderVolume(q.vol)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          reorderVolume === q.vol
                            ? "border-primary bg-primary/8 text-primary"
                            : "border-border hover:border-primary/30 hover:bg-secondary/30"
                        }`}>
                        <p className="text-xs font-semibold">{q.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{q.hint}</p>
                      </button>
                    ))}
                  </div>

                  <div className="bg-primary/5 border border-primary/15 rounded-xl px-5 py-4 flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground tracking-wider">СТОИМОСТЬ</p>
                      <p className="font-serif text-2xl font-bold text-primary">
                        {Math.round(reorderVolume * 487 * (reorderVolume >= 500 ? 0.9 : reorderVolume >= 200 ? 0.95 : 1)).toLocaleString("ru-RU")} ₽
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-muted-foreground tracking-wider">СРОК</p>
                      <p className="font-serif text-2xl font-bold">{reorderVolume <= 200 ? 14 : reorderVolume <= 500 ? 18 : 25} <span className="text-base font-normal text-muted-foreground">дн</span></p>
                    </div>
                  </div>

                  <button onClick={() => setReorderSent(true)}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-base hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.99]">
                    <Icon name="RefreshCw" size={18} />
                    Повторить партию — {reorderVolume} кг
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl px-8 py-14 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center mb-6">
                  <Icon name="CheckCircle" size={40} className="text-green-500" />
                </div>
                <h2 className="font-serif text-2xl font-bold mb-2">Заявка отправлена!</h2>
                <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-1">
                  Партия <strong>{reorderVolume} кг · {PASSPORT.brand}</strong> передана менеджеру.
                </p>
                <p className="text-[11px] font-mono text-muted-foreground mb-8">Рецептура {activeVersion.v} · без изменений</p>
                <button onClick={() => setReorderSent(false)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Создать ещё одну заявку
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ДОКУМЕНТЫ ── */}
        {tab === "docs" && (
          <div className="space-y-4">
            {ORDERS_HISTORY.map(order => {
              const orderDocs = DOCS.filter(d => d.order === order.id);
              if (!orderDocs.length) return null;
              return (
                <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusDot status={order.status} />
                      <div>
                        <p className="text-sm font-bold">{order.id} · {order.brand}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{order.date} · {order.volume} кг · {order.total}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                      order.status === "done"
                        ? "bg-green-500/8 text-green-600 border-green-500/20"
                        : "bg-amber-500/8 text-amber-600 border-amber-500/20"
                    }`}>
                      {order.status === "done" ? "Доставлен" : "В производстве"}
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {orderDocs.map((d, i) => (
                      <div key={i} className="flex items-center justify-between px-6 py-3.5 hover:bg-secondary/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                            <Icon name="FileText" size={14} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{d.name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">{d.type} · {d.size}</p>
                          </div>
                        </div>
                        <button className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5">
                          <Icon name="Download" size={13} /> Скачать
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default Cabinet;
