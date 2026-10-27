import Icon from "@/components/ui/icon";
import StatsEditor from "@/components/admin/landing/StatsEditor";
import type { Tab, AboutStatsData, FeaturesData, CtaData } from "@/components/admin/landing/landingTypes";

interface Props {
  tab: Tab;
  aboutStats: AboutStatsData | null;
  setAboutStats: (v: AboutStatsData) => void;
  features: FeaturesData | null;
  setFeatures: (v: FeaturesData) => void;
  cta: CtaData | null;
  setCta: (v: CtaData) => void;
  saving: boolean;
  saveSection: (key: string, data: unknown) => Promise<void>;
  inputCls: string;
  labelCls: string;
}

const AboutFeaturesCtaPanels = ({ tab, aboutStats, setAboutStats, features, setFeatures, cta, setCta, saving, saveSection, inputCls, labelCls }: Props) => {
  return (
    <>
            {/* ── О ПРОИЗВОДСТВЕ (плашки блока «Производство, которому доверяют») ── */}
            {tab === "about" && aboutStats && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <p className="text-[13px] text-muted-foreground">
                  Заголовок, описание и фотографии блока редактируются в разделе «Блок О компании». Здесь — надписи и плашки с цифрами.
                </p>
                <div className="grid md:grid-cols-3 gap-3">
                  <div><label className={labelCls}>НАДПИСЬ НАД ЗАГОЛОВКОМ</label>
                    <input className={inputCls} value={aboutStats.eyebrow} onChange={e => setAboutStats({ ...aboutStats, eyebrow: e.target.value })} /></div>
                  <div><label className={labelCls}>СТАТУС ВНИЗУ</label>
                    <input className={inputCls} value={aboutStats.status_label} onChange={e => setAboutStats({ ...aboutStats, status_label: e.target.value })} /></div>
                  <div><label className={labelCls}>ТЕКСТ КНОПКИ</label>
                    <input className={inputCls} value={aboutStats.button_label} onChange={e => setAboutStats({ ...aboutStats, button_label: e.target.value })} /></div>
                </div>
                <StatsEditor title="Плашки с цифрами" stats={aboutStats.stats} inputCls={inputCls}
                  onChange={stats => setAboutStats({ ...aboutStats, stats })} />
                <button onClick={() => saveSection("about_stats", aboutStats)} disabled={saving}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40">
                  <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} /> Сохранить
                </button>
              </div>
            )}

            {/* ── FEATURES ── */}
            {tab === "features" && features && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div><label className={labelCls}>НАДПИСЬ НАД ЗАГОЛОВКОМ</label>
                    <input className={inputCls} value={features.eyebrow ?? "О ПРОИЗВОДСТВЕ"} onChange={e => setFeatures({ ...features, eyebrow: e.target.value })} /></div>
                  <div><label className={labelCls}>ПОДПИСЬ «РАБОТАЕМ С»</label>
                    <input className={inputCls} value={features.segments_label ?? "РАБОТАЕМ С"} onChange={e => setFeatures({ ...features, segments_label: e.target.value })} /></div>
                  <div><label className={labelCls}>ЗАГОЛОВОК СТРОКА 1</label>
                    <input className={inputCls} value={features.title_line1 ?? "Почему выбирают"} onChange={e => setFeatures({ ...features, title_line1: e.target.value })} /></div>
                  <div><label className={labelCls}>ЗАГОЛОВОК СТРОКА 2</label>
                    <input className={inputCls} value={features.title_line2 ?? "КонтрактКофе"} onChange={e => setFeatures({ ...features, title_line2: e.target.value })} /></div>
                </div>
                <div className="pt-3 border-t border-border">
                  <StatsEditor title="Плашки внизу блока" withIcon stats={features.stats ?? []} inputCls={inputCls}
                    onChange={stats => setFeatures({ ...features, stats })} />
                </div>
                <p className="text-sm font-semibold pt-3 border-t border-border">Преимущества ({features.advantages.length})</p>
                {features.advantages.map((a, i) => (
                  <div key={i} className="bg-secondary/30 border border-border rounded-xl p-4 space-y-2">
                    <div className="grid md:grid-cols-2 gap-2">
                      <input className={inputCls} placeholder="Заголовок" value={a.title}
                        onChange={e => { const arr = [...features.advantages]; arr[i] = { ...arr[i], title: e.target.value }; setFeatures({ ...features, advantages: arr }); }} />
                      <input className={inputCls} placeholder="Тег" value={a.tag}
                        onChange={e => { const arr = [...features.advantages]; arr[i] = { ...arr[i], tag: e.target.value }; setFeatures({ ...features, advantages: arr }); }} />
                    </div>
                    <input className={inputCls} placeholder="Краткое описание" value={a.short}
                      onChange={e => { const arr = [...features.advantages]; arr[i] = { ...arr[i], short: e.target.value }; setFeatures({ ...features, advantages: arr }); }} />
                    <textarea className={inputCls} rows={2} placeholder="Подробное описание" value={a.detail}
                      onChange={e => { const arr = [...features.advantages]; arr[i] = { ...arr[i], detail: e.target.value }; setFeatures({ ...features, advantages: arr }); }} />
                  </div>
                ))}

                <div className="pt-2 border-t border-border">
                  <p className="text-sm font-semibold mb-2">Сегменты клиентов ({features.segments.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {features.segments.map((s, i) => (
                      <input key={i} className={inputCls} value={s.name}
                        onChange={e => { const arr = [...features.segments]; arr[i] = { ...arr[i], name: e.target.value }; setFeatures({ ...features, segments: arr }); }} />
                    ))}
                  </div>
                </div>

                <button onClick={() => saveSection("features", features)} disabled={saving}
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40">
                  <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} /> Сохранить
                </button>
              </div>
            )}

            {/* ── CTA (Запустите свой бренд) ── */}
            {tab === "cta" && cta && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div><label className={labelCls}>НАДПИСЬ НАД ЗАГОЛОВКОМ</label>
                  <input className={inputCls} value={cta.eyebrow} onChange={e => setCta({ ...cta, eyebrow: e.target.value })} /></div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div><label className={labelCls}>ЗАГОЛОВОК СТРОКА 1</label>
                    <input className={inputCls} value={cta.title_line1} onChange={e => setCta({ ...cta, title_line1: e.target.value })} /></div>
                  <div><label className={labelCls}>ЗАГОЛОВОК СТРОКА 2</label>
                    <input className={inputCls} value={cta.title_line2} onChange={e => setCta({ ...cta, title_line2: e.target.value })} /></div>
                </div>
                <div><label className={labelCls}>ПОДЗАГОЛОВОК</label>
                  <textarea className={inputCls} rows={2} value={cta.subtitle} onChange={e => setCta({ ...cta, subtitle: e.target.value })} /></div>

                <button onClick={() => saveSection("cta", cta)} disabled={saving}
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40">
                  <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} /> Сохранить
                </button>
              </div>
            )}
    </>
  );
};

export default AboutFeaturesCtaPanels;
