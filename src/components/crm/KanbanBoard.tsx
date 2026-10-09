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
import Icon from "@/components/ui/icon";
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
  batch_name: string | null;
  lots_count: number | null;
  lots_summary: string | null;
  lots_volume: number | null;
  lots_amount: number | null;
  is_new: boolean;
}

interface Stage {
  id: number;
  name: string;
  sort_order: number;
  color: string;
}

interface Props {
  onOpenDeal: (dealId: number) => void;
  showToast: (msg: string, ok?: boolean) => void;
  refreshSignal?: number;
}

interface TrashedDeal {
  id: number;
  batch_name: string | null;
  brand: string | null;
  client_id: number;
  client_name: string;
  stage_name: string;
  stage_color: string;
  trashed_at: string;
  trashed_by: string | null;
  amount: number | null;
  volume: number | null;
}

interface PendingMove {
  deal: Deal;
  toStage: Stage;
}

const KanbanBoard = ({ onOpenDeal, showToast, refreshSignal }: Props) => {
  const { token } = useStaffAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [moving, setMoving] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<number | null>(null);
  const [trash, setTrash] = useState<TrashedDeal[]>([]);
  const [trashOpen, setTrashOpen] = useState(false);
  const [pendingTrash, setPendingTrash] = useState<Deal | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const draggedDealId = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const authHeaders = { "X-Staff-Token": token || "" };

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(CRM_URL, { headers: { "X-Action": "list-deals", ...authHeaders } }).then(r => r.json()),
      fetch(CRM_URL, { headers: { "X-Action": "list-stages", ...authHeaders } }).then(r => r.json()),
      fetch(CRM_URL, { headers: { "X-Action": "list-trash", ...authHeaders } }).then(r => r.json()),
    ]).then(([d, s, t]) => {
      setDeals(d.deals || []);
      setStages(s.stages || []);
      setTrash(t.deals || []);
    }).catch(() => showToast("Ошибка загрузки канбана", false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (token) load(); }, [token, refreshSignal]);

  const formatMoney = (n: number | null) => n ? `${n.toLocaleString("ru-RU")} ₽` : "—";

  const scrollBy = (dx: number) => {
    scrollRef.current?.scrollBy({ left: dx, behavior: "smooth" });
  };

  const handleDrop = (stage: Stage) => {
    setDragOverStage(null);
    const dealId = draggedDealId.current;
    draggedDealId.current = null;
    if (dealId === null) return;
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage_id === stage.id) return;
    setPendingMove({ deal, toStage: stage });
  };

  const dealTitle = (d: { batch_name: string | null; brand: string | null; id: number }) =>
    d.batch_name || d.brand || `Партия №${d.id}`;

  const callDeal = async (action: "trash-deal" | "restore-deal", dealId: number, okMsg: string) => {
    setBusyId(dealId);
    try {
      const r = await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": action, ...authHeaders },
        body: JSON.stringify({ deal_id: dealId }),
      });
      if (r.ok) { showToast(okMsg); load(); }
      else { const d = await r.json(); showToast(d.error || "Ошибка", false); }
    } catch {
      showToast("Ошибка сети", false);
    } finally {
      setBusyId(null);
      setPendingTrash(null);
    }
  };

  const formatTrashDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) + ", " +
      d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
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
      {/* Панель перемотки сверху — не даёт канбану "уезжать" при длинных списках */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-muted-foreground hidden sm:block">
          Перетаскивайте карточки между этапами или листайте колонки стрелками
        </p>
        <div className="flex items-center gap-1.5 ml-auto">
          <button onClick={() => scrollBy(-320)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-secondary/60 hover:border-primary/40 transition-all">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <button onClick={() => scrollBy(320)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-secondary/60 hover:border-primary/40 transition-all">
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 scroll-smooth">
        {stages.map(stage => {
          const stageDeals = deals.filter(d => d.stage_id === stage.id);
          const isDragOver = dragOverStage === stage.id;
          return (
            <div
              key={stage.id}
              className={`flex-shrink-0 w-72 rounded-2xl transition-colors flex flex-col ${isDragOver ? "bg-primary/5" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id); }}
              onDragLeave={() => setDragOverStage(prev => (prev === stage.id ? null : prev))}
              onDrop={e => { e.preventDefault(); handleDrop(stage); }}
            >
              <div className="flex items-center gap-2 px-2 mb-3 flex-shrink-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                <span className="text-sm font-semibold">{stage.name}</span>
                <span className="text-[11px] font-mono text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5">
                  {stageDeals.length}
                </span>
              </div>

              <div
                className={`space-y-2 min-h-[80px] rounded-xl transition-all overflow-y-auto pr-0.5 ${isDragOver ? "ring-2 ring-primary/30 ring-inset" : ""}`}
                style={{ maxHeight: "calc(100vh - 320px)" }}
              >
                {stageDeals.map(deal => {
                  const totalAmount = deal.lots_amount ?? deal.amount;
                  const totalVolume = deal.lots_volume ?? deal.volume;
                  return (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => { draggedDealId.current = deal.id; }}
                    onDragEnd={() => { draggedDealId.current = null; setDragOverStage(null); }}
                    onClick={() => onOpenDeal(deal.id)}
                    className={`bg-card border rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:border-primary/40 hover:shadow-sm transition-all relative ${
                      deal.is_new ? "border-primary/50 ring-1 ring-primary/20" : "border-border"
                    }`}
                  >
                    {deal.is_new && (
                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-primary ring-2 ring-white" title="Новая партия" />
                    )}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold leading-tight truncate">
                        {deal.batch_name || deal.brand || `Партия №${deal.id}`}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0 -mr-1 -mt-1">
                        <span className="text-[10px] font-mono text-muted-foreground">#{deal.id}</span>
                        <button
                          onClick={e => { e.stopPropagation(); setPendingTrash(deal); }}
                          draggable={false}
                          title="Удалить в корзину"
                          aria-label="Удалить в корзину"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[12px] text-muted-foreground mb-1.5 truncate">{deal.client_name}</p>
                    {deal.lots_summary && (
                      <p className="text-[11px] text-foreground/80 mb-1.5 truncate">{deal.lots_summary}</p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
                      {deal.client_city && <span>{deal.client_city}</span>}
                      {totalVolume ? <span>· {totalVolume} кг</span> : null}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{formatMoney(totalAmount)}</span>
                      {deal.assigned_name ? (
                        <span className="text-[10px] font-medium bg-primary/8 text-primary rounded-full px-2 py-0.5 truncate max-w-[100px]">
                          {deal.assigned_name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60">без менеджера</span>
                      )}
                    </div>
                  </div>
                  );
                })}
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

      {/* Корзина сделок — на той же странице */}
      <div className="mt-6 bg-card border border-border rounded-2xl overflow-hidden">
        <button onClick={() => setTrashOpen(o => !o)}
          className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 hover:bg-secondary/30 transition-colors text-left">
          <span className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
              <Icon name="Trash2" size={15} />
            </span>
            <span>
              <span className="block text-sm font-semibold">Корзина</span>
              <span className="block text-[11px] text-muted-foreground">Удалённые сделки можно вернуть на доску</span>
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[11px] font-mono bg-secondary text-muted-foreground rounded-full px-2 py-0.5">{trash.length}</span>
            <Icon name={trashOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground" />
          </span>
        </button>

        {trashOpen && (
          <div className="border-t border-border">
            {trash.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Корзина пуста</p>
            ) : (
              <div className="divide-y divide-border">
                {trash.map(t => (
                  <div key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{dealTitle(t)}</p>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: t.stage_color }}>
                          {t.stage_name}
                        </span>
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-0.5 truncate">
                        {t.client_name}
                        {t.volume ? ` · ${t.volume} кг` : ""}
                        {t.amount ? ` · ${formatMoney(t.amount)}` : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                        Удалена {formatTrashDate(t.trashed_at)}{t.trashed_by ? ` · ${t.trashed_by}` : ""}
                      </p>
                    </div>
                    <button onClick={() => callDeal("restore-deal", t.id, "Сделка возвращена на доску ✓")} disabled={busyId === t.id}
                      className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-primary border border-primary/30 rounded-xl px-4 py-2 hover:bg-primary/5 transition-colors disabled:opacity-60 sm:flex-shrink-0">
                      {busyId === t.id
                        ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        : <Icon name="Undo2" size={14} />}
                      Вернуть
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={pendingTrash !== null} onOpenChange={open => !open && busyId === null && setPendingTrash(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сделку?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingTrash && (
                <>
                  <strong>{dealTitle(pendingTrash)}</strong> ({pendingTrash.client_name}) уйдёт в корзину и пропадёт с доски и из кабинета клиента.
                  Вернуть её можно в любой момент из корзины под доской.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId !== null}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={e => { e.preventDefault(); if (pendingTrash) callDeal("trash-deal", pendingTrash.id, "Сделка перенесена в корзину"); }}
              disabled={busyId !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {busyId !== null ? "Удаляем…" : "В корзину"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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