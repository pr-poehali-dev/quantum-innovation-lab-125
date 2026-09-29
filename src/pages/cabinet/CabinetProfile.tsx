import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useClientAuth } from "@/context/ClientAuthContext";

const CabinetProfile = () => {
  const { client, updateProfile } = useClientAuth();
  const [form, setForm] = useState({ name: "", phone: "", city: "", company: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (client) setForm({
      name: client.name || "", phone: client.phone || "",
      city: client.city || "", company: client.company || "",
    });
  }, [client]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const save = async () => {
    setSaving(true);
    const res = await updateProfile(form);
    setSaving(false);
    showToast(res.ok ? "Данные сохранены ✓" : res.error || "Ошибка сохранения");
  };

  return (
    <div className="max-w-lg">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <h2 className="font-serif text-2xl font-bold mb-1">Личные данные</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Укажите номер телефона, чтобы менеджер мог с вами связаться — без него заказ нельзя отправить на согласование.
      </p>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 tracking-wider">ИМЯ</label>
          <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div>
          <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 tracking-wider">
            ТЕЛЕФОН ДЛЯ СВЯЗИ <span className="text-primary">*</span>
          </label>
          <input value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+7 900 000-00-00"
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div>
          <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 tracking-wider">EMAIL</label>
          <input value={client?.email || ""} disabled
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-secondary/40 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground mt-1">Email используется для входа и не может быть изменён</p>
        </div>
        <div>
          <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 tracking-wider">ГОРОД</label>
          <input value={form.city} onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div>
          <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 tracking-wider">КОМПАНИЯ</label>
          <input value={form.company} onChange={e => setForm(prev => ({ ...prev, company: e.target.value }))}
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors" />
        </div>

        <button onClick={save} disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-60">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Check" size={16} />}
          Сохранить
        </button>
      </div>
    </div>
  );
};

export default CabinetProfile;
