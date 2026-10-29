import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "@/lib/router-compat";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";
import ContactDrawer from "@/components/contacts/ContactDrawer";
import ImportDialog from "@/components/contacts/ImportDialog";
import TagBadge from "@/components/contacts/TagBadge";
import {
  CONTACTS_URL, STATUS_LABELS, STATUS_STYLES, telHref, firstPhone,
  type Contact, type Tag,
} from "@/lib/contactsApi";

const PAGE = 50;
const selCls = "px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-primary";

const AdminContacts = () => {
  const { token } = useStaffAuth();
  const authHeaders = useMemo(() => ({ "X-Staff-Token": token || "" }), [token]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [cities, setCities] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [consent, setConsent] = useState(false);
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<number | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkTag, setBulkTag] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { const t = setTimeout(() => { setQDebounced(q); setPage(0); }, 350); return () => clearTimeout(t); }, [q]);

  const query = useCallback((extra: Record<string, string> = {}) => {
    const p = new URLSearchParams();
    if (qDebounced) p.set("q", qDebounced);
    if (priority) p.set("priority", priority);
    if (status) p.set("status", status);
    if (city) p.set("city", city);
    if (tagIds.length) p.set("tag", tagIds.join(","));
    if (consent) p.set("consent", "1");
    if (archived) p.set("archived", "1");
    Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return p.toString();
  }, [qDebounced, priority, status, city, tagIds, consent, archived]);

  const loadTags = useCallback(() => {
    fetch(CONTACTS_URL, { headers: { "X-Action": "list-tags", ...authHeaders } }).then(r => r.json()).then(d => setTags(d.tags || []));
  }, [authHeaders]);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${CONTACTS_URL}?${query({ limit: String(PAGE), offset: String(page * PAGE) })}`, { headers: { "X-Action": "list-contacts", ...authHeaders } })
      .then(r => r.json())
      .then(d => { setContacts(d.contacts || []); setTotal(d.total || 0); setCounts(d.status_counts || {}); setCities(d.cities || []); })
      .catch(() => showToast("Ошибка загрузки", false))
      .finally(() => setLoading(false));
  }, [token, query, page, authHeaders]);

  useEffect(() => { loadTags(); }, [loadTags]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); setSelected([]); }, [priority, status, city, tagIds, consent, archived]);

  const tagMap = useMemo(() => new Map(tags.map(t => [t.id, t])), [tags]);
  const toggleTag = (id: number) => setTagIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const pages = Math.max(1, Math.ceil(total / PAGE));

  const exportCsv = async () => {
    const r = await fetch(`${CONTACTS_URL}?${query({ limit: "5000" })}`, { headers: { "X-Action": "list-contacts", ...authHeaders } });
    const d = await r.json();
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Компания", "Телефон", "Email", "Город", "Сегмент", "Приоритет", "Статус", "Теги", "Согласие на рассылку"];
    const lines = (d.contacts as Contact[]).map(c => [
      c.company, c.phone, c.email, c.city, c.segment, c.priority, STATUS_LABELS[c.call_status],
      c.tag_ids.map(i => tagMap.get(i)?.name).filter(Boolean).join(", "), c.mailing_consent ? "да" : "нет",
    ].map(esc).join(";"));
    const blob = new Blob(["\ufeff" + [head.map(esc).join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "contacts.csv";
    a.click();
  };

  const applyBulk = async () => {
    if (!bulkTag || !selected.length) return;
    await fetch(CONTACTS_URL, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Action": "bulk-tags", ...authHeaders },
      body: JSON.stringify({ contact_ids: selected, add_tag_ids: [Number(bulkTag)] }),
    });
    showToast("Тег добавлен ✓"); setSelected([]); setBulkTag(""); load(); loadTags();
  };

  const allOnPage = contacts.length > 0 && contacts.every(c => selected.includes(c.id));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground"><Icon name="ArrowLeft" size={16} /></Link>
            <div className="w-px h-5 bg-border" />
            <Icon name="BookUser" size={16} className="text-primary" />
            <span className="font-semibold text-sm truncate">Контакты</span>
            <span className="text-xs text-muted-foreground">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCsv} className="hidden sm:flex items-center gap-1.5 text-[13px] border border-border px-3 py-1.5 rounded-lg hover:bg-secondary">
              <Icon name="Download" size={13} /> Экспорт
            </button>
            <button onClick={() => setImporting(true)} className="hidden sm:flex items-center gap-1.5 text-[13px] border border-border px-3 py-1.5 rounded-lg hover:bg-secondary">
              <Icon name="Upload" size={13} /> Импорт
            </button>
            <button onClick={() => setOpen("new")} className="flex items-center gap-1.5 text-[13px] bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold">
              <Icon name="Plus" size={13} /> Контакт
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-full shadow-lg text-sm font-medium text-white ${toast.ok ? "bg-green-500" : "bg-destructive"}`}>{toast.msg}</div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск: компания, телефон, почта, город"
              className={`${selCls} w-full pl-9`} />
          </div>
          <select className={selCls} value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="">Любой приоритет</option><option value="1">Приоритет 1</option><option value="2">Приоритет 2</option><option value="3">Приоритет 3</option>
          </select>
          <select className={selCls} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Любой статус</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}{counts[k] ? ` (${counts[k]})` : ""}</option>)}
          </select>
          <select className={selCls} value={city} onChange={e => setCity(e.target.value)}>
            <option value="">Все города</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {tags.filter(t => !cities.includes(t.name)).map(t => <TagBadge key={t.id} tag={{ ...t, name: `${t.name} · ${t.count ?? 0}` }} active={tagIds.includes(t.id)} onClick={() => toggleTag(t.id)} />)}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground">
          <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> Только согласные на рассылку</label>
          <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={archived} onChange={e => setArchived(e.target.checked)} /> Архив</label>
          {(tagIds.length > 0 || priority || status || city || q) && (
            <button className="text-primary" onClick={() => { setTagIds([]); setPriority(""); setStatus(""); setCity(""); setQ(""); }}>Сбросить фильтры</button>
          )}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 text-sm">
            <span>Выбрано: {selected.length}</span>
            <select className={selCls} value={bulkTag} onChange={e => setBulkTag(e.target.value)}>
              <option value="">Добавить тег…</option>
              {tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button onClick={applyBulk} disabled={!bulkTag} className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-[13px] font-semibold disabled:opacity-40">Применить</button>
            <button onClick={() => setSelected([])} className="text-muted-foreground">Снять выбор</button>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : contacts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-16">Ничего не найдено</p>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[32px_1fr_150px_130px_110px_40px] gap-3 px-4 py-2.5 border-b border-border text-[11px] font-mono text-muted-foreground items-center">
                <input type="checkbox" checked={allOnPage} onChange={e => setSelected(e.target.checked ? contacts.map(c => c.id) : [])} />
                <span>КОМПАНИЯ</span><span>ГОРОД</span><span>ТЕЛЕФОН</span><span>СТАТУС</span><span />
              </div>
              {contacts.map(c => (
                <div key={c.id} className="grid md:grid-cols-[32px_1fr_150px_130px_110px_40px] grid-cols-[32px_1fr_40px] gap-3 px-4 py-3 border-b border-border last:border-0 items-center hover:bg-secondary/30 transition-colors">
                  <input type="checkbox" checked={selected.includes(c.id)} onChange={() => setSelected(p => (p.includes(c.id) ? p.filter(x => x !== c.id) : [...p, c.id]))} />
                  <div className="min-w-0 cursor-pointer" onClick={() => setOpen(c.id)}>
                    <div className="flex items-center gap-2">
                      {c.priority && <span className={`text-[10px] font-mono w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${c.priority === 1 ? "bg-red-100 text-red-700" : c.priority === 2 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"}`}>{c.priority}</span>}
                      <p className="text-sm font-medium truncate">{c.company}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.tag_ids.map(i => tagMap.get(i)).filter((t): t is Tag => !!t && !cities.includes(t.name) && !t.name.startsWith("Приоритет")).slice(0, 3).map(t => <TagBadge key={t.id} tag={t} />)}
                    </div>
                    <p className="md:hidden text-xs text-muted-foreground mt-1">{c.city} · {firstPhone(c.phone)}</p>
                  </div>
                  <span className="hidden md:block text-[13px] text-muted-foreground truncate">{c.city || "—"}</span>
                  <span className="hidden md:block text-[13px] truncate">{firstPhone(c.phone) || "—"}</span>
                  <span className={`hidden md:inline-block text-[11px] px-2 py-0.5 rounded-full w-fit ${STATUS_STYLES[c.call_status]}`}>{STATUS_LABELS[c.call_status]}</span>
                  {c.phone ? (
                    <a href={telHref(c.phone)} className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center hover:bg-green-200" title="Позвонить">
                      <Icon name="Phone" size={15} />
                    </a>
                  ) : <span />}
                </div>
              ))}
            </>
          )}
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 text-sm">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40">Назад</button>
            <span className="text-muted-foreground">{page + 1} / {pages}</span>
            <button disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40">Вперёд</button>
          </div>
        )}
      </div>

      {open !== null && (
        <ContactDrawer contactId={open} tags={tags} authHeaders={authHeaders} toast={showToast}
          onClose={() => setOpen(null)} onChanged={load} onTagsChanged={loadTags} />
      )}
      {importing && (
        <ImportDialog authHeaders={authHeaders} onClose={() => setImporting(false)}
          onDone={(a, s) => { setImporting(false); showToast(`Добавлено ${a}, пропущено дублей ${s}`); load(); loadTags(); }} />
      )}
    </div>
  );
};

export default AdminContacts;
