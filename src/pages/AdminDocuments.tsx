import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const DOCS_URL  = "https://functions.poehali.dev/728446de-2a8e-45c1-a93a-a0040873e23b";
const ADMIN_KEY = "kontraktkafe-admin-2024";

interface Doc {
  id: number;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_name: string;
  file_size_kb: number;
  is_visible: boolean;
}

const CATEGORIES = [
  { val: "legal",        label: "Юридические"   },
  { val: "certificates", label: "Сертификаты"   },
  { val: "company",      label: "О компании"    },
  { val: "other",        label: "Прочее"        },
];

const AdminDocuments = () => {
  const [docs,       setDocs]       = useState<Doc[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editId,     setEditId]     = useState<number | null>(null);

  // Форма добавления
  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [category, setCategory] = useState("legal");
  const [fileB64,  setFileB64]  = useState("");
  const [fileName, setFileName] = useState("");
  const [fileUrl,  setFileUrl]  = useState("");
  const [adding,   setAdding]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${DOCS_URL}/all`, { headers: { "X-Admin-Key": ADMIN_KEY } });
      const d = await r.json();
      if (d.documents) setDocs(d.documents);
    } catch { showToast("Ошибка загрузки", false); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "));
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = (ev.target?.result as string).split(",")[1];
      setFileB64(b64);
      setFileUrl("");
    };
    reader.readAsDataURL(file);
  };

  const addDoc = async () => {
    if (!title.trim() || (!fileB64 && !fileUrl.trim())) return;
    setAdding(true);
    try {
      const body: Record<string, unknown> = { title, description: desc, category };
      if (fileB64) {
        body.file_base64 = fileB64;
        body.file_name   = fileName;
      } else {
        body.file_url  = fileUrl;
        body.file_name = fileName || "document.pdf";
      }
      const r = await fetch(`${DOCS_URL}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        showToast("Документ добавлен ✓");
        setTitle(""); setDesc(""); setFileB64(""); setFileName(""); setFileUrl("");
        if (fileRef.current) fileRef.current.value = "";
        load();
      } else showToast("Ошибка загрузки", false);
    } catch { showToast("Ошибка сети", false); }
    finally { setAdding(false); }
  };

  const toggleVisible = async (doc: Doc) => {
    await fetch(`${DOCS_URL}/${doc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
      body: JSON.stringify({ ...doc, is_visible: !doc.is_visible }),
    });
    load();
  };

  const deleteDoc = async (id: number) => {
    if (!confirm("Удалить документ? Файл будет удалён из хранилища.")) return;
    setDeletingId(id);
    try {
      await fetch(`${DOCS_URL}/${id}`, { method: "DELETE", headers: { "X-Admin-Key": ADMIN_KEY } });
      showToast("Удалён");
      load();
    } catch { showToast("Ошибка", false); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Шапка */}
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={16} />
          </Link>
          <div className="w-px h-5 bg-border" />
          <Icon name="FileText" size={16} className="text-primary" />
          <h1 className="font-semibold text-sm">Документы и сертификаты</h1>
          <Link to="/documents" target="_blank"
            className="ml-auto flex items-center gap-1.5 text-[13px] text-primary hover:text-primary/80 transition-colors">
            <Icon name="ExternalLink" size={13} />
            Открыть страницу
          </Link>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium ${
          toast.ok ? "bg-green-500 text-white" : "bg-destructive text-white"
        }`}>
          <Icon name={toast.ok ? "CheckCircle" : "AlertCircle"} size={15} />
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* ── Добавить документ ── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Icon name="Plus" size={16} className="text-primary" />
            <h2 className="font-semibold text-sm">Добавить документ</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1.5">НАЗВАНИЕ *</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Политика конфиденциальности"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1.5">КАТЕГОРИЯ</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                  {CATEGORIES.map(c => <option key={c.val} value={c.val}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-mono text-muted-foreground mb-1.5">ОПИСАНИЕ</label>
              <input value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="Краткое описание документа"
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>

            {/* Загрузка файла или URL */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1.5">ЗАГРУЗИТЬ ФАЙЛ</label>
                <div className="relative border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={onFileChange} className="hidden" />
                  {fileName ? (
                    <div className="flex items-center justify-center gap-2">
                      <Icon name="CheckCircle" size={16} className="text-green-500" />
                      <span className="text-sm text-foreground font-medium truncate max-w-[160px]">{fileName}</span>
                    </div>
                  ) : (
                    <>
                      <Icon name="Upload" size={20} className="text-muted-foreground mx-auto mb-2" />
                      <p className="text-[13px] text-muted-foreground">PDF, DOC, JPG, PNG</p>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1.5">ИЛИ ССЫЛКА НА ФАЙЛ</label>
                <input value={fileUrl} onChange={e => { setFileUrl(e.target.value); setFileB64(""); setFileName(e.target.value.split("/").pop() ?? ""); }}
                  placeholder="https://..."
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                <p className="text-[11px] text-muted-foreground mt-1">Прямая ссылка на документ</p>
              </div>
            </div>

            <button onClick={addDoc} disabled={adding || !title.trim() || (!fileB64 && !fileUrl.trim())}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 active:scale-95">
              <Icon name={adding ? "Loader" : "Upload"} size={14} className={adding ? "animate-spin" : ""} />
              {adding ? "Загружаю..." : "Добавить документ"}
            </button>
          </div>
        </div>

        {/* ── Список документов ── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="List" size={16} className="text-primary" />
              <h2 className="font-semibold text-sm">Все документы</h2>
              <span className="text-[11px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {docs.length}
              </span>
            </div>
            <button onClick={load} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="RefreshCw" size={14} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Нет документов</div>
          ) : (
            <div className="divide-y divide-border">
              {docs.map(doc => (
                <div key={doc.id} className={`flex items-center gap-4 px-5 py-3.5 transition-all ${doc.is_visible ? "" : "opacity-50"}`}>
                  {/* Иконка файла */}
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon name="FileText" size={15} className="text-muted-foreground" />
                  </div>

                  {/* Инфо */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded flex-shrink-0">
                        {CATEGORIES.find(c => c.val === doc.category)?.label ?? doc.category}
                      </span>
                    </div>
                    {doc.description && (
                      <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{doc.description}</p>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Видимость */}
                    <button onClick={() => toggleVisible(doc)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        doc.is_visible
                          ? "text-green-600 hover:bg-green-50"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                      title={doc.is_visible ? "Скрыть" : "Показать"}>
                      <Icon name={doc.is_visible ? "Eye" : "EyeOff"} size={15} />
                    </button>

                    {/* Открыть файл */}
                    {doc.file_url && doc.file_url !== "#" && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all"
                        title="Открыть файл">
                        <Icon name="ExternalLink" size={15} />
                      </a>
                    )}

                    {/* Удалить */}
                    <button onClick={() => deleteDoc(doc.id)} disabled={deletingId === doc.id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
                      title="Удалить">
                      <Icon name={deletingId === doc.id ? "Loader" : "Trash2"} size={15}
                        className={deletingId === doc.id ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDocuments;
