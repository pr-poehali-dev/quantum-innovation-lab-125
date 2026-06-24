import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";
const ADMIN_KEY = "kontraktkafe-admin-2024";

interface Photo   { id: number; url: string; label: string; description: string; sort_order: number }
interface Content { title: string; subtitle: string; bottom_text: string; logo_url?: string }

const AboutAdmin = () => {
  const [content,      setContent]      = useState<Content>({ title: "", subtitle: "", bottom_text: "" });
  const [photos,       setPhotos]       = useState<Photo[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);
  const [newUrl,       setNewUrl]       = useState("");
  const [newLabel,     setNewLabel]     = useState("");
  const [newDesc,      setNewDesc]      = useState("");
  const [addingPhoto,  setAddingPhoto]  = useState(false);
  const [deletingId,   setDeletingId]   = useState<number | null>(null);
  const [logoPreview,  setLogoPreview]  = useState<string>("");
  const [logoB64,      setLogoB64]      = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileRef    = useRef<HTMLInputElement>(null);
  const logoRef    = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(ABOUT_URL);
      const d = await r.json();
      if (d.content) setContent(d.content);
      if (d.photos)  setPhotos(d.photos);
    } catch { showToast("Ошибка загрузки", false); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl);
      setLogoB64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async () => {
    if (!logoB64) return;
    setUploadingLogo(true);
    try {
      const r = await fetch(`${ABOUT_URL}/logo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ file_base64: logoB64 }),
      });
      const d = await r.json();
      if (r.ok) {
        showToast("Логотип обновлён ✓");
        setLogoPreview("");
        setLogoB64("");
        if (logoRef.current) logoRef.current.value = "";
        setContent(c => ({ ...c, logo_url: d.logo_url }));
      } else showToast("Ошибка загрузки", false);
    } catch { showToast("Ошибка сети", false); }
    finally { setUploadingLogo(false); }
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      const r = await fetch(ABOUT_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify(content),
      });
      if (r.ok) showToast("Текст сохранён ✓");
      else showToast("Ошибка сохранения", false);
    } catch { showToast("Ошибка сети", false); }
    finally { setSaving(false); }
  };

  const addPhoto = async () => {
    if (!newUrl.trim()) return;
    setAddingPhoto(true);
    try {
      const r = await fetch(`${ABOUT_URL}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ url: newUrl, label: newLabel, description: newDesc }),
      });
      if (r.ok) {
        showToast("Фото добавлено ✓");
        setNewUrl(""); setNewLabel(""); setNewDesc("");
        load();
      } else showToast("Ошибка добавления", false);
    } catch { showToast("Ошибка сети", false); }
    finally { setAddingPhoto(false); }
  };

  const deletePhoto = async (id: number) => {
    setDeletingId(id);
    try {
      const r = await fetch(`${ABOUT_URL}/photos/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": ADMIN_KEY },
      });
      if (r.ok) { showToast("Фото удалено"); load(); }
      else showToast("Ошибка удаления", false);
    } catch { showToast("Ошибка сети", false); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Шапка */}
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="ArrowLeft" size={16} />
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <Icon name="Settings" size={16} className="text-primary" />
              <span className="font-semibold text-sm">Редактор блока «О компании»</span>
            </div>
          </div>
          <Link to="/" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            На сайт →
          </Link>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium transition-all ${
          toast.ok ? "bg-green-500 text-white" : "bg-destructive text-white"
        }`}>
          <Icon name={toast.ok ? "CheckCircle" : "AlertCircle"} size={15} />
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Блок 0: Логотип ── */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                <Icon name="ImageIcon" fallback="Image" size={16} className="text-primary" />
                <h2 className="font-semibold text-sm">Логотип в шапке</h2>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-6">
                  {/* Текущий логотип */}
                  <div className="flex-shrink-0">
                    <p className="text-[11px] font-mono text-muted-foreground mb-2">ТЕКУЩИЙ</p>
                    <div className="w-32 h-16 rounded-xl border border-border bg-secondary flex items-center justify-center overflow-hidden">
                      {content.logo_url ? (
                        <img src={content.logo_url} alt="Логотип" className="h-8 w-auto object-contain" style={{ filter: "brightness(0)" }} />
                      ) : (
                        <Icon name="Image" size={20} className="text-muted-foreground/40" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">
                      {content.logo_url ? "загружен" : "не задан, используется стандартный"}
                    </p>
                  </div>

                  {/* Загрузка нового */}
                  <div className="flex-1">
                    <p className="text-[11px] font-mono text-muted-foreground mb-2">ЗАГРУЗИТЬ НОВЫЙ (PNG)</p>
                    <div
                      className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/40 transition-colors cursor-pointer mb-3"
                      onClick={() => logoRef.current?.click()}
                    >
                      <input ref={logoRef} type="file" accept="image/png,image/svg+xml" onChange={onLogoFileChange} className="hidden" />
                      {logoPreview ? (
                        <div className="flex items-center justify-center gap-3">
                          <img src={logoPreview} alt="preview" className="h-8 w-auto object-contain" style={{ filter: "brightness(0)" }} />
                          <span className="text-sm text-green-600 font-medium">Готово к загрузке</span>
                        </div>
                      ) : (
                        <>
                          <Icon name="Upload" size={18} className="text-muted-foreground mx-auto mb-1.5" />
                          <p className="text-[13px] text-muted-foreground">Нажмите, чтобы выбрать PNG-файл</p>
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5">Рекомендуем прозрачный фон, ширина от 300px</p>
                        </>
                      )}
                    </div>
                    <button
                      onClick={uploadLogo}
                      disabled={!logoB64 || uploadingLogo}
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 active:scale-95"
                    >
                      <Icon name={uploadingLogo ? "Loader" : "Upload"} size={14} className={uploadingLogo ? "animate-spin" : ""} />
                      {uploadingLogo ? "Загружаю..." : "Загрузить логотип"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Блок 1: Тексты ── */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                <Icon name="Type" size={16} className="text-primary" />
                <h2 className="font-semibold text-sm">Тексты</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-muted-foreground mb-1.5">ЗАГОЛОВОК</label>
                  <input
                    value={content.title}
                    onChange={e => setContent(c => ({ ...c, title: e.target.value }))}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Производство, которому доверяют"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Разделите запятой — вторая часть станет приглушённой</p>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-muted-foreground mb-1.5">ПОДЗАГОЛОВОК</label>
                  <input
                    value={content.subtitle}
                    onChange={e => setContent(c => ({ ...c, subtitle: e.target.value }))}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Полный цикл — от подбора зерна..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-muted-foreground mb-1.5">ТЕКСТ ВНИЗУ БЛОКА</label>
                  <textarea
                    value={content.bottom_text}
                    onChange={e => setContent(c => ({ ...c, bottom_text: e.target.value }))}
                    rows={3}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    placeholder="Работаем с кофейнями..."
                  />
                </div>
                <button
                  onClick={saveContent}
                  disabled={saving}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 active:scale-95">
                  <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} />
                  {saving ? "Сохраняю..." : "Сохранить тексты"}
                </button>
              </div>
            </div>

            {/* ── Блок 2: Фото ── */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="Image" size={16} className="text-primary" />
                  <h2 className="font-semibold text-sm">Фотографии</h2>
                  <span className="text-[11px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {photos.length} фото
                  </span>
                </div>
              </div>

              {/* Текущие фото */}
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((p, i) => (
                  <div key={p.id}
                    className="group relative rounded-xl overflow-hidden border border-border aspect-video bg-secondary">
                    <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <p className="text-[11px] text-white font-semibold text-center px-2">{p.label || "Без подписи"}</p>
                      <button
                        onClick={() => deletePhoto(p.id)}
                        disabled={deletingId === p.id}
                        className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                        <Icon name={deletingId === p.id ? "Loader" : "Trash2"} size={12}
                          className={deletingId === p.id ? "animate-spin" : ""} />
                        Удалить
                      </button>
                    </div>
                    {/* Порядковый номер */}
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                      <span className="text-[10px] text-white font-mono">{i + 1}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Добавить фото */}
              <div className="px-4 pb-4">
                <div className="border border-dashed border-border rounded-xl p-4 space-y-3">
                  <p className="text-[11px] font-mono text-muted-foreground">ДОБАВИТЬ ФОТО</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    <input
                      value={newUrl}
                      onChange={e => setNewUrl(e.target.value)}
                      placeholder="URL фотографии (https://...)"
                      className="md:col-span-3 border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <input
                      value={newLabel}
                      onChange={e => setNewLabel(e.target.value)}
                      placeholder="Название (напр. «Обжарочный цех»)"
                      className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <input
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      placeholder="Описание (коротко)"
                      className="border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <button
                      onClick={addPhoto}
                      disabled={addingPhoto || !newUrl.trim()}
                      className="flex items-center justify-center gap-2 bg-foreground text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-foreground/80 transition-all disabled:opacity-40 active:scale-95">
                      <Icon name={addingPhoto ? "Loader" : "Plus"} size={14}
                        className={addingPhoto ? "animate-spin" : ""} />
                      {addingPhoto ? "Добавляю..." : "Добавить"}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Вставьте прямую ссылку на изображение. Рекомендуемый размер: 800×600px и выше.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Превью ── */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="Eye" size={16} className="text-primary" />
                  <h2 className="font-semibold text-sm">Превью блока</h2>
                </div>
                <a href="/#about" target="_blank"
                  className="flex items-center gap-1.5 text-[13px] text-primary hover:text-primary/80 transition-colors">
                  <Icon name="ExternalLink" size={13} />
                  Открыть на сайте
                </a>
              </div>
              <div className="p-6">
                <div className="bg-foreground text-white rounded-xl p-5">
                  <p className="text-[10px] font-mono text-white/40 mb-2">О КОМПАНИИ</p>
                  <p className="font-serif text-2xl font-bold mb-1">{content.title}</p>
                  <p className="text-sm text-white/50 mb-4">{content.subtitle}</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {photos.slice(0, 3).map(p => (
                      <div key={p.id} className="aspect-video rounded-lg overflow-hidden bg-white/10">
                        <img src={p.url} alt={p.label} className="w-full h-full object-cover opacity-80" />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{content.bottom_text}</p>
                </div>
              </div>
            </div>

          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" />
    </div>
  );
};

export default AboutAdmin;