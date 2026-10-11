import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";

const CRM_URL = "https://functions.poehali.dev/0fbf69fe-e1ba-4899-a9c0-98d37524abe1";

export interface DealDoc {
  id: number;
  title: string;
  status: "todo" | "sent" | "returned" | "done";
  file_url: string | null;
  file_name: string | null;
  signed_file_url: string | null;
  signed_file_name: string | null;
  completed_at: string | null;
  completed_by: string | null;
}

export const DOC_STATUS: Record<DealDoc["status"], { label: string; cls: string; icon: string }> = {
  todo: { label: "Не отправлен", cls: "bg-secondary text-muted-foreground", icon: "Circle" },
  sent: { label: "Ждёт подписи", cls: "bg-amber-500/15 text-amber-700", icon: "Clock" },
  returned: { label: "Получен от клиента", cls: "bg-sky-500/15 text-sky-700", icon: "Inbox" },
  done: { label: "Оформлен", cls: "bg-green-500/15 text-green-700", icon: "CheckCircle" },
};

interface Props {
  dealId: number;
  documents: DealDoc[];
  onChanged: () => void;
  showToast: (msg: string, ok?: boolean) => void;
}

const DealDocuments = ({ dealId, documents, onChanged, showToast }: Props) => {
  const { token } = useStaffAuth();
  const [templates, setTemplates] = useState<{ id: number; title: string }[]>([]);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  const headers = { "Content-Type": "application/json", "X-Staff-Token": token || "" };

  useEffect(() => {
    if (!token) return;
    fetch(CRM_URL, { headers: { "X-Action": "list-doc-templates", "X-Staff-Token": token } })
      .then(r => r.json()).then(d => setTemplates(d.templates || [])).catch(() => {});
  }, [token]);

  const call = async (action: string, body: object, okMsg?: string) => {
    setBusy(true);
    try {
      const r = await fetch(CRM_URL, { method: "POST", headers: { ...headers, "X-Action": action }, body: JSON.stringify(body) });
      if (r.ok) { if (okMsg) showToast(okMsg); onChanged(); }
      else { const d = await r.json(); showToast(d.error || "Ошибка", false); }
    } catch { showToast("Ошибка сети", false); }
    finally { setBusy(false); }
  };

  const used = new Set(documents.map(d => d.title));
  const free = templates.filter(t => !used.has(t.title));
  const done = documents.filter(d => d.status === "done").length;
  const pct = documents.length ? Math.round((done / documents.length) * 100) : 0;

  return (
    <section>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-serif text-base font-bold flex items-center gap-2">
          <Icon name="FileCheck" size={15} className="text-primary" /> Документы
        </h3>
        {documents.length > 0 && <span className="text-[12px] font-mono text-muted-foreground">{done}/{documents.length}</span>}
      </div>

      {documents.length > 0 && (
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
          <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="space-y-2">
        {documents.map(d => {
          const st = DOC_STATUS[d.status];
          return (
            <div key={d.id} className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{d.title}</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 mt-1 ${st.cls}`}>
                    <Icon name={st.icon} size={10} /> {st.label}
                  </span>
                </div>
                <button onClick={() => confirm(`Убрать «${d.title}» из сделки?`) && call("remove-deal-document", { id: d.id }, "Документ убран")}
                  disabled={busy} aria-label="Убрать"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                  <Icon name="X" size={14} />
                </button>
              </div>

              {(d.file_url || d.signed_file_url) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px]">
                  {d.file_url && <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 hover:underline"><Icon name="Paperclip" size={11} />{d.file_name || "Файл"}</a>}
                  {d.signed_file_url && <a href={d.signed_file_url} target="_blank" rel="noopener noreferrer" className="text-green-700 flex items-center gap-1 hover:underline"><Icon name="FileSignature" size={11} />{d.signed_file_name || "Подписанный"}</a>}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {d.status !== "done" ? (
                  <button onClick={() => call("set-document-status", { id: d.id, status: "done" }, "Документ отмечен как оформленный ✓")} disabled={busy}
                    className="flex items-center gap-1 text-[12px] font-medium bg-green-600 text-white rounded-lg px-3 py-1.5 hover:bg-green-700 transition-colors disabled:opacity-60">
                    <Icon name="Check" size={12} /> Отметить оформленным
                  </button>
                ) : (
                  <button onClick={() => call("set-document-status", { id: d.id, status: d.signed_file_url ? "returned" : "sent" })} disabled={busy}
                    className="flex items-center gap-1 text-[12px] font-medium border border-border rounded-lg px-3 py-1.5 hover:bg-secondary/40 transition-colors disabled:opacity-60">
                    <Icon name="Undo2" size={12} /> Снять отметку
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 space-y-2">
        {free.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {free.map(t => (
              <button key={t.id} onClick={() => call("add-deal-document", { deal_id: dealId, title: t.title }, `Добавлено: ${t.title}`)} disabled={busy}
                className="flex items-center gap-1 text-[12px] font-medium border border-dashed border-border rounded-full px-3 py-1.5 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all disabled:opacity-60">
                <Icon name="Plus" size={11} /> {t.title}
              </button>
            ))}
            {free.length > 1 && (
              <button onClick={() => call("add-deal-document", { deal_id: dealId, titles: free.map(t => t.title) }, "Добавлен весь набор")} disabled={busy}
                className="flex items-center gap-1 text-[12px] font-semibold text-primary rounded-full px-3 py-1.5 bg-primary/10 hover:bg-primary/15 transition-all disabled:opacity-60">
                <Icon name="ListPlus" size={12} /> Весь набор
              </button>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Свой документ…"
            onKeyDown={e => { if (e.key === "Enter" && custom.trim()) { call("add-deal-document", { deal_id: dealId, title: custom.trim() }); setCustom(""); } }}
            className="flex-1 min-w-0 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" />
          <button onClick={() => { if (custom.trim()) { call("add-deal-document", { deal_id: dealId, title: custom.trim() }); setCustom(""); } }} disabled={busy || !custom.trim()} aria-label="Добавить"
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50">
            <Icon name="Plus" size={15} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default DealDocuments;
