import { useState } from "react";
import Icon from "@/components/ui/icon";
import { MANAGER, type Tab } from "./cabinet.types";
import { useClientAuth } from "@/context/ClientAuthContext";
import OrderForm from "./OrderForm";

interface CabinetDashboardProps {
  setTab: (t: Tab) => void;
}

const formatMoney = (n: number) => n.toLocaleString("ru-RU") + " ₽";

const CabinetDashboard = ({ setTab }: CabinetDashboardProps) => {
  const { batches, stages } = useClientAuth();
  const [creating, setCreating] = useState(false);

  const allOrders = batches.flatMap(b => b.orders.map(o => ({ ...o, batchName: b.name })));
  const activeOrder = allOrders[0];
  const maxOrder = stages[stages.length - 1]?.sort_order || 1;
  const orderProgress = activeOrder ? Math.round((activeOrder.stage_order / maxOrder) * 100) : 0;

  const totalVolume = allOrders.reduce((s, d) => s + (d.volume || 0), 0);
  const totalAmount = allOrders.reduce((s, d) => s + (d.amount || 0), 0);

  // Новый клиент без единой партии — сразу форма создания
  if (batches.length === 0 && !creating) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-primary/8 text-primary flex items-center justify-center mx-auto mb-4">
          <Icon name="PackagePlus" size={28} />
        </div>
        <h2 className="font-serif text-xl font-bold mb-2">Создайте первую партию</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Партия — это ваш продукт под собственным именем. Выберите зерно, обжарку, упаковку — и закажите первую пробную партию.
        </p>
        <button onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all active:scale-95">
          <Icon name="Plus" size={16} /> Создать партию
        </button>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setCreating(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <Icon name="ArrowLeft" size={14} /> Назад
        </button>
        <h2 className="font-serif text-xl font-bold mb-4">Новая партия</h2>
        <OrderForm onDone={() => { setCreating(false); setTab("batches"); }} onCancel={() => setCreating(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HERO — активный заказ */}
      {activeOrder ? (
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-[260px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600">
                  {activeOrder.stage_name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  Заказ №{activeOrder.id}
                </span>
              </div>
              <p className="font-serif text-2xl font-bold">{activeOrder.batchName}</p>
              {activeOrder.volume && (
                <p className="text-sm text-muted-foreground mt-0.5">{activeOrder.volume} кг</p>
              )}

              <div className="mt-5">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                    style={{ width: `${orderProgress}%` }} />
                </div>
              </div>

              {/* Этапы-точки */}
              <div className="flex items-center gap-1 mt-4 overflow-x-auto">
                {stages.map((s, i) => {
                  const state = s.sort_order < activeOrder.stage_order ? "done"
                    : s.sort_order === activeOrder.stage_order ? "now" : "next";
                  return (
                    <div key={s.id} className="flex items-center flex-shrink-0">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          state === "done" ? "bg-green-500/15 text-green-600"
                          : state === "now" ? "bg-amber-500/15 text-amber-600 ring-2 ring-amber-400/40"
                          : "bg-secondary text-muted-foreground"
                        }`}>
                          {state === "done" ? <Icon name="Check" size={12} /> : i + 1}
                        </div>
                        <span className={`text-[9px] font-mono whitespace-nowrap ${
                          state === "now" ? "text-amber-600 font-semibold" : "text-muted-foreground"
                        }`}>{s.name}</span>
                      </div>
                      {i < stages.length - 1 && (
                        <div className={`w-6 h-0.5 mb-4 ${s.sort_order < activeOrder.stage_order ? "bg-green-500/40" : "bg-border"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <p className="font-serif text-3xl font-bold" style={{ color: activeOrder.stage_color }}>{orderProgress}%</p>
                <p className="text-[11px] text-muted-foreground">готовность</p>
              </div>
              <button onClick={() => setTab("batches")}
                className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                Открыть партию <Icon name="ArrowRight" size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
          Активных заказов пока нет
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Партий", val: String(batches.length), hint: "уникальных продуктов" },
          { label: "Всего заказов", val: String(allOrders.length), hint: "за всё время" },
          { label: "Общий объём", val: `${totalVolume.toLocaleString("ru-RU")} кг`, hint: "с начала работы" },
          { label: "Сумма", val: formatMoney(totalAmount), hint: "за всё время" },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[11px] text-muted-foreground">{k.label}</p>
            <p className="font-serif text-2xl font-bold mt-1">{k.val}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Быстрые действия */}
      <div className="grid md:grid-cols-3 gap-3">
        <button onClick={() => setTab("batches")}
          className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/40 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-primary/8 text-primary flex items-center justify-center flex-shrink-0">
            <Icon name="Package" size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Мои партии</p>
            <p className="text-[11px] text-muted-foreground truncate">{batches.length} партий продукта</p>
          </div>
        </button>
        <button onClick={() => setTab("docs")}
          className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/40 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Icon name="FileText" size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Документы</p>
            <p className="text-[11px] text-muted-foreground truncate">Счета, УПД, акты</p>
          </div>
        </button>
        <button onClick={() => setTab("chat")}
          className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/40 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center flex-shrink-0">
            <Icon name="MessageCircle" size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Написать менеджеру</p>
            <p className="text-[11px] text-muted-foreground truncate">{MANAGER.name}</p>
          </div>
        </button>
      </div>

      {/* Последние заказы */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <p className="font-semibold text-sm">Последние заказы</p>
          <button onClick={() => setTab("batches")} className="text-xs text-primary hover:text-primary/80 transition-colors">
            Все партии →
          </button>
        </div>
        {allOrders.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Заказов пока нет</p>
        ) : (
          <div className="divide-y divide-border">
            {allOrders.slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center justify-between gap-3 px-5 py-3.5 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{d.batchName}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">№{d.id} · {new Date(d.created_at).toLocaleDateString("ru-RU")}</p>
                </div>
                <span className="text-sm font-mono text-muted-foreground">{d.volume ? `${d.volume} кг` : "—"}</span>
                <span className="text-sm font-mono text-muted-foreground">{d.amount ? formatMoney(d.amount) : "—"}</span>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full text-white" style={{ background: d.stage_color }}>
                  {d.stage_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Менеджер */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="font-semibold text-sm mb-3">Ваш менеджер</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
            {MANAGER.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{MANAGER.name}</p>
            <p className="text-[11px] text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Онлайн сейчас
            </p>
          </div>
          <button onClick={() => setTab("chat")}
            className="text-xs font-medium text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors flex-shrink-0">
            Написать
          </button>
        </div>
      </div>
    </div>
  );
};

export default CabinetDashboard;
