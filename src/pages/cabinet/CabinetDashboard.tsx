import { useState } from "react";
import Icon from "@/components/ui/icon";
import { type Tab } from "./cabinet.types";
import { useClientAuth } from "@/context/ClientAuthContext";
import ManagerCard from "@/components/cabinet/ManagerCard";

interface CabinetDashboardProps {
  setTab: (t: Tab) => void;
  openDeal: (batchId: number, dealId: number) => void;
}

const formatMoney = (n: number) => n.toLocaleString("ru-RU") + " ₽";

const CabinetDashboard = ({ setTab, openDeal }: CabinetDashboardProps) => {
  const { batches, stages, createBatch } = useClientAuth();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [managerOpen, setManagerOpen] = useState(false);

  const allDeals = batches.flatMap(b => b.deals.map(d => ({ ...d, batchId: b.id, batchName: b.name })));
  const submittedDeals = allDeals.filter(d => d.status === "submitted");
  const activeDeal = submittedDeals[0];
  const activeStageOrder = activeDeal ? stages.find(s => s.id === activeDeal.stage_id)?.sort_order ?? 0 : 0;
  // Процент показываем только когда сделку хотя бы раз передвинули (не на первом этапе) и когда он явно задан менеджером
  const showProgress = !!activeDeal && activeStageOrder > (stages[0]?.sort_order ?? 1) && activeDeal.progress_percent !== null;
  const orderProgress = showProgress ? activeDeal!.progress_percent! : 0;

  const totalVolume = allDeals.reduce((s, d) => s + d.lots.reduce((ls, l) => ls + (l.volume || 0), 0), 0);
  const totalAmount = allDeals.reduce((s, d) => s + d.lots.reduce((ls, l) => ls + (l.amount || 0), 0), 0);

  const managerDeal = allDeals.find(d => d.assigned_name && d.assigned_to);
  const managerName = managerDeal?.assigned_name ?? null;
  const managerId = managerDeal?.assigned_to ?? null;
  const managerInitials = managerName
    ? managerName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "";

  const handleCreate = async () => {
    if (!newName.trim()) { setError("Введите название партии"); return; }
    setSubmitting(true);
    setError("");
    const res = await createBatch(newName.trim());
    setSubmitting(false);
    if (res.ok) { setTab("batches"); }
    else setError(res.error || "Не удалось создать партию");
  };

  if (batches.length === 0 && !creating) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-primary/8 text-primary flex items-center justify-center mx-auto mb-4">
          <Icon name="PackagePlus" size={28} />
        </div>
        <h2 className="font-serif text-xl font-bold mb-2">Создайте первую партию</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Партия — это ваш продукт под собственным именем. Внутри партии вы создаёте заказы с лотами — зерно, обжарка, упаковка, объём.
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
      <div className="max-w-md mx-auto">
        <button onClick={() => setCreating(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <Icon name="ArrowLeft" size={14} /> Назад
        </button>
        <h2 className="font-serif text-xl font-bold mb-4">Новая партия</h2>
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 tracking-wider">НАЗВАНИЕ ПАРТИИ</label>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="Например: NORD ROAST"
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors" />
          </div>
          {error && <p className="text-sm text-destructive flex items-center gap-1.5"><Icon name="AlertCircle" size={14} />{error}</p>}
          <button onClick={handleCreate} disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Check" size={16} />}
            Создать партию
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HERO — активный заказ */}
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
                  Активный заказ
                </span>
              </div>
              <p className="font-serif text-2xl font-bold">{activeDeal.batchName}</p>

              {showProgress && (
                <div className="mt-5">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                      style={{ width: `${orderProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Этапы-точки */}
              <div className="flex items-center gap-1 mt-4 overflow-x-auto">
                {stages.map((s, i) => {
                  const state = s.sort_order < activeStageOrder ? "done"
                    : s.sort_order === activeStageOrder ? "now" : "next";
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
                        <div className={`w-6 h-0.5 mb-4 ${s.sort_order < activeStageOrder ? "bg-green-500/40" : "bg-border"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              {showProgress && (
                <div className="text-right">
                  <p className="font-serif text-3xl font-bold" style={{ color: activeDeal.stage_color || undefined }}>{orderProgress}%</p>
                  <p className="text-[11px] text-muted-foreground">готовность</p>
                </div>
              )}
              <button onClick={() => openDeal(activeDeal.batchId, activeDeal.id)}
                className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                Открыть заказ <Icon name="ArrowRight" size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
          Активных заказов пока нет — отправьте черновик на согласование в разделе «Мои партии»
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Партий", val: String(batches.length), hint: "уникальных продуктов" },
          { label: "Всего заказов", val: String(allDeals.length), hint: "за всё время" },
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
            <p className="text-[11px] text-muted-foreground truncate">{managerName || "Задать вопрос"}</p>
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
        {allDeals.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Заказов пока нет</p>
        ) : (
          <div className="divide-y divide-border">
            {allDeals.slice(0, 5).map(d => {
              const dealAmount = d.lots.reduce((s, l) => s + (l.amount || 0), 0);
              const dealVolume = d.lots.reduce((s, l) => s + (l.volume || 0), 0);
              return (
                <button key={d.id} onClick={() => openDeal(d.batchId, d.id)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-3.5 flex-wrap hover:bg-secondary/20 transition-colors text-left">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{d.batchName}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{new Date(d.created_at).toLocaleDateString("ru-RU")}</p>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{dealVolume ? `${dealVolume} кг` : "—"}</span>
                  <span className="text-sm font-mono text-muted-foreground">{dealAmount ? formatMoney(dealAmount) : "—"}</span>
                  {d.status === "draft" ? (
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">Черновик</span>
                  ) : (
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full text-white" style={{ background: d.stage_color || "#64748b" }}>
                      {d.stage_name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Менеджер */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="font-semibold text-sm mb-3">Ваш менеджер</p>
        {managerName && managerId ? (
          <div className="flex items-center gap-3">
            <button onClick={() => setManagerOpen(true)} className="flex items-center gap-3 flex-1 min-w-0 text-left group">
              <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold flex-shrink-0">
                {managerInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{managerName}</p>
                <p className="text-[11px] text-muted-foreground">Ведёт ваши заказы · контакты</p>
              </div>
            </button>
            <button onClick={() => setTab("chat")}
              className="text-xs font-medium text-primary border border-primary/30 rounded-lg px-3 py-2 hover:bg-primary/5 transition-colors flex-shrink-0">
              Написать
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center flex-shrink-0">
              <Icon name="UserRoundSearch" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Менеджер ещё не назначен</p>
              <p className="text-[11px] text-muted-foreground">Назначим, как только начнём работу по заказу</p>
            </div>
          </div>
        )}
      </div>

      {managerOpen && managerId && (
        <ManagerCard staffId={managerId} fallbackName={managerName} onClose={() => setManagerOpen(false)} onWrite={() => setTab("chat")} />
      )}
    </div>
  );
};

export default CabinetDashboard;