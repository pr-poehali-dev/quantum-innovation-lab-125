import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useClientAuth } from "@/context/ClientAuthContext";

const formatMoney = (n: number) => n ? `${n.toLocaleString("ru-RU")} ₽` : "—";
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

interface Props {
  onOpenBatch: (batchId: number) => void;
}

const CabinetBatches = ({ onOpenBatch }: Props) => {
  const { batches, createBatch } = useClientAuth();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) { setError("Введите название партии"); return; }
    setSubmitting(true);
    setError("");
    const res = await createBatch(newName.trim());
    setSubmitting(false);
    if (res.ok) { setCreating(false); setNewName(""); }
    else setError(res.error || "Не удалось создать партию");
  };

  if (creating) {
    return (
      <div className="max-w-md">
        <button onClick={() => setCreating(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <Icon name="ArrowLeft" size={14} /> Назад к партиям
        </button>
        <h2 className="font-serif text-xl font-bold mb-1">Новая партия</h2>
        <p className="text-sm text-muted-foreground mb-4">Партия — это ваш продукт под собственным именем. Например: NORD ROAST.</p>
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
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-xl font-bold">Мои партии</h2>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95">
          <Icon name="Plus" size={15} /> Новая партия
        </button>
      </div>

      {batches.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
          <Icon name="Package" size={28} className="text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">У вас пока нет партий продукта</p>
          <button onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
            <Icon name="Plus" size={15} /> Создать первую партию
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {batches.map(batch => {
            const lastDeal = batch.deals[0];
            const totalDeals = batch.deals.length;
            const totalAmount = lastDeal ? lastDeal.lots.reduce((s, l) => s + (l.amount || 0), 0) : 0;
            const totalVolume = lastDeal ? lastDeal.lots.reduce((s, l) => s + (l.volume || 0), 0) : 0;
            return (
              <button key={batch.id} onClick={() => onOpenBatch(batch.id)}
                className="bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/40 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-serif text-lg font-bold truncate">{batch.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Партия создана {formatDate(batch.created_at)}</p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
                </div>

                {lastDeal ? (
                  <div className="flex items-center justify-between">
                    {lastDeal.status === "draft" ? (
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">Черновик</span>
                    ) : (
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full text-white" style={{ background: lastDeal.stage_color || "#64748b" }}>
                        {lastDeal.stage_name}
                      </span>
                    )}
                    <span className="text-sm font-mono text-muted-foreground">
                      {totalDeals} {totalDeals === 1 ? "заказ" : totalDeals < 5 ? "заказа" : "заказов"}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Нет заказов</p>
                )}

                {lastDeal && (
                  <div className="flex items-center gap-3 mt-2 text-[12px] text-muted-foreground">
                    {totalVolume > 0 && <span>{totalVolume} кг</span>}
                    {totalAmount > 0 && <span>· {formatMoney(totalAmount)}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CabinetBatches;
