import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { ProductBatch } from "@/context/ClientAuthContext";
import { useClientAuth } from "@/context/ClientAuthContext";

interface Props {
  batch: ProductBatch;
  onOpenDeal: (dealId: number) => void;
}

const formatMoney = (n: number | null) => n ? `${n.toLocaleString("ru-RU")} ₽` : "—";
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

const CabinetBatchDetail = ({ batch, onOpenDeal }: Props) => {
  const { createDraftDeal } = useClientAuth();
  const [creating, setCreating] = useState(false);

  const handleCreateDeal = async () => {
    setCreating(true);
    const res = await createDraftDeal(batch.id);
    setCreating(false);
    if (res.ok && res.dealId) onOpenDeal(res.dealId);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h2 className="font-serif text-2xl font-bold">{batch.name}</h2>
          <p className="text-[12px] text-muted-foreground font-mono mt-0.5">
            Создана {formatDate(batch.created_at)} · {batch.deals.length} {batch.deals.length === 1 ? "заказ" : "заказов"}
          </p>
        </div>
        <button onClick={handleCreateDeal} disabled={creating}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60">
          {creating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Plus" size={15} />}
          Новый заказ
        </button>
      </div>

      {batch.deals.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">
          В этой партии пока нет заказов
        </div>
      ) : (
        <div className="space-y-3">
          {batch.deals.map((deal, i) => {
            const isLatest = i === 0;
            const orderNumber = batch.deals.length - i;
            const totalAmount = deal.lots.reduce((s, l) => s + (l.amount || 0), 0);
            const totalVolume = deal.lots.reduce((s, l) => s + (l.volume || 0), 0);
            return (
              <button key={deal.id} onClick={() => onOpenDeal(deal.id)}
                className="w-full bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/40 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/8 text-primary flex items-center justify-center flex-shrink-0">
                      <Icon name="Package" size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold">Заказ {orderNumber}</p>
                        {isLatest && (
                          <span className="text-[9px] font-mono bg-primary/15 text-primary rounded-full px-1.5 py-0.5">ПОСЛЕДНИЙ</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono">{formatDate(deal.created_at)} · {deal.lots.length} {deal.lots.length === 1 ? "лот" : "лотов"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {deal.status === "draft" ? (
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">Черновик</span>
                    ) : (
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full text-white" style={{ background: deal.stage_color || "#64748b" }}>
                        {deal.stage_name}
                      </span>
                    )}
                    <span className="text-sm font-mono text-muted-foreground">{totalVolume ? `${totalVolume} кг` : "—"}</span>
                    <span className="text-sm font-mono font-semibold">{formatMoney(totalAmount)}</span>
                    <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CabinetBatchDetail;