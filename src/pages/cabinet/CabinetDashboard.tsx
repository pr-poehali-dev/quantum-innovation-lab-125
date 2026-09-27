import Icon from "@/components/ui/icon";
import { DOCS, MANAGER, type Tab } from "./cabinet.types";
import type { ClientDeal, ClientStage } from "@/context/ClientAuthContext";

interface CabinetDashboardProps {
  deals: ClientDeal[];
  stages: ClientStage[];
  setTab: (t: Tab) => void;
}

const formatMoney = (n: number) => n.toLocaleString("ru-RU") + " ₽";

const CabinetDashboard = ({ deals, stages, setTab }: CabinetDashboardProps) => {
  const activeDeal = deals[0];
  const maxOrder = stages[stages.length - 1]?.sort_order || 1;
  const dealProgress = activeDeal ? Math.round((activeDeal.stage_order / maxOrder) * 100) : 0;

  const totalVolume = deals.reduce((s, d) => s + (d.volume || 0), 0);
  const totalAmount = deals.reduce((s, d) => s + (d.amount || 0), 0);

  return (
    <div className="space-y-6">

      {/* HERO — активная сделка */}
      {activeDeal ? (
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex-1 min-w-[260px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600">
                  {activeDeal.stage_name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  Заказ №{activeDeal.id}
                </span>
              </div>
              <p className="font-serif text-2xl font-bold">{activeDeal.brand || `Заказ №${activeDeal.id}`}</p>
              {activeDeal.volume && (
                <p className="text-sm text-muted-foreground mt-0.5">{activeDeal.volume} кг</p>
              )}

              <div className="mt-5">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                    style={{ width: `${dealProgress}%` }} />
                </div>
              </div>

              {/* Этапы-точки */}
              <div className="flex items-center gap-1 mt-4 overflow-x-auto">
                {stages.map((s, i) => {
                  const state = s.sort_order < activeDeal.stage_order ? "done"
                    : s.sort_order === activeDeal.stage_order ? "now" : "next";
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
                        <div className={`w-6 h-0.5 mb-4 ${s.sort_order < activeDeal.stage_order ? "bg-green-500/40" : "bg-border"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <p className="font-serif text-3xl font-bold" style={{ color: activeDeal.stage_color }}>{dealProgress}%</p>
                <p className="text-[11px] text-muted-foreground">готовность</p>
              </div>
              <button onClick={() => setTab("batch")}
                className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                Открыть партию <Icon name="ArrowRight" size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
          Активных сделок пока нет
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Всего заказов", val: String(deals.length), hint: "за всё время" },
          { label: "Общий объём", val: `${totalVolume.toLocaleString("ru-RU")} кг`, hint: "с начала работы" },
          { label: "Сумма", val: formatMoney(totalAmount), hint: "за всё время" },
          { label: "Документов", val: String(DOCS.length), hint: "счета, УПД, акты" },
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
        <button onClick={() => setTab("reorder")}
          className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/40 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-primary/8 text-primary flex items-center justify-center flex-shrink-0">
            <Icon name="RefreshCw" size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Повторить партию</p>
            <p className="text-[11px] text-muted-foreground truncate">{activeDeal?.brand || "Быстрый повтор заказа"}</p>
          </div>
        </button>
        <button onClick={() => setTab("docs")}
          className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/40 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Icon name="FileText" size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Документы</p>
            <p className="text-[11px] text-muted-foreground truncate">{DOCS.length} файлов</p>
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
          <button onClick={() => setTab("docs")} className="text-xs text-primary hover:text-primary/80 transition-colors">
            Все заказы →
          </button>
        </div>
        {deals.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Заказов пока нет</p>
        ) : (
          <div className="divide-y divide-border">
            {deals.slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center justify-between gap-3 px-5 py-3.5 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{d.brand || `Заказ №${d.id}`}</p>
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

      {/* Документы + менеджер */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <p className="font-semibold text-sm">Документы</p>
            <button onClick={() => setTab("docs")} className="text-xs text-primary hover:text-primary/80 transition-colors">Все →</button>
          </div>
          <div className="divide-y divide-border">
            {DOCS.slice(0, 3).map((d, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                  <Icon name="FileText" size={14} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{d.name}</p>
                  <p className="text-[11px] text-muted-foreground">{d.type} · {d.size}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

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
          <div className="mt-3 bg-secondary/40 rounded-xl px-3.5 py-2.5 text-[12px] text-muted-foreground">
            <strong className="text-foreground">{MANAGER.name.split(" ")[0]}</strong> — {MANAGER.messages[MANAGER.messages.length - 1].text}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CabinetDashboard;
