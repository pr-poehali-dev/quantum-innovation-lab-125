import { useState, useEffect, useRef } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useStaffAuth } from "@/context/StaffAuthContext";

const CRM_URL = "https://functions.poehali.dev/0fbf69fe-e1ba-4899-a9c0-98d37524abe1";

interface Deal {
  id: number;
  brand: string | null;
  volume: number | null;
  amount: number | null;
  stage_id: number;
  stage_name: string;
  stage_color: string;
  stage_order: number;
  created_at: string;
  updated_at: string;
  assigned_to: number | null;
  assigned_name: string | null;
  client_id: number;
  client_name: string;
  client_phone: string | null;
  client_city: string | null;
}

interface Stage {
  id: number;
  name: string;
  sort_order: number;
  color: string;
}

interface Props {
  onOpenClient: (clientId: number) => void;
  showToast: (msg: string, ok?: boolean) => void;
  refreshSignal?: number;
}

interface PendingMove {
  deal: Deal;
  toStage: Stage;
}

const KanbanBoard = ({ onOpenClient, showToast, refreshSignal }: Props) => {
  const { token } = useStaffAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [moving, setMoving] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<number | null>(null);
  const draggedDealId = useRef<number | null>(null);

  const authHeaders = { "X-Staff-Token": token || "" };

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(CRM_URL, { headers: { "X-Action": "list-deals", ...authHeaders } }).then(r => r.json()),
      fetch(CRM_URL, { headers: { "X-Action": "list-stages", ...authHeaders } }).then(r => r.json()),
    ]).then(([d, s]) => {
      setDeals(d.deals || []);
      setStages(s.stages || []);
    }).catch(() => showToast("Ошибка загрузки канбана", false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (token) load(); }, [token, refreshSignal]);

  const formatMoney = (n: number | null) => n ? `${n.toLocaleString("ru-RU")} ₽` : "—";

  const handleDrop = (stage: Stage) => {
    setDragOverStage(null);
    const dealId = draggedDealId.current;
    draggedDealId.current = null;
    if (dealId === null) return;
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage_id === stage.id) return;
    setPendingMove({ deal, toStage: stage });
  };

  const confirmMove = async () => {
    if (!pendingMove) return;
    setMoving(true);
    try {
      const r = await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "update-deal-stage", ...authHeaders },
        body: JSON.stringify({ deal_id: pendingMove.deal.id, stage_id: pendingMove.toStage.id }),
      });
      if (r.ok) {
        showToast(`Сделка перемещена на этап «${pendingMove.toStage.name}» ✓`);
        load();
      } else {
        const d = await r.json();
        showToast(d.error || "Ошибка перемещения", false);
      }
    } catch {
      showToast("Ошибка сети", false);
    } finally {
      setMoving(false);
      setPendingMove(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
        {stages.map(stage => {
          const stageDeals = deals.filter(d => d.stage_id === stage.id);
          const isDragOver = dragOverStage === stage.id;
          return (
            <div
              key={stage.id}
              className={`flex-shrink-0 w-72 rounded-2xl transition-colors ${isDragOver ? "bg-primary/5" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id); }}
              onDragLeave={() => setDragOverStage(prev => (prev === stage.id ? null : prev))}
              onDrop={e => { e.preventDefault(); handleDrop(stage); }}
            >
              <div className="flex items-center gap-2 px-2 mb-3">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                <span className="text-sm font-semibold">{stage.name}</span>
                <span className="text-[11px] font-mono text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5">
                  {stageDeals.length}
                </span>
              </div>

              <div className={`space-y-2 min-h-[80px] rounded-xl transition-all ${isDragOver ? "ring-2 ring-primary/30 ring-inset" : ""}`}>
                {stageDeals.map(deal => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => { draggedDealId.current = deal.id; }}
                    onDragEnd={() => { draggedDealId.current = null; setDragOverStage(null); }}
                    onClick={() => onOpenClient(deal.client_id)}
                    className="bg-card border border-border rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-semibold leading-tight">{deal.client_name}</p>
                      <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">#{deal.id}</span>
                    </div>
                    {deal.brand && <p className="text-[12px] text-muted-foreground mb-1.5">{deal.brand}</p>}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
                      {deal.client_city && <span>{deal.client_city}</span>}
                      {deal.volume && <span>· {deal.volume} кг</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{formatMoney(deal.amount)}</span>
                      {deal.assigned_name ? (
                        <span className="text-[10px] font-medium bg-primary/8 text-primary rounded-full px-2 py-0.5 truncate max-w-[100px]">
                          {deal.assigned_name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60">без менеджера</span>
                      )}
                    </div>
                  </div>
                ))}
                {stageDeals.length === 0 && (
                  <div className="border border-dashed border-border rounded-xl py-6 text-center text-[11px] text-muted-foreground/60">
                    Нет сделок
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={pendingMove !== null} onOpenChange={open => !open && !moving && setPendingMove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Переместить сделку?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingMove && (
                <>
                  <strong>{pendingMove.deal.client_name}</strong>
                  {pendingMove.deal.brand ? ` · ${pendingMove.deal.brand}` : ""} — этап изменится
                  {" "}с «{pendingMove.deal.stage_name}» на «{pendingMove.toStage.name}».
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={moving}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMove} disabled={moving}>
              {moving ? "Сохраняем…" : "Подтвердить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default KanbanBoard;