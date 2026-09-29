import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";
import { BAG_COLORS } from "@/components/calculator/calculator.types";

const CRM_URL = "https://functions.poehali.dev/0fbf69fe-e1ba-4899-a9c0-98d37524abe1";

interface StageHistory {
  stage_id: number;
  stage_name: string;
  staff_name: string;
  changed_at: string;
}

interface Lot {
  id: number;
  lot_number: number;
  origin_id: number | null;
  origin_label: string | null;
  roast: string | null;
  packaging: string | null;
  weight_format: string | null;
  color: string | null;
  volume: number | null;
  amount: number | null;
  note: string | null;
}

interface DealFull {
  id: number;
  brand: string | null;
  volume: number | null;
  amount: number | null;
  stage_id: number;
  stage_name: string;
  stage_color: string;
  created_at: string;
  updated_at: string;
  history: StageHistory[];
  assigned_to: number | null;
  assigned_name: string | null;
  status: string;
  logistics_data: Record<string, string>;
  batch_name: string | null;
  batch_id: number | null;
  client: { id: number; name: string; phone: string | null; email: string | null; city: string | null; company: string | null };
  lots: Lot[];
  lots_volume: number;
  lots_amount: number;
}

interface Stage {
  id: number;
  name: string;
  sort_order: number;
  color: string;
}

interface AssignableStaff {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Note {
  id: number;
  text: string;
  staff_name: string;
  created_at: string;
}

interface Props {
  dealId: number;
  onClose: () => void;
  onChanged: () => void;
  onOpenClient: (clientId: number) => void;
  showToast: (msg: string, ok?: boolean) => void;
}

const formatMoney = (n: number | null) => n ? `${n.toLocaleString("ru-RU")} ₽` : "—";
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) + " в " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};
const colorLabel = (v: string | null) => BAG_COLORS.find(c => c.value === v)?.label ?? v ?? "—";
const weightLabel = (v: string | null) => v === "250g" ? "250 г" : v === "1kg" ? "1 кг" : v ?? "—";

