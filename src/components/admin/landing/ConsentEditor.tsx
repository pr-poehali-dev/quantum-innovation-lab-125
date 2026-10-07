import { useState } from "react";
import Icon from "@/components/ui/icon";

export interface ConsentData {
  enabled: boolean;
  prefix: string;
  links: { label: string; slug: string }[];
  suffix: string;
}

interface PageOption { slug: string; title: string }

interface Props {
  initial: ConsentData;
  pages: PageOption[];
  saving: boolean;
  onSave: (data: ConsentData) => void;
  inputCls: string;
  labelCls: string;
}

const ConsentEditor = ({ initial, pages, saving, onSave, inputCls, labelCls }: Props) => {
  const [data, setData] = useState<ConsentData>(initial);

  const setLink = (i: number, patch: Partial<ConsentData["links"][number]>) =>
    setData(d => ({ ...d, links: d.links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));

  const pickPage = (i: number, slug: string) => {
    const page = pages.find(p => p.slug === slug);
    setLink(i, { slug, label: data.links[i].label || (page ? page.title.toLowerCase() : "") });
  };

  const preview = [
    data.prefix,
    data.links.map(l => l.label).filter(Boolean).join(", "),
    data.suffix,
  ].filter(Boolean).join(" ");

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Галочка согласия</p>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Показывается в форме заявки и при запросе кода входа в личный кабинет. Без галочки отправить нельзя.
          </p>
        </div>
        <button onClick={() => setData(d => ({ ...d, enabled: !d.enabled }))} role="switch" aria-checked={data.enabled}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${data.enabled ? "bg-primary" : "bg-border"}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${data.enabled ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>

      {data.enabled && (
        <>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>НАЧАЛО ФРАЗЫ</label>
              <input className={inputCls} value={data.prefix} onChange={e => setData({ ...data, prefix: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>КОНЕЦ ФРАЗЫ</label>
              <input className={inputCls} value={data.suffix} onChange={e => setData({ ...data, suffix: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelCls}>ДОКУМЕНТЫ-ССЫЛКИ</label>
            {data.links.map((l, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2">
                <input className={`${inputCls} flex-1`} value={l.label} placeholder="Текст ссылки"
                  onChange={e => setLink(i, { label: e.target.value })} />
                <select className={`${inputCls} sm:w-60`} value={l.slug} onChange={e => pickPage(i, e.target.value)}>
                  {!pages.some(p => p.slug === l.slug) && <option value={l.slug}>{l.slug}</option>}
                  {pages.map(p => <option key={p.slug} value={p.slug}>{p.title}</option>)}
                </select>
                <button onClick={() => setData(d => ({ ...d, links: d.links.filter((_, idx) => idx !== i) }))}
                  className="px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors self-start sm:self-auto">
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            ))}
            <button onClick={() => setData(d => ({ ...d, links: [...d.links, { label: "", slug: pages[0]?.slug || "" }] }))}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              <Icon name="Plus" size={14} /> Добавить документ
            </button>
          </div>

          <div className="bg-secondary/40 border border-border rounded-xl p-4">
            <p className="text-[10px] font-mono text-muted-foreground mb-2">ТАК УВИДИТ КЛИЕНТ</p>
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 w-4 h-4 rounded border border-border bg-background flex-shrink-0" />
              <p className="text-[12px] text-muted-foreground leading-relaxed">{preview}</p>
            </div>
          </div>
        </>
      )}

      <button onClick={() => onSave(data)} disabled={saving}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40">
        <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} /> Сохранить
      </button>
    </div>
  );
};

export default ConsentEditor;
