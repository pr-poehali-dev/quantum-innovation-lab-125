import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useClientAuth } from "@/context/ClientAuthContext";
import { formatRub } from "@/lib/calcCore";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

interface Props {
  onOpenBatch: (batchId: number) => void;
  onNew: () => void;
}

const CabinetBatches = ({ onOpenBatch, onNew }: Props) => {
  const { batches, stages, deleteSubmitted } = useClientAuth();
  const [toDelete, setToDelete] = useState<{ dealId: number; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const firstStageId = [...stages].sort((a, b) => a.sort_order - b.sort_order)[0]?.id ?? null;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    const res = await deleteSubmitted(toDelete.dealId);
    setBusy(false);
    setToDelete(null);
    showToast(res.ok ? "Партия удалена" : res.error || "Не удалось удалить", res.ok);
  };

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
            const canDelete = firstStageId === null || deal.stage_id === firstStageId;
            return (
              <div key={batch.id} className="bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-sm transition-all flex flex-col">
              <button type="button" onClick={() => onOpenBatch(batch.id)}
                className="p-5 text-left active:scale-[0.995] transition-transform flex-1 rounded-2xl">
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
              {canDelete && (
                <div className="px-5 pb-4 -mt-1">
                  <button type="button" onClick={() => setToDelete({ dealId: deal.id, name: batch.name })}
                    className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-destructive transition-colors py-1.5">
                    <Icon name="Trash2" size={13} /> Удалить заявку
                  </button>
                </div>
              )}
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={o => { if (!o && !busy) setToDelete(null); }}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить партию «{toDelete?.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Заявка исчезнет из вашего списка, а менеджер перестанет её обрабатывать. Это можно сделать, пока заявку не взяли в работу.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={busy}>Оставить</AlertDialogCancel>
            <AlertDialogAction onClick={e => { e.preventDefault(); confirmDelete(); }} disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {busy ? "Удаляю…" : "Да, удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium max-w-[92vw] ${toast.ok ? "bg-green-500 text-white" : "bg-destructive text-white"}`}>
          <Icon name={toast.ok ? "Check" : "AlertCircle"} size={14} className="flex-shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

export default CabinetBatches;
