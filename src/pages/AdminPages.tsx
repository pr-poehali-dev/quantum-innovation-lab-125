import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";

const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";

interface PageFile { id: number; file_url: string; file_name: string }
interface SitePageData {
  id: number; slug: string; title: string; content: string; icon: string;
  sort_order: number; show_in_footer: boolean; is_published: boolean; files: PageFile[];
}

const ICON_OPTIONS = ["FileText", "Scale", "Award", "Building2", "FileSignature", "ShieldCheck", "Info", "HelpCircle"];

const AdminPages = () => {
  const { token } = useStaffAuth();
  const [pages, setPages] = useState<SitePageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploadingFileFor, setUploadingFileFor] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ slug: "", title: "", content: "", icon: "FileText", show_in_footer: true, is_published: true });

  const authHeaders = { "X-Staff-Token": token || "" };

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const load = () => {
    setLoading(true);
    fetch(ABOUT_URL, { headers: { "X-Action": "list-site-pages", ...authHeaders } })
      .then(r => r.json())
      .then(d => setPages(d.pages || []))
      .catch(() => showToast("Ошибка загрузки", false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (token) load(); }, [token]);

  const startEdit = (p: SitePageData) => {
    setEditingId(p.id);
    setCreating(false);
    setForm({ slug: p.slug, title: p.title, content: p.content, icon: p.icon, show_in_footer: p.show_in_footer, is_published: p.is_published });
  };

  const startCreate = () => {
    setCreating(true);
    setEditingId(null);
    setForm({ slug: "", title: "", content: "", icon: "FileText", show_in_footer: true, is_published: true });
  };

  const cancelEdit = () => { setEditingId(null); setCreating(false); };

  const save = async () => {
    if (!form.title.trim() || !form.slug.trim()) { showToast("Заполните название и адрес страницы", false); return; }
    try {
      const r = await fetch(ABOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "save-site-page", ...authHeaders },
        body: JSON.stringify({ id: editingId, ...form }),
      });
      if (r.ok) { showToast("Сохранено ✓"); cancelEdit(); load(); }
      else { const d = await r.json(); showToast(d.error || "Ошибка", false); }
    } catch { showToast("Ошибка сети", false); }
  };

  const deletePage = async (id: number) => {
    if (!confirm("Удалить страницу?")) return;
    try {
      await fetch(ABOUT_URL, { method: "DELETE", headers: { "X-Action": "delete-site-page", "X-Page-Id": String(id), ...authHeaders } });
      showToast("Страница удалена");
      load();
    } catch { showToast("Ошибка сети", false); }
  };

  const onFileChange = (pageId: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFileFor(pageId);
    const reader = new FileReader();
    reader.onload = async ev => {
      const b64 = (ev.target?.result as string).split(",")[1];
      try {
        const r = await fetch(ABOUT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Action": "upload-page-file", ...authHeaders },
          body: JSON.stringify({ page_id: pageId, file_base64: b64, file_name: file.name }),
        });
        if (r.ok) { showToast("Файл прикреплён ✓"); load(); }
        else showToast("Ошибка загрузки", false);
      } catch { showToast("Ошибка сети", false); }
      finally { setUploadingFileFor(null); if (fileRef.current) fileRef.current.value = ""; }
    };
    reader.readAsDataURL(file);
  };

  const deleteFile = async (fileId: number) => {
    try {
      await fetch(ABOUT_URL, { method: "DELETE", headers: { "X-Action": "delete-page-file", "X-File-Id": String(fileId), ...authHeaders } });
      load();
    } catch { showToast("Ошибка сети", false); }
  };

  const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={16} />
          </Link>
          <div className="w-px h-5 bg-border" />
          <Icon name="FileStack" size={16} className="text-primary" />
          <h1 className="font-semibold text-sm">Страницы сайта</h1>
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

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Эти страницы отображаются в футере сайта и доступны по прямой ссылке /page/адрес</p>
          <button onClick={startCreate}
            className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all flex-shrink-0">
            <Icon name="Plus" size={14} /> Новая страница
          </button>
        </div>

        {(creating || editingId !== null) && (
          <div className="bg-card border border-primary/30 rounded-2xl p-6 space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1.5">НАЗВАНИЕ</label>
                <input className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1.5">АДРЕС (slug)</label>
                <input className={inputCls} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="privacy-policy" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-mono text-muted-foreground mb-1.5">ТЕКСТ СТРАНИЦЫ</label>
              <textarea className={inputCls} rows={8} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1.5">ИКОНКА</label>
                <select className={inputCls} value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}>
                  {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.show_in_footer} onChange={e => setForm(f => ({ ...f, show_in_footer: e.target.checked }))} />
                Показывать в футере
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
                Опубликована
              </label>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button onClick={save} className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
                <Icon name="Check" size={14} /> Сохранить
              </button>
              <button onClick={cancelEdit} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-secondary/40 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map(p => (
              <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon name={p.icon} fallback="FileText" size={16} className="text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{p.title}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">/page/{p.slug} {!p.is_published && "· не опубликована"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a href={`/page/${p.slug}`} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors">
                      <Icon name="ExternalLink" size={14} />
                    </a>
                    <button onClick={() => startEdit(p)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors">
                      <Icon name="Pencil" size={14} />
                    </button>
                    <button onClick={() => deletePage(p.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                </div>
                <div className="border-t border-border px-5 py-3 flex items-center gap-2 flex-wrap">
                  {p.files.map(f => (
                    <div key={f.id} className="flex items-center gap-1.5 bg-secondary/50 rounded-full pl-3 pr-1.5 py-1 text-[12px]">
                      <span className="truncate max-w-[140px]">{f.file_name}</span>
                      <button onClick={() => deleteFile(f.id)} className="w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive">
                        <Icon name="X" size={10} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => { setUploadingFileFor(p.id); fileRef.current?.click(); }}
                    className="flex items-center gap-1 text-[12px] text-primary hover:text-primary/80 transition-colors">
                    {uploadingFileFor === p.id ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Icon name="Paperclip" size={12} />}
                    Прикрепить файл
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <input ref={fileRef} type="file" className="hidden"
          onChange={uploadingFileFor ? onFileChange(uploadingFileFor) : undefined} />
      </div>
    </div>
  );
};

export default AdminPages;
