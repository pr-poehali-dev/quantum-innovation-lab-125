import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { SiteContacts } from "@/lib/siteContent";

interface Props {
  initial: SiteContacts;
  saving: boolean;
  onSave: (data: SiteContacts) => void;
  inputCls: string;
  labelCls: string;
}

const FIELDS: { key: keyof SiteContacts; label: string; placeholder: string; icon: string }[] = [
  { key: "phone", label: "ТЕЛЕФОН (шапка и футер)", placeholder: "+7 900 000-00-00", icon: "Phone" },
  { key: "phone_note", label: "ПОДПИСЬ К ТЕЛЕФОНУ", placeholder: "Звонки и Telegram", icon: "Type" },
  { key: "email", label: "EMAIL", placeholder: "info@company.ru", icon: "Mail" },
  { key: "telegram", label: "TELEGRAM (ссылка)", placeholder: "https://t.me/username", icon: "Send" },
  { key: "whatsapp", label: "WHATSAPP (номер или ссылка)", placeholder: "+7 900 000-00-00", icon: "MessageCircle" },
  { key: "vk", label: "ВКОНТАКТЕ (ссылка)", placeholder: "https://vk.com/company", icon: "Share2" },
  { key: "max", label: "MAX (ссылка)", placeholder: "Ссылка на аккаунт в MAX", icon: "MessageSquare" },
];

const ContactsEditor = ({ initial, saving, onSave, inputCls, labelCls }: Props) => {
  const [data, setData] = useState<SiteContacts>(initial);
  const set = (key: keyof SiteContacts, value: string) => setData(d => ({ ...d, [key]: value }));

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <p className="text-sm text-muted-foreground">
        Эти контакты показываются в шапке сайта, в футере и в блоке «Контакты». Пустое поле — не показывается.
      </p>

      <div className="grid md:grid-cols-2 gap-3">
        {FIELDS.map(f => (
          <div key={f.key}>
            <label className={labelCls}>{f.label}</label>
            <div className="relative">
              <Icon name={f.icon} fallback="Circle" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className={`${inputCls} pl-9`} value={data[f.key]} placeholder={f.placeholder}
                onChange={e => set(f.key, e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border grid md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>ВРЕМЯ РАБОТЫ</label>
          <div className="relative">
            <Icon name="Clock" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className={`${inputCls} pl-9`} value={data.work_hours} placeholder="Пн–Пт, 9:00–18:00"
              onChange={e => set("work_hours", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelCls}>ФАКТИЧЕСКИЙ АДРЕС</label>
          <div className="relative">
            <Icon name="MapPin" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className={`${inputCls} pl-9`} value={data.address} placeholder="г. Москва, ул. Примерная, 1"
              onChange={e => set("address", e.target.value)} />
          </div>
        </div>
      </div>

      <button onClick={() => onSave(data)} disabled={saving}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40">
        <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} /> Сохранить контакты
      </button>
    </div>
  );
};

export default ContactsEditor;
