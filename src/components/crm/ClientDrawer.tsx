import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";
import StaffChatPanel from "@/components/crm/StaffChatPanel";

const CRM_URL = "https://functions.poehali.dev/0fbf69fe-e1ba-4899-a9c0-98d37524abe1";
const DOCS_URL = "https://functions.poehali.dev/728446de-2a8e-45c1-a93a-a0040873e23b";

interface StageHistory {
  stage_id: number;
  stage_name: string;
  staff_name: string;
  changed_at: string;
}

interface Deal {
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
}

interface AssignableStaff {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ClientData {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  company: string | null;
  created_at: string;
}

interface Stage {
  id: number;
  name: string;
  sort_order: number;
  color: string;
}

interface ClientDoc {
  id: number;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_name: string;
  created_at: string;
}

interface Category {
  id: number;
  key: string;
  label: string;
  icon: string;
}

interface Props {
  clientId: number;
  onClose: () => void;
  onChanged: () => void;
  showToast: (msg: string, ok?: boolean) => void;
}

const ClientDrawer = ({ clientId, onClose, onChanged, showToast }: Props) => {
  const { token } = useStaffAuth();
  const [client, setClient] = useState<ClientData | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [assignable, setAssignable] = useState<AssignableStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
  const [editingClient, setEditingClient] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", company: "" });
  const [docs, setDocs] = useState<ClientDoc[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("other");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const authHeaders = { "X-Staff-Token": token || "" };

  const loadDocs = () => {
    Promise.all([
      fetch(DOCS_URL, { headers: { "X-Action": "list-for-client", "X-Client-Id": String(clientId), ...authHeaders } }).then(r => r.json()),
      fetch(DOCS_URL, { headers: { "X-Action": "list-categories" } }).then(r => r.json()),
    ]).then(([d, c]) => {
      setDocs(d.documents || []);
      setCategories(c.categories || []);
    }).catch(() => {});
  };

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(CRM_URL, { headers: { "X-Action": "get-client", "X-Client-Id": String(clientId), ...authHeaders } }).then(r => r.json()),
      fetch(CRM_URL, { headers: { "X-Action": "list-stages", ...authHeaders } }).then(r => r.json()),
      fetch(CRM_URL, { headers: { "X-Action": "list-assignable", ...authHeaders } }).then(r => r.json()),
    ]).then(([c, s, a]) => {
      setClient(c.client);
      setDeals(c.deals || []);
      setStages(s.stages || []);
      setAssignable(a.staff || []);
      if (c.client) setForm({
        name: c.client.name || "", phone: c.client.phone || "", email: c.client.email || "",
        city: c.client.city || "", company: c.client.company || "",
      });
    }).catch(() => showToast("Ошибка загрузки клиента", false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (token) { load(); loadDocs(); } }, [token, clientId]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!docTitle) setDocTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "));
    setUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const b64 = (ev.target?.result as string).split(",")[1];
      try {
        const r = await fetch(DOCS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Action": "upload", ...authHeaders },
          body: JSON.stringify({
            client_id: clientId, title: docTitle || file.name, category: docCategory,
            file_base64: b64, file_name: file.name,
          }),
        });
        if (r.ok) { showToast("Документ загружен ✓"); setDocTitle(""); loadDocs(); }
        else showToast("Ошибка загрузки", false);
      } catch { showToast("Ошибка сети", false); }
      finally { setUploadingDoc(false); if (fileRef.current) fileRef.current.value = ""; }
    };
    reader.readAsDataURL(file);
  };

  const deleteDoc = async (id: number) => {
    if (!confirm("Удалить документ?")) return;
    try {
      await fetch(DOCS_URL, { method: "DELETE", headers: { "X-Action": "delete", "X-Doc-Id": String(id), ...authHeaders } });
      loadDocs();
      showToast("Документ удалён");
    } catch { showToast("Ошибка сети", false); }
  };

  const changeStage = async (dealId: number, stageId: number) => {
    try {
      const r = await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "update-deal-stage", ...authHeaders },
        body: JSON.stringify({ deal_id: dealId, stage_id: stageId }),
      });
      if (r.ok) { load(); onChanged(); showToast("Этап обновлён ✓"); }
      else { const d = await r.json(); showToast(d.error || "Ошибка", false); }
    } catch { showToast("Ошибка сети", false); }
  };

  const assignDeal = async (dealId: number, staffId: number | null) => {
    setDeals(prev => prev.map(d => d.id === dealId
      ? { ...d, assigned_to: staffId, assigned_name: assignable.find(a => a.id === staffId)?.name || null }
      : d));
    try {
      const r = await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "assign-deal", ...authHeaders },
        body: JSON.stringify({ deal_id: dealId, staff_id: staffId }),
      });
      if (r.ok) { showToast(staffId ? "Ответственный назначен ✓" : "Ответственный снят"); onChanged(); }
      else { const d = await r.json(); showToast(d.error || "Ошибка", false); }
    } catch { showToast("Ошибка сети", false); }
  };

  const saveClient = async () => {
    try {
      const r = await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "update-client", ...authHeaders },
        body: JSON.stringify({ id: clientId, ...form }),
      });
      if (r.ok) { setEditingClient(false); load(); onChanged(); showToast("Данные сохранены ✓"); }
      else { const d = await r.json(); showToast(d.error || "Ошибка", false); }
    } catch { showToast("Ошибка сети", false); }
  };

  const updateDealField = async (deal: Deal, patch: Partial<Deal>) => {
    setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, ...patch } : d));
  };

  const saveDealFields = async (deal: Deal) => {
    try {
      await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "update-deal", ...authHeaders },
        body: JSON.stringify({ id: deal.id, brand: deal.brand, volume: deal.volume, amount: deal.amount }),
      });
    } catch { /* тихо */ }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) + " в " +
      d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">

        <div className="sticky top-0 bg-white border-b border-border px-6 h-14 flex items-center justify-between z-10">
          <span className="font-semibold text-sm">Карточка клиента</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        {loading || !client ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-6">

            {/* Профиль клиента */}
            <section className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  {!editingClient && <p className="font-serif text-lg font-bold">{client.name}</p>}
                </div>
                <button onClick={() => setEditingClient(e => !e)} className="text-muted-foreground hover:text-primary transition-colors">
                  <Icon name={editingClient ? "X" : "Pencil"} size={15} />
                </button>
              </div>

              {editingClient ? (
                <div className="space-y-2">
                  {[
                    { key: "name", label: "Имя" },
                    { key: "phone", label: "Телефон" },
                    { key: "email", label: "Email" },
                    { key: "city", label: "Город" },
                    { key: "company", label: "Компания" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[11px] text-muted-foreground mb-1">{f.label}</label>
                      <input
                        value={(form as Record<string, string>)[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  ))}
                  <button onClick={saveClient}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all mt-2">
                    <Icon name="Check" size={14} /> Сохранить
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5 text-sm">
                  {client.phone && <p className="flex items-center gap-2 text-muted-foreground"><Icon name="Phone" size={13} />{client.phone}</p>}
                  {client.email && <p className="flex items-center gap-2 text-muted-foreground"><Icon name="Mail" size={13} />{client.email}</p>}
                  {client.city && <p className="flex items-center gap-2 text-muted-foreground"><Icon name="MapPin" size={13} />{client.city}</p>}
                  {client.company && <p className="flex items-center gap-2 text-muted-foreground"><Icon name="Building2" size={13} />{client.company}</p>}
                </div>
              )}
            </section>

            {/* Сделки */}
            <section>
              <h3 className="font-serif text-base font-bold mb-3">Сделки ({deals.length})</h3>
              <div className="space-y-3">
                {deals.map(deal => (
                  <div key={deal.id} className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <input
                        value={deal.brand || ""}
                        onChange={e => updateDealField(deal, { brand: e.target.value })}
                        onBlur={() => saveDealFields(deal)}
                        placeholder="Название бренда / заказа"
                        className="font-semibold text-sm bg-transparent outline-none border-b border-transparent focus:border-primary transition-colors flex-1"
                      />
                      <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0 ml-2">#{deal.id}</span>
                    </div>

                    <div className="flex items-center gap-3 mb-3 text-[12px]">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Объём:</span>
                        <input
                          type="number"
                          value={deal.volume ?? ""}
                          onChange={e => updateDealField(deal, { volume: e.target.value ? Number(e.target.value) : null })}
                          onBlur={() => saveDealFields(deal)}
                          className="w-16 bg-transparent outline-none border-b border-border focus:border-primary transition-colors font-mono"
                        />
                        <span className="text-muted-foreground">кг</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Сумма:</span>
                        <input
                          type="number"
                          value={deal.amount ?? ""}
                          onChange={e => updateDealField(deal, { amount: e.target.value ? Number(e.target.value) : null })}
                          onBlur={() => saveDealFields(deal)}
                          className="w-20 bg-transparent outline-none border-b border-border focus:border-primary transition-colors font-mono"
                        />
                        <span className="text-muted-foreground">₽</span>
                      </div>
                    </div>

                    {/* Этапы */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {stages.map(stage => {
                        const active = deal.stage_id === stage.id;
                        return (
                          <button key={stage.id} onClick={() => !active && changeStage(deal.id, stage.id)}
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

                    {/* Ответственный */}
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="UserCheck" size={13} className="text-muted-foreground flex-shrink-0" />
                      <select
                        value={deal.assigned_to ?? ""}
                        onChange={e => assignDeal(deal.id, e.target.value ? Number(e.target.value) : null)}
                        className="text-[12px] bg-transparent outline-none border-b border-border focus:border-primary transition-colors py-0.5"
                      >
                        <option value="">Без ответственного</option>
                        {assignable.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* История изменений этапов */}
                    <button onClick={() => setExpandedHistory(expandedHistory === deal.id ? null : deal.id)}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mt-1">
                      <Icon name={expandedHistory === deal.id ? "ChevronUp" : "ChevronDown"} size={12} />
                      История изменений ({deal.history.length})
                    </button>

                    {expandedHistory === deal.id && (
                      <div className="mt-2 pl-3 border-l-2 border-border space-y-1.5">
                        {deal.history.map((h, i) => (
                          <p key={i} className="text-[11px] text-muted-foreground">
                            <span className="font-medium text-foreground">{h.stage_name}</span>
                            {" · "}{h.staff_name || "система"}{" · "}{formatDate(h.changed_at)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Документы клиента */}
            <section>
              <h3 className="font-serif text-base font-bold mb-3 flex items-center gap-2">
                <Icon name="FolderOpen" size={16} className="text-primary" />
                Документы ({docs.length})
              </h3>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border space-y-2">
                  <div className="flex gap-2">
                    <input value={docTitle} onChange={e => setDocTitle(e.target.value)}
                      placeholder="Название документа"
                      className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" />
                    <select value={docCategory} onChange={e => setDocCategory(e.target.value)}
                      className="px-2 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none">
                      {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  </div>
                  <button onClick={() => fileRef.current?.click()} disabled={uploadingDoc}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-lg py-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-all disabled:opacity-60">
                    {uploadingDoc ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Icon name="Upload" size={14} />}
                    {uploadingDoc ? "Загружаем…" : "Загрузить файл"}
                  </button>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={onFileChange} className="hidden" />
                </div>
                {docs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Документов пока нет</p>
                ) : (
                  <div className="divide-y divide-border">
                    {docs.map(d => (
                      <div key={d.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon name="FileText" size={14} className="text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{d.title}</p>
                            <p className="text-[10px] text-muted-foreground">{categories.find(c => c.key === d.category)?.label || d.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors">
                            <Icon name="ExternalLink" size={13} />
                          </a>
                          <button onClick={() => deleteDoc(d.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors">
                            <Icon name="Trash2" size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Чат с клиентом */}
            <section>
              <h3 className="font-serif text-base font-bold mb-3 flex items-center gap-2">
                <Icon name="MessageCircle" size={16} className="text-primary" />
                Переписка
              </h3>
              <StaffChatPanel clientId={clientId} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDrawer;