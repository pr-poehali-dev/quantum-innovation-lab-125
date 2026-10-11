import Icon from "@/components/ui/icon";
import { useClientAuth } from "@/context/ClientAuthContext";
import { formatRub } from "@/lib/calcCore";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

interface Props {
  onOpenBatch: (batchId: number) => void;
  onNew: () => void;
}

const CabinetBatches = ({ onOpenBatch, onNew }: Props) => {
  const { batches } = useClientAuth();
  const visible = batches.filter(b => b.deals.some(d => d.status === "submitted" && !d.draft_trashed_at));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="font-serif text-2xl font-bold">Мои партии</h2>
        <button onClick={onNew}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95">
          <Icon name="Plus" size={15} /> <span className="hidden min-[380px]:inline">Новый заказ</span>
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
          <Icon name="Package" size={28} className="text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-semibold text-sm mb-1">Пока нет отправленных партий</p>
          <p className="text-[13px] text-muted-foreground mb-5">Соберите первый заказ — это займёт пару минут</p>
          <button onClick={onNew}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
            <Icon name="Plus" size={15} /> Новый заказ
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {visible.map(batch => {
            const deal = batch.deals.find(d => d.status === "submitted")!;
            const amount = deal.lots.reduce((s, l) => s + (l.amount || 0), 0);
            const volume = deal.lots.reduce((s, l) => s + (l.volume || 0), 0);
            return (
              <button key={batch.id} onClick={() => onOpenBatch(batch.id)}
                className="bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/40 hover:shadow-sm transition-all active:scale-[0.99]">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-serif text-lg font-bold truncate">{batch.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Отправлена {formatDate(deal.created_at)}</p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full text-white" style={{ background: deal.stage_color || "#64748b" }}>
                    {deal.stage_name}
                  </span>
                  <span className="text-[12px] text-muted-foreground">{deal.lots.length} поз. · {volume.toLocaleString("ru-RU")} кг</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                  {deal.docs_total > 0 ? (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Icon name="FileCheck" size={12} /> Документы {deal.docs_done}/{deal.docs_total}
                    </span>
                  ) : <span />}
                  <span className="font-serif text-lg font-bold">{amount ? formatRub(amount) : "—"}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CabinetBatches;
