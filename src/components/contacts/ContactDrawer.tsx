import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import TagPicker from "@/components/contacts/TagPicker";
import {
  CONTACTS_URL, STATUS_LABELS, STATUS_STYLES, CALL_RESULTS, fmtDate, telHref, firstPhone,
  type ContactFull, type Tag,
} from "@/lib/contactsApi";

interface Props {
  contactId: number | "new";
  tags: Tag[];
  authHeaders: Record<string, string>;
  onClose: () => void;
  onChanged: () => void;
  onTagsChanged: () => void;
  toast: (msg: string, ok?: boolean) => void;
}

const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background";
const labelCls = "block text-[11px] font-mono text-muted-foreground mb-1";

const EMPTY: Partial<ContactFull> = { company: "", priority: 2, call_status: "new", tag_ids: [], mailing_consent: false, comments: [], calls: [], deals: [] };

const ContactDrawer = ({ contactId, tags, authHeaders, onClose, onChanged, onTagsChanged, toast }: Props) => {
  const navigate = useNavigate();
  const [c, setC] = useState<Partial<ContactFull>>(EMPTY);
  const [loading, setLoading] = useState(contactId !== "new");
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState("");
  const [callResult, setCallResult] = useState("");
  const [callComment, setCallComment] = useState("");
  const [dealBrand, setDealBrand] = useState("");
  const [dealVolume, setDealVolume] = useState("500");
  const [showDeal, setShowDeal] = useState(false);

  const call = (action: string, body?: unknown, extra: Record<string, string> = {}) =>
    fetch(CONTACTS_URL, {
      method: body ? "POST" : "GET",
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), "X-Action": action, ...authHeaders, ...extra },
      body: body ? JSON.stringify(body) : undefined,
    }).then(async r => ({ ok: r.ok, d: await r.json() }));

  const load = async () => {
    if (contactId === "new") return;
    const { ok, d } = await call("get-contact", undefined, { "X-Contact-Id": String(contactId) });
    if (ok) setC(d.contact);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [contactId]);

  const set = (patch: Partial<ContactFull>) => setC(prev => ({ ...prev, ...patch }));

  const save = async () => {
    setSaving(true);
    const { ok, d } = await call("save-contact", { ...c, id: contactId === "new" ? undefined : contactId });
    setSaving(false);
    if (!ok) { toast(d.error || "Ошибка сохранения", false); return; }
    toast("Сохранено ✓");
    onChanged();
    if (contactId === "new") onClose(); else load();
  };

  const addComment = async () => {
    if (!comment.trim() || contactId === "new") return;
    const { ok } = await call("add-comment", { contact_id: contactId, text: comment });
    if (ok) { setComment(""); load(); }
  };

  const delComment = async (id: number) => {
    if (!confirm("Удалить комментарий?")) return;
    await call("delete-comment", { id });
    load();
  };

  const logCall = async () => {
    if (!callResult || contactId === "new") return;
    const { ok, d } = await call("log-call", { contact_id: contactId, result: callResult, comment: callComment });
    if (!ok) { toast(d.error || "Ошибка", false); return; }
    setCallResult(""); setCallComment(""); toast("Звонок отмечен ✓"); onChanged(); load();
  };

  const createDeal = async () => {
    if (contactId === "new") return;
    const { ok, d } = await call("create-deal", { contact_id: contactId, brand: dealBrand, volume: parseFloat(dealVolume) || null });
    if (!ok) { toast(d.error || "Ошибка", false); return; }
    toast("Сделка создана ✓");
    navigate("/admin/crm");
  };

  const archive = async () => {
    if (contactId === "new") return;
    await call("archive-contact", { id: contactId, archived: !c.archived });
    onChanged(); onClose();
  };

  const isNew = contactId === "new";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-background h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 bg-white border-b border-border px-5 h-14 flex items-center justify-between">
          <p className="font-semibold text-sm truncate">{isNew ? "Новый контакт" : c.company}</p>
          <button onClick={onClose}><Icon name="X" size={18} /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="p-5 space-y-6">
            {!isNew && c.phone && (
              <a href={telHref(c.phone)} className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors">
                <Icon name="Phone" size={16} /> Позвонить {firstPhone(c.phone)}
              </a>
            )}

            <section className="space-y-3">
              <div><label className={labelCls}>КОМПАНИЯ</label>
                <input className={inputCls} value={c.company || ""} onChange={e => set({ company: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>ТЕЛЕФОН (несколько через ;)</label>
                  <input className={inputCls} value={c.phone || ""} onChange={e => set({ phone: e.target.value })} /></div>
                <div><label className={labelCls}>EMAIL</label>
                  <input className={inputCls} value={c.email || ""} onChange={e => set({ email: e.target.value })} /></div>
                <div><label className={labelCls}>ГОРОД</label>
                  <input className={inputCls} value={c.city || ""} onChange={e => set({ city: e.target.value })} /></div>
                <div><label className={labelCls}>СЕГМЕНТ</label>
                  <input className={inputCls} value={c.segment || ""} onChange={e => set({ segment: e.target.value })} /></div>
                <div><label className={labelCls}>ВРЕМЯ ЗВОНКА</label>
                  <input className={inputCls} value={c.call_window || ""} onChange={e => set({ call_window: e.target.value })} /></div>
                <div><label className={labelCls}>ПРИОРИТЕТ</label>
                  <select className={inputCls} value={c.priority ?? ""} onChange={e => set({ priority: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">—</option><option value="1">1 — высокий</option><option value="2">2 — средний</option><option value="3">3 — низкий</option>
                  </select></div>
              </div>
              <div><label className={labelCls}>ЧТО НУЖНО КЛИЕНТУ</label>
                <textarea rows={2} className={inputCls} value={c.need || ""} onChange={e => set({ need: e.target.value })} /></div>
              <div><label className={labelCls}>ОБЪЁМ И ЧАСТОТА ЗАКУПОК</label>
                <textarea rows={2} className={inputCls} value={c.volume_note || ""} onChange={e => set({ volume_note: e.target.value })} /></div>
              <div><label className={labelCls}>ЧТО ВАЖНО КЛИЕНТУ</label>
                <textarea rows={2} className={inputCls} value={c.important || ""} onChange={e => set({ important: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!c.mailing_consent} onChange={e => set({ mailing_consent: e.target.checked })} />
                Согласен(на) получать рассылку
              </label>
              <div><label className={labelCls}>ТЕГИ</label>
                <TagPicker tags={tags} selected={c.tag_ids || []} onChange={ids => set({ tag_ids: ids })} authHeaders={authHeaders} onTagsChanged={onTagsChanged} /></div>
              <div className="flex gap-2">
                <button onClick={save} disabled={saving || !c.company?.trim()}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40">
                  {saving ? "Сохраняю…" : isNew ? "Создать контакт" : "Сохранить"}
                </button>
                {!isNew && (
                  <button onClick={archive} className="px-4 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground">
                    {c.archived ? "Вернуть" : "В архив"}
                  </button>
                )}
              </div>
            </section>

            {!isNew && (
              <>
                <section className="space-y-3 border-t border-border pt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Звонки</h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_STYLES[c.call_status || "new"]}`}>{STATUS_LABELS[c.call_status || "new"]}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CALL_RESULTS.map(r => (
                      <button key={r} onClick={() => setCallResult(r)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${callResult === r ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>
                        {STATUS_LABELS[r]}
                      </button>
                    ))}
                  </div>
                  {callResult && (
                    <div className="space-y-2">
                      <input className={inputCls} placeholder="Суть разговора в 1–2 фразах" value={callComment} onChange={e => setCallComment(e.target.value)} />
                      <button onClick={logCall} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold">Отметить звонок</button>
                    </div>
                  )}
                  {(c.calls || []).map(x => (
                    <div key={x.id} className="text-[13px] bg-secondary/40 rounded-lg px-3 py-2">
                      <span className="font-medium">{STATUS_LABELS[x.result] || x.result}</span>
                      <span className="text-muted-foreground"> · {x.staff_name} · {fmtDate(x.created_at)}</span>
                      {x.comment && <p className="mt-0.5">{x.comment}</p>}
                    </div>
                  ))}
                </section>

                <section className="space-y-3 border-t border-border pt-5">
                  <h3 className="font-semibold text-sm">Комментарии</h3>
                  <div className="flex gap-2">
                    <textarea rows={2} className={inputCls} placeholder="Записать заметку" value={comment} onChange={e => setComment(e.target.value)} />
                    <button onClick={addComment} disabled={!comment.trim()} className="px-3 bg-primary text-primary-foreground rounded-lg disabled:opacity-40">
                      <Icon name="Send" size={14} />
                    </button>
                  </div>
                  {(c.comments || []).map(x => (
                    <div key={x.id} className="text-[13px] bg-secondary/40 rounded-lg px-3 py-2 group">
                      <div className="flex justify-between text-muted-foreground text-[11px]">
                        <span>{x.staff_name} · {fmtDate(x.created_at)}</span>
                        <button onClick={() => delComment(x.id)} className="opacity-0 group-hover:opacity-100 hover:text-destructive"><Icon name="Trash2" size={12} /></button>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap">{x.text}</p>
                    </div>
                  ))}
                </section>

                <section className="space-y-3 border-t border-border pt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Сделки ({(c.deals || []).length})</h3>
                    <button onClick={() => setShowDeal(s => !s)} className="text-[13px] text-primary font-medium flex items-center gap-1">
                      <Icon name="Plus" size={13} /> Создать сделку
                    </button>
                  </div>
                  {showDeal && (
                    <div className="space-y-2 bg-secondary/30 rounded-xl p-3">
                      <input className={inputCls} placeholder="Бренд / название партии" value={dealBrand} onChange={e => setDealBrand(e.target.value)} />
                      <input className={inputCls} type="number" placeholder="Объём, кг" value={dealVolume} onChange={e => setDealVolume(e.target.value)} />
                      <button onClick={createDeal} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold">Создать и перейти в CRM</button>
                    </div>
                  )}
                  {(c.deals || []).map(d => (
                    <div key={d.id} className="text-[13px] bg-secondary/40 rounded-lg px-3 py-2 flex justify-between">
                      <span>{d.brand || `Сделка №${d.id}`}{d.volume ? ` · ${d.volume} кг` : ""}</span>
                      <span className="text-muted-foreground">{d.stage}</span>
                    </div>
                  ))}
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactDrawer;
