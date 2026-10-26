import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { passportFilled, type Passport } from "@/lib/calcCore";

interface Props {
  origins: { id: number; label: string }[];
  passports: Record<string, Passport>;
  onChange: (v: Record<string, Passport>) => void;
  authHeaders: Record<string, string>;
  aboutUrl: string;
  onError: (msg: string) => void;
}

const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-primary transition-colors";

const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <label className="block">
    <span className="block text-[11px] font-mono tracking-wider text-muted-foreground mb-1">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-muted-foreground mt-1">{hint}</span>}
  </label>
);

const Rating = ({ value, onChange }: { value?: number; onChange: (n: number) => void }) => (
  <div className="flex items-center gap-1.5">
    {[1, 2, 3, 4, 5].map(i => (
      <button key={i} type="button" onClick={() => onChange(value === i ? 0 : i)} aria-label={`${i} из 5`}
        className={`h-8 w-8 rounded-lg text-sm font-mono font-bold border transition-colors ${
          (value ?? 0) >= i ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
        }`}>{i}</button>
    ))}
  </div>
);

const PassportEditor = ({ origins, passports, onChange, authHeaders, aboutUrl, onError }: Props) => {
  const [openId, setOpenId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const get = (id: number): Passport => passports[String(id)] || {};
  const patch = (id: number, p: Partial<Passport>) => onChange({ ...passports, [String(id)]: { ...get(id), ...p } });
  const txt = (id: number, key: keyof Passport, rows = 0, ph = "") => {
    const val = (get(id)[key] as string | undefined) ?? "";
    return rows ? (
      <textarea rows={rows} value={val} placeholder={ph} onChange={e => patch(id, { [key]: e.target.value })} className={`${inputCls} resize-y`} />
    ) : (
      <input value={val} placeholder={ph} onChange={e => patch(id, { [key]: e.target.value })} className={inputCls} />
    );
  };

  const upload = (id: number, file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { onError("Фото больше 5 МБ"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const r = await fetch(aboutUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Action": "upload-passport-photo", ...authHeaders },
          body: JSON.stringify({ file_base64: (ev.target?.result as string).split(",")[1], file_name: file.name }),
        });
        const d = await r.json();
        if (r.ok) patch(id, { photo_url: d.url }); else onError(d.error || "Ошибка загрузки");
      } catch { onError("Ошибка сети"); }
      finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
    };
    reader.readAsDataURL(file);
  };

  if (origins.length === 0) {
    return <div className="bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground">Сорта появятся после загрузки таблицы</div>;
  }

  return (
    <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
      {origins.map(o => {
        const p = get(o.id);
        const open = openId === o.id;
        const filled = passportFilled(p);
        return (
          <div key={o.id}>
            <button type="button" onClick={() => setOpenId(open ? null : o.id)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary/40 transition-colors">
              <span className="flex items-center gap-2.5 min-w-0">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${filled ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  <Icon name={filled ? "FileCheck" : "FileText"} fallback="FileText" size={14} />
                </span>
                <span className="text-sm font-medium truncate">{o.label}</span>
              </span>
              <span className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[11px] ${filled ? "text-primary font-medium" : "text-muted-foreground"}`}>{filled ? "Заполнен" : "Не заполнен"}</span>
                <Icon name={open ? "ChevronUp" : "ChevronDown"} size={15} className="text-muted-foreground" />
              </span>
            </button>

            {open && (
              <div className="px-4 pb-5 pt-1 space-y-4 bg-secondary/20">
                <div className="grid md:grid-cols-[180px_minmax(0,1fr)] gap-4">
                  <div>
                    <span className="block text-[11px] font-mono tracking-wider text-muted-foreground mb-1">ФОТО</span>
                    <div className="aspect-square rounded-xl border border-dashed border-border bg-background overflow-hidden flex items-center justify-center">
                      {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : <Icon name="Image" size={28} className="text-muted-foreground/40" />}
                    </div>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => upload(o.id, e.target.files?.[0])} />
                    <div className="flex gap-2 mt-2">
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                        {uploading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Upload" size={13} />}
                        {p.photo_url ? "Заменить" : "Загрузить"}
                      </button>
                      {p.photo_url && (
                        <button type="button" onClick={() => patch(o.id, { photo_url: "" })} aria-label="Убрать фото"
                          className="px-2.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40">
                          <Icon name="Trash2" size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Field label="ПОДЗАГОЛОВОК">{txt(o.id, "subtitle", 0, "100% арабика · Колумбия")}</Field>
                    <Field label="О ВКУСЕ">{txt(o.id, "taste", 4, "Яркий кофе с заметной кислотностью и средней плотностью…")}</Field>
                    <Field label="ВКУСОВОЙ ПРОФИЛЬ" hint="Через запятую или точку: яблоко · какао · карамель">{txt(o.id, "flavor_profile", 0, "Яблоко · какао · карамель · чернослив")}</Field>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <Field label="РАЗМЕР ЗЕРНА · СКРИН">{txt(o.id, "screen", 0, "18")}</Field>
                  <Field label="ОБРАБОТКА">{txt(o.id, "process", 0, "Мытая")}</Field>
                  <Field label="ОБЖАРКА">{txt(o.id, "roast", 0, "Светлая · под фильтр")}</Field>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <Field label="КИСЛОТНОСТЬ"><Rating value={p.acidity} onChange={n => patch(o.id, { acidity: n })} /></Field>
                  <Field label="ПЛОТНОСТЬ"><Rating value={p.density} onChange={n => patch(o.id, { density: n })} /></Field>
                  <Field label="АРОМАТ"><Rating value={p.aroma} onChange={n => patch(o.id, { aroma: n })} /></Field>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="СПОСОБЫ ПРИГОТОВЛЕНИЯ">{txt(o.id, "methods", 3)}</Field>
                  <Field label="КОМУ ПОДОЙДЁТ">{txt(o.id, "for_whom", 3)}</Field>
                  <Field label="С ЧЕМ СОЧЕТАЕТСЯ">{txt(o.id, "pairing", 2)}</Field>
                  <Field label="ПРОИСХОЖДЕНИЕ И ОСОБЕННОСТИ">{txt(o.id, "story", 2)}</Field>
                </div>

                <p className="text-[11px] text-muted-foreground">Изменения применяются кнопкой «Сохранить» вверху страницы.</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PassportEditor;
