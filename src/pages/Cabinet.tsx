import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

// ── Моковые данные ────────────────────────────────────────────

const ORDERS = [
  {
    id: "ORD-2847",
    date: "05.06.2026",
    brand: "NORD ROAST",
    volume: "200 кг",
    format: "Зерно · 250г",
    roast: "Светлая",
    packaging: "Фольга с печатью",
    status: "delivery",
    statusLabel: "В доставке",
    progress: 85,
    total: "97 400 ₽",
    steps: [
      { label: "Заказ принят",    done: true  },
      { label: "Обжарка",         done: true  },
      { label: "Упаковка",        done: true  },
      { label: "Отгрузка",        done: false },
    ],
  },
  {
    id: "ORD-2601",
    date: "12.04.2026",
    brand: "TERRA VERDE",
    volume: "300 кг",
    format: "Молотый · 1кг",
    roast: "Средняя",
    packaging: "С логотипом",
    status: "done",
    statusLabel: "Доставлен",
    progress: 100,
    total: "138 600 ₽",
    steps: [
      { label: "Заказ принят", done: true },
      { label: "Обжарка",      done: true },
      { label: "Упаковка",     done: true },
      { label: "Отгрузка",     done: true },
    ],
  },
  {
    id: "ORD-2390",
    date: "18.02.2026",
    brand: "NORD ROAST",
    volume: "150 кг",
    format: "Зерно · 250г",
    roast: "Средняя",
    packaging: "Крафт",
    status: "done",
    statusLabel: "Доставлен",
    progress: 100,
    total: "63 000 ₽",
    steps: [
      { label: "Заказ принят", done: true },
      { label: "Обжарка",      done: true },
      { label: "Упаковка",     done: true },
      { label: "Отгрузка",     done: true },
    ],
  },
];

const BRANDS_DATA = [
  {
    id: 1,
    name: "NORD ROAST",
    sub: "SPECIALTY · ETHIOPIA",
    color: "#1e40af",
    colorBottom: "#0f172a",
    accent: "#60a5fa",
    files: ["nord_logo.ai", "nord_label_v3.pdf"],
    lastOrder: "05.06.2026",
  },
  {
    id: 2,
    name: "TERRA VERDE",
    sub: "ORGANIC · BRAZIL",
    color: "#065f46",
    colorBottom: "#022c22",
    accent: "#34d399",
    files: ["terra_brand.pdf"],
    lastOrder: "12.04.2026",
  },
];

const DOCS = [
  { id: "ORD-2847", name: "Счёт №847 от 05.06.2026",       type: "Счёт",        size: "84 КБ"  },
  { id: "ORD-2601", name: "УПД №601 от 12.04.2026",        type: "Накладная",   size: "112 КБ" },
  { id: "ORD-2601", name: "Акт выполненных работ №601",    type: "Акт",         size: "96 КБ"  },
  { id: "ORD-2390", name: "Счёт №390 от 18.02.2026",       type: "Счёт",        size: "78 КБ"  },
  { id: "ORD-2390", name: "УПД №390 от 18.02.2026",        type: "Накладная",   size: "108 КБ" },
];

// ── Типы вкладок ──────────────────────────────────────────────

type Tab = "orders" | "history" | "brands" | "reorder";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "orders",  label: "Мои заказы",   icon: "Package"    },
  { id: "history", label: "Документы",    icon: "FileText"   },
  { id: "brands",  label: "Мои бренды",   icon: "Palette"    },
  { id: "reorder", label: "Повторить",    icon: "RefreshCw"  },
];

// ── Статус-бейдж ──────────────────────────────────────────────