const DealDrawer = ({ dealId, onClose, onChanged, onOpenClient, showToast }: Props) => {
  const { token } = useStaffAuth();
  const [deal, setDeal] = useState<DealFull | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [assignable, setAssignable] = useState<AssignableStaff[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedHistory, setExpandedHistory] = useState(false);

  const authHeaders = { "X-Staff-Token": token || "" };

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(CRM_URL, { headers: { "X-Action": "get-deal", "X-Deal-Id": String(dealId), ...authHeaders } }).then(r => r.json()),
      fetch(CRM_URL, { headers: { "X-Action": "list-stages", ...authHeaders } }).then(r => r.json()),
      fetch(CRM_URL, { headers: { "X-Action": "list-assignable", ...authHeaders } }).then(r => r.json()),
      fetch(CRM_URL, { headers: { "X-Action": "list-deal-notes", "X-Deal-Id": String(dealId), ...authHeaders } }).then(r => r.json()),
    ]).then(([d, s, a, n]) => {
      setDeal(d.deal || null);
      setStages(s.stages || []);
      setAssignable(a.staff || []);
      setNotes(n.notes || []);
    }).catch(() => showToast("Ошибка загрузки партии", false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (token) load(); }, [token, dealId]);

  const changeStage = async (stageId: number) => {
    if (!deal) return;
    try {
      const r = await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "update-deal-stage", ...authHeaders },
        body: JSON.stringify({ deal_id: deal.id, stage_id: stageId }),
      });
      if (r.ok) { load(); onChanged(); showToast("Этап обновлён ✓"); }
      else { const d = await r.json(); showToast(d.error || "Ошибка", false); }
    } catch { showToast("Ошибка сети", false); }
  };

  const assignStaff = async (staffId: number | null) => {
    if (!deal) return;
    try {
      const r = await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "assign-deal", ...authHeaders },
        body: JSON.stringify({ deal_id: deal.id, staff_id: staffId }),
      });
      if (r.ok) { load(); onChanged(); showToast(staffId ? "Ответственный назначен ✓" : "Ответственный снят"); }
      else { const d = await r.json(); showToast(d.error || "Ошибка", false); }
    } catch { showToast("Ошибка сети", false); }
  };

  const addNote = async () => {
    if (!noteText.trim() || !deal) return;
    try {
      const r = await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "add-deal-note", ...authHeaders },
        body: JSON.stringify({ deal_id: deal.id, text: noteText.trim() }),
      });
      if (r.ok) { setNoteText(""); load(); }
      else showToast("Ошибка сохранения заметки", false);
    } catch { showToast("Ошибка сети", false); }
  };

  const deleteNote = async (id: number) => {
    try {
      await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "delete-deal-note", ...authHeaders },
        body: JSON.stringify({ id }),
      });
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch { showToast("Ошибка сети", false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">

        <div className="sticky top-0 bg-white border-b border-border px-6 h-14 flex items-center justify-between z-10">
          <span className="font-semibold text-sm">Карточка партии</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        {loading || !deal ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-6">

            {/* Заголовок партии */}
            <section className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-serif text-lg font-bold">{deal.batch_name || deal.brand || `Партия №${deal.id}`}</p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Оформлена {formatDate(deal.created_at)}</p>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0">#{deal.id}</span>
              </div>
              <button onClick={() => onOpenClient(deal.client.id)}
                className="w-full flex items-center gap-3 bg-secondary/40 hover:bg-secondary/70 rounded-xl px-3.5 py-2.5 transition-colors text-left">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                  {deal.client.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{deal.client.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {deal.client.phone || deal.client.city || "Открыть карточку клиента"}
                  </p>
                </div>
                <Icon name="ChevronRight" size={15} className="text-muted-foreground flex-shrink-0" />
              </button>
            </section>

            {/* Этапы */}
            <section>
              <h3 className="font-serif text-base font-bold mb-3">Этап партии</h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {stages.map(stage => {
                  const active = deal.stage_id === stage.id;
                  return (
                    <button key={stage.id} onClick={() => !active && changeStage(stage.id)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all"
                      style={active
                        ? { background: stage.color, color: "white", borderColor: stage.color }
                        : { color: "var(--muted-foreground)", borderColor: "var(--border)" }
                      }>
                      {stage.name}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Icon name="UserCheck" size={13} className="text-muted-foreground flex-shrink-0" />
                <select
                  value={deal.assigned_to ?? ""}
                  onChange={e => assignStaff(e.target.value ? Number(e.target.value) : null)}
                  className="text-[12px] bg-transparent outline-none border-b border-border focus:border-primary transition-colors py-0.5"
                >
                  <option value="">Без ответственного</option>
                  {assignable.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <button onClick={() => setExpandedHistory(e => !e)}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mt-2">
                <Icon name={expandedHistory ? "ChevronUp" : "ChevronDown"} size={12} />
                История изменений ({deal.history.length})
              </button>
              {expandedHistory && (
                <div className="mt-2 pl-3 border-l-2 border-border space-y-1.5">
                  {deal.history.map((h, i) => (
                    <p key={i} className="text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">{h.stage_name}</span>
                      {" · "}{h.staff_name || "система"}{" · "}{formatDate(h.changed_at)}
                    </p>
                  ))}
                </div>
              )}
            </section>

            {/* Состав партии — лоты */}
            <section>
              <h3 className="font-serif text-base font-bold mb-3">
                Состав партии ({deal.lots.length})
                <span className="ml-2 text-sm font-mono text-muted-foreground font-normal">
                  {deal.lots_volume} кг · {formatMoney(deal.lots_amount)}
                </span>
              </h3>
              {deal.lots.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-2xl p-6 text-center text-muted-foreground text-sm">
                  В этой партии пока нет лотов
                </div>
              ) : (
                <div className="space-y-2">
                  {deal.lots.map(lot => (
                    <div key={lot.id} className="bg-card border border-border rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-lg bg-primary/8 text-primary flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                          {lot.lot_number}
                        </span>
                        <p className="text-sm font-bold">Лот {lot.lot_number} — {lot.origin_label || "—"}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { label: "Обжарка", val: lot.roast || "—" },
                          { label: "Фасовка", val: weightLabel(lot.weight_format) },
                          { label: "Цвет", val: colorLabel(lot.color) },
                          { label: "Объём", val: lot.volume ? `${lot.volume} кг` : "—" },
                        ].map(p => (
                          <div key={p.label} className="bg-secondary/40 rounded-xl px-3 py-2 border border-border/50">
                            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-0.5">{p.label}</p>
                            <p className="text-[12px] font-semibold truncate">{p.val}</p>
                          </div>
                        ))}
                      </div>
                      {lot.note && <p className="text-[12px] text-muted-foreground mt-2">{lot.note}</p>}
                      <p className="text-sm font-bold text-primary mt-2 text-right">{formatMoney(lot.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Логистика */}
            {Object.keys(deal.logistics_data || {}).length > 0 && (
              <section>
                <h3 className="font-serif text-base font-bold mb-3 flex items-center gap-2">
                  <Icon name="Truck" size={15} className="text-primary" /> Логистика
                </h3>
                <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                  {Object.entries(deal.logistics_data).map(([k, v]) => v && (
                    <div key={k} className="flex items-start justify-between gap-3 text-[12px]">
                      <span className="text-muted-foreground flex-shrink-0">{k}</span>
                      <span className="font-medium text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Заметки-задачи менеджера */}
            <section>
              <h3 className="font-serif text-base font-bold mb-3 flex items-center gap-2">
                <Icon name="StickyNote" size={15} className="text-primary" /> Заметки
              </h3>
              <div className="flex gap-2 mb-3">
                <input value={noteText} onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addNote()}
                  placeholder="Напомнить себе о..."
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" />
                <button onClick={addNote}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all">
                  <Icon name="Plus" size={15} />
                </button>
              </div>
              {notes.length > 0 && (
                <div className="space-y-1.5">
                  {notes.map(n => (
                    <div key={n.id} className="flex items-start justify-between gap-2 bg-secondary/40 rounded-xl px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-[12px]">{n.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{n.staff_name} · {formatDate(n.created_at)}</p>
                      </div>
                      <button onClick={() => deleteNote(n.id)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                        <Icon name="X" size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealDrawer;
