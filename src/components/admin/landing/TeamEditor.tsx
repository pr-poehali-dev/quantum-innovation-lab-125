import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { Glyph } from "@/components/ContactButton";
import { useStaffAuth } from "@/context/StaffAuthContext";
import { ABOUT_URL } from "@/lib/siteContent";
import {
  CONTACT_TYPES, getContactType, initialsOf, memberName,
  type ContactItem, type TeamMember,
} from "@/lib/contactTypes";

interface StaffOption { id: number; name: string; email: string }

interface Props {
  inputCls: string;
  labelCls: string;
  showToast: (msg: string, ok?: boolean) => void;
}

const EMPTY: TeamMember = {
  id: 0, staff_id: null, first_name: "", last_name: "", position: "", description: "",
  photo_url: "", contacts: [], show_on_site: true, active: true,
};

const TeamEditor = ({ inputCls, labelCls, showToast }: Props) => {
  const { token } = useStaffAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const auth = { "X-Staff-Token": token || "" };

  const load = () => {
    setLoading(true);
    fetch(ABOUT_URL, { headers: { "X-Action": "list-team", ...auth } })
      .then(r => r.json())
      .then(d => setMembers(d.members || []))
      .catch(() => showToast("Не удалось загрузить команду", false))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) return;
    load();
    fetch("https://functions.poehali.dev/0fbf69fe-e1ba-4899-a9c0-98d37524abe1", { headers: { "X-Action": "list-assignable", ...auth } })
      .then(r => r.json())
      .then(d => setStaff(d.staff || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const patch = (p: Partial<TeamMember>) => setEditing(e => (e ? { ...e, ...p } : e));

  const setContact = (i: number, p: Partial<ContactItem>) =>
    patch({ contacts: (editing?.contacts || []).map((c, idx) => (idx === i ? { ...c, ...p } : c)) });

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast("Фото больше 5 МБ", false); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const r = await fetch(ABOUT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Action": "upload-team-photo", ...auth },
          body: JSON.stringify({ file_base64: (ev.target?.result as string).split(",")[1], file_name: file.name }),
        });
        const d = await r.json();
        if (r.ok) patch({ photo_url: d.url }); else showToast(d.error || "Ошибка загрузки", false);
      } catch { showToast("Ошибка сети", false); }
      finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.first_name.trim()) { showToast("Укажите имя", false); return; }
    setSaving(true);
    try {
      const r = await fetch(ABOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "save-team-member", ...auth },
        body: JSON.stringify(editing.id ? editing : { ...editing, id: undefined }),
      });
      const d = await r.json();
      if (r.ok) { showToast("Карточка сохранена ✓"); setEditing(null); load(); }
      else showToast(d.error || "Ошибка сохранения", false);
    } catch { showToast("Ошибка сети", false); }
    finally { setSaving(false); }
  };

  const remove = async (m: TeamMember) => {
    if (!confirm(`Удалить карточку «${memberName(m)}»?`)) return;
    try {
      await fetch(ABOUT_URL, { method: "DELETE", headers: { "X-Action": "delete-team-member", "X-Member-Id": String(m.id), ...auth } });
      showToast("Карточка удалена");
      load();
    } catch { showToast("Ошибка сети", false); }
  };

  const toggleVisible = async (m: TeamMember) => {
    const next = { ...m, show_on_site: !m.show_on_site };
    setMembers(prev => prev.map(x => (x.id === m.id ? next : x)));
    await fetch(ABOUT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Action": "save-team-member", ...auth },
      body: JSON.stringify(next),
    }).catch(() => showToast("Ошибка сети", false));
  };

  if (editing) {
    const name = memberName(editing);
    const takenStaff = new Set(members.filter(m => m.id !== editing.id && m.staff_id).map(m => m.staff_id));
    return (
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{editing.id ? "Редактирование карточки" : "Новая карточка сотрудника"}</p>
          <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {editing.photo_url ? (
            <img src={editing.photo_url} alt={name} className="w-20 h-20 rounded-2xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-foreground text-background flex items-center justify-center text-xl font-bold">
              {initialsOf(name) || <Icon name="User" size={24} />}
            </div>
          )}
          <div className="space-y-2">
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 text-sm font-medium border border-border rounded-xl px-4 py-2 hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-60">
              {uploading ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Icon name="Upload" size={14} />}
              {editing.photo_url ? "Заменить фото" : "Загрузить фото"}
            </button>
            {editing.photo_url && (
              <button onClick={() => patch({ photo_url: "" })} className="text-[12px] text-muted-foreground hover:text-destructive transition-colors">
                Убрать фото
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} className="hidden" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div><label className={labelCls}>ИМЯ</label>
            <input className={inputCls} value={editing.first_name} onChange={e => patch({ first_name: e.target.value })} /></div>
          <div><label className={labelCls}>ФАМИЛИЯ</label>
            <input className={inputCls} value={editing.last_name} onChange={e => patch({ last_name: e.target.value })} /></div>
        </div>
        <div><label className={labelCls}>ДОЛЖНОСТЬ</label>
          <input className={inputCls} value={editing.position} placeholder="Менеджер по работе с клиентами"
            onChange={e => patch({ position: e.target.value })} /></div>
        <div><label className={labelCls}>ЗА ЧТО ОТВЕЧАЕТ</label>
          <textarea className={inputCls} rows={3} value={editing.description}
            placeholder="Ведёт заказы от заявки до отгрузки, помогает подобрать зерно и обжарку"
            onChange={e => patch({ description: e.target.value })} /></div>

        <div>
          <label className={labelCls}>ПРИВЯЗКА К СОТРУДНИКУ CRM</label>
          <select className={inputCls} value={editing.staff_id ?? ""}
            onChange={e => patch({ staff_id: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Не привязана — только для показа на сайте</option>
            {staff.map(s => (
              <option key={s.id} value={s.id} disabled={takenStaff.has(s.id)}>
                {s.name} ({s.email}){takenStaff.has(s.id) ? " — уже привязан" : ""}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Если привязать, клиенты увидят эту карточку, когда сотрудник закреплён за их заказом — с фото и кнопками связи.
          </p>
        </div>

        <div className="space-y-2">
          <label className={labelCls}>КОНТАКТЫ И СОЦСЕТИ</label>
          {editing.contacts.map((c, i) => {
            const def = getContactType(c.type);
            return (
              <div key={i} className="flex flex-col sm:flex-row gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border">
                <div className="flex items-center gap-2 sm:w-48">
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: def.color }}>
                    <Glyph type={c.type} size={15} />
                  </span>
                  <select className={`${inputCls} flex-1 min-w-0`} value={c.type} onChange={e => setContact(i, { type: e.target.value })}>
                    {CONTACT_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
                  </select>
                </div>
                <input className={`${inputCls} flex-1`} value={c.value} placeholder={def.placeholder}
                  onChange={e => setContact(i, { value: e.target.value })} />
                {c.type === "custom" && (
                  <input className={`${inputCls} sm:w-36`} value={c.label || ""} placeholder="Название"
                    onChange={e => setContact(i, { label: e.target.value })} />
                )}
                <button onClick={() => patch({ contacts: editing.contacts.filter((_, idx) => idx !== i) })}
                  className="px-3 py-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors self-start sm:self-auto">
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {CONTACT_TYPES.map(t => (
              <button key={t.type} onClick={() => patch({ contacts: [...editing.contacts, { type: t.type, value: "" }] })}
                className="flex items-center gap-1.5 text-[12px] font-medium border border-border rounded-full pl-1.5 pr-3 py-1 hover:border-primary/40 hover:bg-primary/5 transition-all">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: t.color }}>
                  <Glyph type={t.type} size={10} />
                </span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer text-sm">
          <input type="checkbox" checked={editing.show_on_site !== false} onChange={e => patch({ show_on_site: e.target.checked })}
            className="w-4 h-4 accent-[hsl(var(--primary))]" />
          Показывать в блоке команды на главной странице
        </label>

        <div className="flex gap-2 pt-1">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40">
            <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} /> Сохранить
          </button>
          <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary/40 transition-colors">
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground max-w-md">
          Карточки сотрудников для сайта и личного кабинета клиентов. Привяжите карточку к сотруднику CRM — клиент увидит её у своего менеджера.
        </p>
        <button onClick={() => setEditing({ ...EMPTY })}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95">
          <Icon name="Plus" size={15} /> Добавить сотрудника
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : members.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-sm text-muted-foreground">
          Пока нет ни одной карточки
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {members.map(m => {
            const name = memberName(m);
            const linked = staff.find(s => s.id === m.staff_id);
            return (
              <div key={m.id} className={`bg-card border border-border rounded-2xl p-4 ${m.show_on_site ? "" : "opacity-60"}`}>
                <div className="flex items-center gap-3 mb-3">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-foreground text-background flex items-center justify-center font-bold flex-shrink-0">
                      {initialsOf(name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{name || "Без имени"}</p>
                    <p className="text-[12px] text-muted-foreground truncate">{m.position || "Должность не указана"}</p>
                    {linked && (
                      <p className="text-[10px] font-mono text-primary mt-0.5 flex items-center gap-1">
                        <Icon name="Link2" size={10} /> CRM: {linked.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-3 min-h-[24px]">
                  {m.contacts.map((c, i) => (
                    <span key={i} className="w-6 h-6 rounded-md flex items-center justify-center text-white" style={{ background: getContactType(c.type).color }}>
                      <Glyph type={c.type} size={12} />
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditing(m)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-medium border border-border rounded-lg py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-all">
                    <Icon name="Pencil" size={13} /> Изменить
                  </button>
                  <button onClick={() => toggleVisible(m)} title={m.show_on_site ? "Скрыть с сайта" : "Показать на сайте"}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name={m.show_on_site ? "Eye" : "EyeOff"} size={14} />
                  </button>
                  <button onClick={() => remove(m)}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors">
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamEditor;