const StatusBadge = ({ status, label }: { status: string; label: string }) => {
  const styles: Record<string, string> = {
    delivery: "bg-blue-500/10 text-blue-600 border-blue-200",
    done:     "bg-green-500/10 text-green-600 border-green-200",
    prod:     "bg-amber-500/10 text-amber-600 border-amber-200",
  };
  return (
    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${styles[status] ?? styles.prod}`}>
      {label}
    </span>
  );
};

// ── Карточка заказа ───────────────────────────────────────────

const OrderCard = ({ order, onReorder }: { order: typeof ORDERS[0]; onReorder: () => void }) => (
  <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
          <StatusBadge status={order.status} label={order.statusLabel} />
        </div>
        <p className="font-serif text-lg font-bold">{order.brand}</p>
        <p className="text-sm text-muted-foreground">{order.volume} · {order.format} · {order.roast}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-serif text-xl font-bold text-primary">{order.total}</p>
        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{order.date}</p>
      </div>
    </div>

    {/* Прогресс */}
    <div>
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-2">
        <span>Прогресс производства</span>
        <span className="text-primary">{order.progress}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-700"
          style={{ width: `${order.progress}%` }} />
      </div>
    </div>

    {/* Шаги */}
    <div className="grid grid-cols-4 gap-2">
      {order.steps.map((s) => (
        <div key={s.label} className="text-center">
          <div className={`h-1 rounded-full mb-1.5 ${s.done ? "bg-primary" : "bg-border"}`} />
          <span className={`text-[9px] font-mono ${s.done ? "text-primary" : "text-muted-foreground"}`}>
            {s.label}
          </span>
        </div>
      ))}
    </div>

    <div className="flex items-center justify-between pt-1 border-t border-border">
      <span className="text-xs text-muted-foreground">{order.packaging}</span>
      <button onClick={onReorder}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
        <Icon name="RefreshCw" size={12} />
        Повторить заказ
      </button>
    </div>
  </div>
);

// ── Главная страница ──────────────────────────────────────────

const Cabinet = () => {
  const [tab, setTab] = useState<Tab>("orders");
  const [reorderDraft, setReorderDraft] = useState<typeof ORDERS[0] | null>(null);

  const handleReorder = (order: typeof ORDERS[0]) => {
    setReorderDraft(order);
    setTab("reorder");
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Шапка ЛК */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10v1.5C12 9 9.5 11 7 11S2 9 2 5.5V4z" fill="white" opacity="0.9"/>
                  <path d="M10 4c0-1 1.5-1 1.5 0v1.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-serif text-sm font-bold">КонтрактКофе</span>
            </Link>
            <span className="text-border">·</span>
            <span className="text-sm text-muted-foreground font-medium">Личный кабинет</span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={14} />
            На сайт
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Приветствие */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Добро пожаловать</h1>
          <p className="text-muted-foreground mt-1">Управляйте заказами, документами и брендами</p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Заказов всего",    val: "3",          icon: "Package",   color: "text-primary"  },
            { label: "В доставке",       val: "1",          icon: "Truck",     color: "text-blue-500" },
            { label: "Объём за год",     val: "650 кг",     icon: "BarChart2", color: "text-green-500"},
            { label: "Потрачено",        val: "299 000 ₽",  icon: "Wallet",    color: "text-amber-500"},
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
              <div className={`mb-2 ${s.color}`}>
                <Icon name={s.icon} fallback="Circle" size={18} />
              </div>
              <p className="font-serif text-2xl font-bold">{s.val}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Вкладки */}
        <div className="flex gap-1 mb-6 bg-secondary/50 rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              <Icon name={t.icon} fallback="Circle" size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Вкладка: Мои заказы ── */}
        {tab === "orders" && (
          <div className="space-y-4">
            {ORDERS.map(o => (
              <OrderCard key={o.id} order={o} onReorder={() => handleReorder(o)} />
            ))}
          </div>
        )}

        {/* ── Вкладка: Документы ── */}
        {tab === "history" && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold">Документы по заказам</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Счета, накладные, акты</p>
            </div>
            <div className="divide-y divide-border">
              {DOCS.map((d, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                      <Icon name="FileText" size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{d.id} · {d.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground border border-border rounded-full px-2 py-0.5">{d.type}</span>
                    <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                      <Icon name="Download" size={13} />
                      Скачать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Вкладка: Мои бренды ── */}
        {tab === "brands" && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {BRANDS_DATA.map(b => (
                <div key={b.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  {/* Цветная шапка бренда */}
                  <div className="h-20 flex items-center justify-center px-6"
                    style={{ background: `linear-gradient(135deg, ${b.color}, ${b.colorBottom})` }}>
                    <p className="font-serif text-xl font-bold tracking-widest"
                      style={{ color: b.accent, textShadow: `0 0 20px ${b.accent}60` }}>{b.name}</p>
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] font-mono text-muted-foreground tracking-wider mb-3">{b.sub}</p>
                    <div className="space-y-1.5 mb-4">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Файлы</p>
                      {b.files.map(f => (
                        <div key={f} className="flex items-center justify-between py-1.5 px-3 bg-secondary/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Icon name="Paperclip" size={12} className="text-muted-foreground" />
                            <span className="text-xs font-mono">{f}</span>
                          </div>
                          <Icon name="Download" size={13} className="text-primary cursor-pointer" />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                      <span>Последний заказ: {b.lastOrder}</span>
                      <button className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors">
                        <Icon name="Upload" size={12} />
                        Загрузить макет
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Добавить бренд */}
              <button className="bg-secondary/30 border border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary/40 hover:bg-primary/3 transition-all group">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-border group-hover:border-primary/40 flex items-center justify-center transition-colors">
                  <Icon name="Plus" size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Добавить бренд</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Загрузите макет или создайте новый</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Вкладка: Повторить заказ ── */}
        {tab === "reorder" && (
          <div className="max-w-xl space-y-5">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">ПОВТОРНЫЙ ЗАКАЗ</p>
                <h2 className="font-semibold text-lg">Выберите базовый заказ</h2>
              </div>
              <div className="space-y-2">
                {ORDERS.map(o => (
                  <button key={o.id} onClick={() => setReorderDraft(o)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      reorderDraft?.id === o.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-secondary/50"
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{o.brand}</p>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{o.id} · {o.volume} · {o.format}</p>
                      </div>
                      {reorderDraft?.id === o.id && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Icon name="Check" size={11} className="text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {reorderDraft && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <p className="text-xs font-mono text-muted-foreground">ПАРАМЕТРЫ ЗАКАЗА</p>
                {[
                  { label: "Бренд",     val: reorderDraft.brand     },
                  { label: "Объём",     val: reorderDraft.volume    },
                  { label: "Формат",    val: reorderDraft.format    },
                  { label: "Обжарка",   val: reorderDraft.roast     },
                  { label: "Упаковка",  val: reorderDraft.packaging },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium">{r.val}</span>
                  </div>
                ))}
                <button className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2">
                  <Icon name="Send" size={15} />
                  Отправить заявку на повтор
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Cabinet;
