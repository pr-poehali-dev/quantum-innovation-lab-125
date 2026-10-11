import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { useClientAuth } from "@/context/ClientAuthContext";
import { formatRub } from "@/lib/calcCore";

interface Props {
  onResume: (dealId: number) => void;
  onNew: () => void;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) + ", " +
  new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const CabinetDrafts = ({ onResume, onNew }: Props) => {
  const { batches, setDraftTrashed } = useClientAuth();
  const [showTrash, setShowTrash] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const all = useMemo(
    () => batches.flatMap(b => b.deals.filter(d => d.status === "draft").map(d => ({ ...d, batchName: b.name }))),
    [batches],
  );
  const drafts = all.filter(d => !d.draft_trashed_at);
  const trashed = all.filter(d => d.draft_trashed_at);

  const act = async (id: number, trash: boolean) => {
    setBusyId(id);
    const res = await setDraftTrashed(id, trash);
    setBusyId(null);
    setToast(res.ok ? (trash ? "Черновик перенесён в корзину" : "Черновик возвращён") : res.error || "Ошибка");
    setTimeout(() => setToast(""), 2500);
  };

  const Row = ({ d, inTrash }: { d: (typeof all)[number]; inTrash: boolean }) => {
    const amount = d.lots.reduce((s, l) => s + (l.amount || 0), 0);
    const volume = d.lots.reduce((s, l) => s + (l.volume || 0), 0);
    return (
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{d.batchName}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {d.lots.length ? `${d.lots.length} ${d.lots.length === 1 ? "позиция" : d.lots.length < 5 ? "позиции" : "позиций"} · ${volume.toLocaleString("ru-RU")} кг` : "Состав пока пуст"}
            </p>
            <p className="text-[11px] text-muted-foreground/70 font-mono mt-1">
              {inTrash && d.draft_trashed_at ? `Удалён ${fmtDate(d.draft_trashed_at)}` : `Создан ${fmtDate(d.created_at)}`}
            </p>
          </div>
          <p className="font-serif text-lg font-bold flex-shrink-0">{amount ? formatRub(amount) : "—"}</p>
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60">
          {inTrash ? (
            <button onClick={() => act(d.id, false)} disabled={busyId === d.id}
              className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-medium text-primary border border-primary/30 rounded-xl py-2.5 hover:bg-primary/5 transition-colors disabled:opacity-60">
              <Icon name="Undo2" size={14} /> Вернуть
            </button>
          ) : (
            <>
              <button onClick={() => onResume(d.id)}
                className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold bg-primary text-primary-foreground rounded-xl py-2.5 hover:bg-primary/90 transition-colors">
                <Icon name="Play" size={13} /> Продолжить
              </button>
              <button onClick={() => act(d.id, true)} disabled={busyId === d.id} aria-label="В корзину"
                className="w-11 h-10 flex items-center justify-center border border-border rounded-xl text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all disabled:opacity-60">
                <Icon name="Trash2" size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium">{toast}</div>
      )}

      <div className="mb-5">
        <h2 className="font-serif text-2xl font-bold">Черновики заявок</h2>
        <p className="text-sm text-muted-foreground mt-1">Незавершённые заказы. Продолжите с того места, где остановились.</p>
      </div>

      {drafts.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
          <Icon name="FilePen" size={28} className="text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Черновиков нет</p>
          <button onClick={onNew}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
            <Icon name="Plus" size={15} /> Новый заказ
          </button>
        </div>
      ) : (
        <div className="space-y-3">{drafts.map(d => <Row key={d.id} d={d} inTrash={false} />)}</div>
      )}

      <div className="mt-6 bg-card border border-border rounded-2xl overflow-hidden">
        <button onClick={() => setShowTrash(o => !o)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors text-left">
          <span className="flex items-center gap-2.5 text-sm font-semibold">
            <Icon name="Trash2" size={15} className="text-muted-foreground" /> Корзина
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[11px] font-mono bg-secondary text-muted-foreground rounded-full px-2 py-0.5">{trashed.length}</span>
            <Icon name={showTrash ? "ChevronUp" : "ChevronDown"} size={15} className="text-muted-foreground" />
          </span>
        </button>
        {showTrash && (
          <div className="border-t border-border p-3 space-y-3">
            {trashed.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-6">Корзина пуста</p>
              : trashed.map(d => <Row key={d.id} d={d} inTrash />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CabinetDrafts;
