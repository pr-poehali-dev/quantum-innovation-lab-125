import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";

const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";
const CRM_URL = "https://functions.poehali.dev/0fbf69fe-e1ba-4899-a9c0-98d37524abe1";

interface LogisticsField {
  id: number;
  key: string;
  label: string;
  field_type: "text" | "textarea" | "phone" | "date";
  required: boolean;
  sort_order: number;
}

const FIELD_TYPES = [
  { value: "text", label: "Текст" },
  { value: "textarea", label: "Многострочный текст" },
  { value: "phone", label: "Телефон" },
  { value: "date", label: "Дата" },
];

const AdminSettings = () => {
  const { token } = useStaffAuth();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Email settings
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(true);

  // Logistics fields
  const [fields, setFields] = useState<LogisticsField[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<LogisticsField["field_type"]>("text");
  const [newRequired, setNewRequired] = useState(false);

  const authHeaders = { "X-Staff-Token": token || "" };

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!token) return;
    fetch(ABOUT_URL, { headers: { "X-Action": "get-email-settings", ...authHeaders } })
      .then(r => r.json())
      .then(d => { setSenderName(d.sender_name || ""); setSenderEmail(d.sender_email || ""); })
      .catch(() => {})
      .finally(() => setLoadingEmail(false));
    loadFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadFields = () => {
    setLoadingFields(true);
    fetch(CRM_URL, { headers: { "X-Action": "list-logistics-fields", ...authHeaders } })
      .then(r => r.json())
      .then(d => setFields(d.fields || []))
      .catch(() => {})
      .finally(() => setLoadingFields(false));
  };

  const saveEmail = async () => {
    if (!senderName.trim() || !senderEmail.trim()) { showToast("Заполните имя и email отправителя", false); return; }
    setSavingEmail(true);
    try {
      const r = await fetch(ABOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "save-email-settings", ...authHeaders },
        body: JSON.stringify({ sender_name: senderName, sender_email: senderEmail }),
      });
      if (r.ok) showToast("Настройки email сохранены ✓");
      else { const d = await r.json(); showToast(d.error || "Ошибка", false); }
    } catch { showToast("Ошибка сети", false); }
    finally { setSavingEmail(false); }
  };

  const addField = async () => {
    if (!newLabel.trim()) return;
    try {
      const r = await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "save-logistics-field", ...authHeaders },
        body: JSON.stringify({ key: newLabel.trim(), label: newLabel.trim(), field_type: newType, required: newRequired }),
      });
      if (r.ok) { showToast("Поле добавлено ✓"); setNewLabel(""); setNewRequired(false); loadFields(); }
      else { const d = await r.json(); showToast(d.error || "Ошибка", false); }
    } catch { showToast("Ошибка сети", false); }
  };

  const updateField = async (f: LogisticsField) => {
    try {
      await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "save-logistics-field", ...authHeaders },
        body: JSON.stringify(f),
      });
    } catch { /* тихо */ }
  };

  const patchField = (id: number, patch: Partial<LogisticsField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  };

  const deleteField = async (id: number) => {
    if (!confirm("Удалить поле логистики?")) return;
    try {
      await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "delete-logistics-field", ...authHeaders },
        body: JSON.stringify({ id }),
      });
      showToast("Поле удалено");
      loadFields();
    } catch { showToast("Ошибка сети", false); }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[idx], next[target]] = [next[target], next[idx]];
    next.forEach((f, i) => { f.sort_order = i + 1; });
    setFields(next);
    next.forEach(f => updateField(f));
  };

  const inputCls = "px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="ArrowLeft" size={16} />
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <Icon name="Settings" size={16} className="text-primary" />
              <span className="font-semibold text-sm">Настройки</span>
            </div>
          </div>
        </div>
      </header>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium ${
          toast.ok ? "bg-green-500 text-white" : "bg-destructive text-white"
        }`}>
          <Icon name={toast.ok ? "Check" : "X"} size={14} />
          {toast.msg}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        {/* Email отправителя */}
        <section>
          <h2 className="font-serif text-xl font-bold mb-1">Email для писем клиентам</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Коды входа и уведомления будут отправляться с этого адреса. Адрес должен быть подтверждён в вашем аккаунте Unisender.
          </p>
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            {loadingEmail ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1.5">ИМЯ ОТПРАВИТЕЛЯ</label>
                    <input className={`${inputCls} w-full`} value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="КонтрактКофе" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1.5">EMAIL ОТПРАВИТЕЛЯ</label>
                    <input className={`${inputCls} w-full`} value={senderEmail} onChange={e => setSenderEmail(e.target.value)} placeholder="noreply@yourdomain.ru" />
                  </div>
                </div>
                <button onClick={saveEmail} disabled={savingEmail}
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60">
                  {savingEmail ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Save" size={14} />}
                  Сохранить
                </button>
              </>
            )}
          </div>
        </section>

        {/* Поля логистики */}
        <section>
          <h2 className="font-serif text-xl font-bold mb-1">Поля логистики</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Эти поля клиент заполняет в личном кабинете при оформлении доставки партии.
          </p>
          <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
            {loadingFields ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {fields.map((f, idx) => (
                  <div key={f.id} className="flex items-center gap-2 bg-secondary/30 rounded-xl p-2.5">
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button onClick={() => move(idx, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                        <Icon name="ChevronUp" size={12} />
                      </button>
                      <button onClick={() => move(idx, 1)} disabled={idx === fields.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                        <Icon name="ChevronDown" size={12} />
                      </button>
                    </div>
                    <input
                      value={f.label}
                      onChange={e => patchField(f.id, { label: e.target.value })}
                      onBlur={() => updateField(fields.find(x => x.id === f.id)!)}
                      className={`${inputCls} flex-1`}
                    />
                    <select
                      value={f.field_type}
                      onChange={e => { patchField(f.id, { field_type: e.target.value as LogisticsField["field_type"] }); updateField({ ...f, field_type: e.target.value as LogisticsField["field_type"] }); }}
                      className={inputCls}
                    >
                      {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground flex-shrink-0">
                      <input type="checkbox" checked={f.required}
                        onChange={e => { patchField(f.id, { required: e.target.checked }); updateField({ ...f, required: e.target.checked }); }} />
                      обязательно
                    </label>
                    <button onClick={() => deleteField(f.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors flex-shrink-0">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addField()}
                    placeholder="Название нового поля" className={`${inputCls} flex-1`} />
                  <select value={newType} onChange={e => setNewType(e.target.value as LogisticsField["field_type"])} className={inputCls}>
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground flex-shrink-0">
                    <input type="checkbox" checked={newRequired} onChange={e => setNewRequired(e.target.checked)} />
                    обязательно
                  </label>
                  <button onClick={addField} className="flex items-center gap-1.5 bg-secondary text-foreground px-3 py-2 rounded-lg text-sm font-semibold hover:bg-secondary/70 transition-all flex-shrink-0">
                    <Icon name="Plus" size={14} /> Добавить
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminSettings;
