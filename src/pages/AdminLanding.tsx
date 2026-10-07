import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";
import ContactsEditor from "@/components/admin/landing/ContactsEditor";
import ConsentEditor, { type ConsentData } from "@/components/admin/landing/ConsentEditor";
import TeamEditor from "@/components/admin/landing/TeamEditor";
import StatsEditor, { type StatItem } from "@/components/admin/landing/StatsEditor";
import { DEFAULT_CONTACTS, type SiteContacts } from "@/lib/siteContent";
import { DEFAULT_CONSENT } from "@/components/ConsentCheckbox";

const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";

type Tab = "hero" | "workflow" | "about" | "features" | "cta" | "contacts" | "team" | "consent" | "footer" | "testimonials";

interface HeroData {
  title_line1: string; title_line2: string; title_line3: string;
  subtitle: string;
  stat1_val: string; stat1_label: string;
  stat2_val: string; stat2_label: string;
  stat3_val: string; stat3_label: string;
  badge1_title: string; badge1_sub: string;
  badge2_title: string; badge2_sub: string;
}

interface WorkflowStep { number: string; icon: string; title: string; sub: string; desc: string; badge: string | null }
interface WorkflowData { eyebrow: string; title_line1: string; title_line2: string; subtitle: string; steps: WorkflowStep[] }

interface Advantage { icon: string; title: string; short: string; detail: string; tag: string }
interface Segment { name: string; icon: string }
interface FeaturesData {
  advantages: Advantage[]; segments: Segment[];
  eyebrow?: string; title_line1?: string; title_line2?: string; segments_label?: string; stats?: StatItem[];
}
interface AboutStatsData { eyebrow: string; status_label: string; button_label: string; stats: StatItem[] }
interface TeamMeta { enabled: boolean; eyebrow: string; title: string; subtitle: string }
interface PageOption { slug: string; title: string }

interface FooterData {
  phone: string; email: string; telegram: string; description: string;
  status_title: string; status_line1: string; status_line2: string; copyright: string;
}

interface Testimonial { id: number; quote: string; author: string; role: string; sort_order: number; active: boolean }
interface CtaData { eyebrow: string; title_line1: string; title_line2: string; subtitle: string }

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "hero", label: "Главный экран", icon: "Layout" },
  { id: "workflow", label: "Кофе под СТМ", icon: "GitBranch" },
  { id: "about", label: "О производстве", icon: "Factory" },
  { id: "features", label: "Почему выбирают", icon: "Sparkles" },
  { id: "cta", label: "Запустите бренд", icon: "Megaphone" },
  { id: "team", label: "Команда", icon: "Users" },
  { id: "contacts", label: "Контакты", icon: "Phone" },
  { id: "consent", label: "Согласие", icon: "ShieldCheck" },
  { id: "footer", label: "Футер", icon: "PanelBottom" },
  { id: "testimonials", label: "Отзывы", icon: "MessageSquareQuote" },
];

const AdminLanding = () => {
  const { token } = useStaffAuth();
  const [tab, setTab] = useState<Tab>("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [hero, setHero] = useState<HeroData | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [features, setFeatures] = useState<FeaturesData | null>(null);
  const [footer, setFooter] = useState<FooterData | null>(null);
  const [cta, setCta] = useState<CtaData | null>(null);
  const [aboutStats, setAboutStats] = useState<AboutStatsData | null>(null);
  const [contacts, setContacts] = useState<SiteContacts>(DEFAULT_CONTACTS);
  const [consent, setConsent] = useState<ConsentData>(DEFAULT_CONSENT);
  const [teamMeta, setTeamMeta] = useState<TeamMeta | null>(null);
  const [pages, setPages] = useState<PageOption[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const authHeaders = { "X-Staff-Token": token || "" };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [sectionsRes, testRes, pagesRes] = await Promise.all([
        fetch(ABOUT_URL, { headers: { "X-Action": "get-sections" } }).then(r => r.json()),
        fetch(ABOUT_URL, { headers: { "X-Action": "list-testimonials", ...authHeaders } }).then(r => r.json()),
        fetch(ABOUT_URL, { headers: { "X-Action": "list-site-pages", ...authHeaders } }).then(r => r.json()).catch(() => ({})),
      ]);
      if (sectionsRes.sections?.hero) setHero(sectionsRes.sections.hero);
      if (sectionsRes.sections?.workflow) setWorkflow(sectionsRes.sections.workflow);
      if (sectionsRes.sections?.features) setFeatures(sectionsRes.sections.features);
      if (sectionsRes.sections?.footer) setFooter(sectionsRes.sections.footer);
      if (sectionsRes.sections?.cta) setCta(sectionsRes.sections.cta);
      if (sectionsRes.sections?.about_stats) setAboutStats(sectionsRes.sections.about_stats);
      if (sectionsRes.sections?.contacts) setContacts({ ...DEFAULT_CONTACTS, ...sectionsRes.sections.contacts });
      if (sectionsRes.sections?.consent) setConsent({ ...DEFAULT_CONSENT, ...sectionsRes.sections.consent });
      if (sectionsRes.sections?.team) setTeamMeta(sectionsRes.sections.team);
      if (pagesRes.pages) setPages(pagesRes.pages.map((p: PageOption) => ({ slug: p.slug, title: p.title })));
      if (testRes.testimonials) setTestimonials(testRes.testimonials);
    } catch { showToast("Ошибка загрузки", false); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) load(); }, [token]);

  const saveSection = async (key: string, data: unknown) => {
    setSaving(true);
    try {
      const r = await fetch(ABOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "save-section", "X-Section-Key": key, ...authHeaders },
        body: JSON.stringify(data),
      });
      if (r.ok) showToast("Сохранено ✓");
      else showToast("Ошибка сохранения", false);
    } catch { showToast("Ошибка сети", false); }
    finally { setSaving(false); }
  };

  const saveTestimonial = async (t: Partial<Testimonial>) => {
    try {
      const r = await fetch(ABOUT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "save-testimonial", ...authHeaders },
        body: JSON.stringify(t),
      });
      if (r.ok) { showToast("Отзыв сохранён ✓"); load(); }
      else showToast("Ошибка сохранения", false);
    } catch { showToast("Ошибка сети", false); }
  };

  const deleteTestimonial = async (id: number) => {
    if (!confirm("Удалить отзыв?")) return;
    try {
      const r = await fetch(ABOUT_URL, {
        method: "DELETE",
        headers: { "X-Action": "delete-testimonial", "X-Testimonial-Id": String(id), ...authHeaders },
      });
      if (r.ok) { showToast("Отзыв удалён"); load(); }
    } catch { showToast("Ошибка сети", false); }
  };

  const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors bg-background";
  const labelCls = "block text-[11px] font-mono text-muted-foreground mb-1.5";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="ArrowLeft" size={16} />
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <Icon name="LayoutTemplate" size={16} className="text-primary" />
              <span className="font-semibold text-sm">Редактор лендинга</span>
            </div>
          </div>
          <Link to="/" target="_blank" className="flex items-center gap-1.5 text-[13px] text-primary hover:text-primary/80 transition-colors">
            <Icon name="ExternalLink" size={13} /> Открыть сайт
          </Link>
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

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-1 mb-6 bg-secondary/40 rounded-xl p-1 w-fit flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── HERO ── */}
            {tab === "hero" && hero && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="grid md:grid-cols-3 gap-3">
                  <div><label className={labelCls}>ЗАГОЛОВОК СТРОКА 1</label>
                    <input className={inputCls} value={hero.title_line1} onChange={e => setHero({ ...hero, title_line1: e.target.value })} /></div>
                  <div><label className={labelCls}>СТРОКА 2 (акцент)</label>
                    <input className={inputCls} value={hero.title_line2} onChange={e => setHero({ ...hero, title_line2: e.target.value })} /></div>
                  <div><label className={labelCls}>СТРОКА 3</label>
                    <input className={inputCls} value={hero.title_line3} onChange={e => setHero({ ...hero, title_line3: e.target.value })} /></div>
                </div>
                <div><label className={labelCls}>ПОДЗАГОЛОВОК</label>
                  <textarea className={inputCls} rows={2} value={hero.subtitle} onChange={e => setHero({ ...hero, subtitle: e.target.value })} /></div>

                <div className="grid md:grid-cols-3 gap-3 pt-2 border-t border-border">
                  {([1, 2, 3] as const).map(n => (
                    <div key={n} className="space-y-2">
                      <label className={labelCls}>СТАТИСТИКА {n}</label>
                      <input className={inputCls} placeholder="Значение" value={hero[`stat${n}_val` as keyof HeroData] as string}
                        onChange={e => setHero({ ...hero, [`stat${n}_val`]: e.target.value })} />
                      <input className={inputCls} placeholder="Подпись" value={hero[`stat${n}_label` as keyof HeroData] as string}
                        onChange={e => setHero({ ...hero, [`stat${n}_label`]: e.target.value })} />
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-3 pt-2 border-t border-border">
                  <div className="space-y-2">
                    <label className={labelCls}>БЕЙДЖ 1 (партия)</label>
                    <input className={inputCls} placeholder="Заголовок" value={hero.badge1_title} onChange={e => setHero({ ...hero, badge1_title: e.target.value })} />
                    <input className={inputCls} placeholder="Подпись" value={hero.badge1_sub} onChange={e => setHero({ ...hero, badge1_sub: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className={labelCls}>БЕЙДЖ 2 (рост)</label>
                    <input className={inputCls} placeholder="Заголовок" value={hero.badge2_title} onChange={e => setHero({ ...hero, badge2_title: e.target.value })} />
                    <input className={inputCls} placeholder="Подпись" value={hero.badge2_sub} onChange={e => setHero({ ...hero, badge2_sub: e.target.value })} />
                  </div>
                </div>

                <button onClick={() => saveSection("hero", hero)} disabled={saving}
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40">
                  <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} /> Сохранить
                </button>
              </div>
            )}

            {/* ── WORKFLOW ── */}
            {tab === "workflow" && workflow && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="grid md:grid-cols-3 gap-3">
                  <div><label className={labelCls}>НАДПИСЬ СВЕРХУ</label>
                    <input className={inputCls} value={workflow.eyebrow} onChange={e => setWorkflow({ ...workflow, eyebrow: e.target.value })} /></div>
                  <div><label className={labelCls}>ЗАГОЛОВОК СТРОКА 1</label>
                    <input className={inputCls} value={workflow.title_line1} onChange={e => setWorkflow({ ...workflow, title_line1: e.target.value })} /></div>
                  <div><label className={labelCls}>ЗАГОЛОВОК СТРОКА 2</label>
                    <input className={inputCls} value={workflow.title_line2} onChange={e => setWorkflow({ ...workflow, title_line2: e.target.value })} /></div>
                </div>
                <div><label className={labelCls}>ПОДЗАГОЛОВОК</label>
                  <input className={inputCls} value={workflow.subtitle} onChange={e => setWorkflow({ ...workflow, subtitle: e.target.value })} /></div>

                <div className="pt-2 border-t border-border space-y-3">
                  <p className="text-sm font-semibold">Шаги ({workflow.steps.length})</p>
                  {workflow.steps.map((step, i) => (
                    <div key={i} className="bg-secondary/30 border border-border rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">{step.number}</span>
                        Шаг {i + 1}
                      </div>
                      <input className={inputCls} placeholder="Заголовок" value={step.title}
                        onChange={e => { const s = [...workflow.steps]; s[i] = { ...s[i], title: e.target.value }; setWorkflow({ ...workflow, steps: s }); }} />
                      <input className={inputCls} placeholder="Подзаголовок" value={step.sub}
                        onChange={e => { const s = [...workflow.steps]; s[i] = { ...s[i], sub: e.target.value }; setWorkflow({ ...workflow, steps: s }); }} />
                      <textarea className={inputCls} rows={2} placeholder="Описание" value={step.desc}
                        onChange={e => { const s = [...workflow.steps]; s[i] = { ...s[i], desc: e.target.value }; setWorkflow({ ...workflow, steps: s }); }} />
                    </div>
                  ))}
                </div>

                <button onClick={() => saveSection("workflow", workflow)} disabled={saving}
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40">
                  <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} /> Сохранить
                </button>
              </div>
            )}

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

            {/* ── КОНТАКТЫ ── */}
            {tab === "contacts" && (
              <ContactsEditor initial={contacts} saving={saving} inputCls={inputCls} labelCls={labelCls}
                onSave={async data => { setContacts(data); await saveSection("contacts", data); }} />
            )}

            {/* ── КОМАНДА ── */}
            {tab === "team" && (
              <div className="space-y-6">
                {teamMeta && (
                  <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold">Блок «Команда» на главной странице</p>
                      <button onClick={() => setTeamMeta({ ...teamMeta, enabled: !teamMeta.enabled })} role="switch" aria-checked={teamMeta.enabled}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${teamMeta.enabled ? "bg-primary" : "bg-border"}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${teamMeta.enabled ? "left-[22px]" : "left-0.5"}`} />
                      </button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div><label className={labelCls}>НАДПИСЬ</label>
                        <input className={inputCls} value={teamMeta.eyebrow} onChange={e => setTeamMeta({ ...teamMeta, eyebrow: e.target.value })} /></div>
                      <div><label className={labelCls}>ЗАГОЛОВОК</label>
                        <input className={inputCls} value={teamMeta.title} onChange={e => setTeamMeta({ ...teamMeta, title: e.target.value })} /></div>
                      <div><label className={labelCls}>ПОДЗАГОЛОВОК</label>
                        <input className={inputCls} value={teamMeta.subtitle} onChange={e => setTeamMeta({ ...teamMeta, subtitle: e.target.value })} /></div>
                    </div>
                    <button onClick={() => saveSection("team", teamMeta)} disabled={saving}
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40">
                      <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} /> Сохранить заголовки
                    </button>
                  </div>
                )}
                <TeamEditor inputCls={inputCls} labelCls={labelCls} showToast={showToast} />
              </div>
            )}

            {/* ── СОГЛАСИЕ ── */}
            {tab === "consent" && (
              <ConsentEditor initial={consent} pages={pages} saving={saving} inputCls={inputCls} labelCls={labelCls}
                onSave={async data => { setConsent(data); await saveSection("consent", data); }} />
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

            {/* ── FOOTER ── */}
            {tab === "footer" && footer && (
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="grid md:grid-cols-3 gap-3">
                  <div><label className={labelCls}>ТЕЛЕФОН</label>
                    <input className={inputCls} value={footer.phone} onChange={e => setFooter({ ...footer, phone: e.target.value })} /></div>
                  <div><label className={labelCls}>EMAIL</label>
                    <input className={inputCls} value={footer.email} onChange={e => setFooter({ ...footer, email: e.target.value })} /></div>
                  <div><label className={labelCls}>TELEGRAM (ссылка)</label>
                    <input className={inputCls} value={footer.telegram} onChange={e => setFooter({ ...footer, telegram: e.target.value })} /></div>
                </div>
                <div><label className={labelCls}>ОПИСАНИЕ ПОД ЛОГОТИПОМ</label>
                  <textarea className={inputCls} rows={2} value={footer.description} onChange={e => setFooter({ ...footer, description: e.target.value })} /></div>

                <div className="grid md:grid-cols-3 gap-3 pt-2 border-t border-border">
                  <div><label className={labelCls}>СТАТУС (заголовок)</label>
                    <input className={inputCls} value={footer.status_title} onChange={e => setFooter({ ...footer, status_title: e.target.value })} /></div>
                  <div><label className={labelCls}>СТАТУС СТРОКА 1</label>
                    <input className={inputCls} value={footer.status_line1} onChange={e => setFooter({ ...footer, status_line1: e.target.value })} /></div>
                  <div><label className={labelCls}>СТАТУС СТРОКА 2</label>
                    <input className={inputCls} value={footer.status_line2} onChange={e => setFooter({ ...footer, status_line2: e.target.value })} /></div>
                </div>
                <div><label className={labelCls}>КОПИРАЙТ</label>
                  <input className={inputCls} value={footer.copyright} onChange={e => setFooter({ ...footer, copyright: e.target.value })} /></div>

                <button onClick={() => saveSection("footer", footer)} disabled={saving}
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40">
                  <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} /> Сохранить
                </button>
              </div>
            )}

            {/* ── TESTIMONIALS ── */}
            {tab === "testimonials" && (
              <TestimonialsEditor
                testimonials={testimonials}
                onSave={saveTestimonial}
                onDelete={deleteTestimonial}
                inputCls={inputCls}
                labelCls={labelCls}
              />
            )}

          </div>
        )}
      </div>
    </div>
  );
};

interface TestEditorProps {
  testimonials: Testimonial[];
  onSave: (t: Partial<Testimonial>) => void;
  onDelete: (id: number) => void;
  inputCls: string;
  labelCls: string;
}

const TestimonialsEditor = ({ testimonials, onSave, onDelete, inputCls }: TestEditorProps) => {
  const [drafts, setDrafts] = useState<Record<number, Testimonial>>({});
  const [newQuote, setNewQuote] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newRole, setNewRole] = useState("");

  const getDraft = (t: Testimonial) => drafts[t.id] || t;
  const updateDraft = (t: Testimonial, patch: Partial<Testimonial>) =>
    setDrafts(prev => ({ ...prev, [t.id]: { ...getDraft(t), ...patch } }));

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <p className="text-sm font-semibold">Новый отзыв</p>
        <textarea className={inputCls} rows={2} placeholder="Текст отзыва" value={newQuote} onChange={e => setNewQuote(e.target.value)} />
        <div className="grid md:grid-cols-2 gap-2">
          <input className={inputCls} placeholder="Имя автора" value={newAuthor} onChange={e => setNewAuthor(e.target.value)} />
          <input className={inputCls} placeholder="Должность, компания" value={newRole} onChange={e => setNewRole(e.target.value)} />
        </div>
        <button
          onClick={() => { onSave({ quote: newQuote, author: newAuthor, role: newRole, sort_order: testimonials.length + 1, active: true }); setNewQuote(""); setNewAuthor(""); setNewRole(""); }}
          disabled={!newQuote.trim() || !newAuthor.trim()}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40">
          <Icon name="Plus" size={14} /> Добавить отзыв
        </button>
      </div>

      {testimonials.map(t => {
        const draft = getDraft(t);
        return (
          <div key={t.id} className={`bg-card border border-border rounded-2xl p-5 space-y-2 ${!draft.active ? "opacity-50" : ""}`}>
            <textarea className={inputCls} rows={2} value={draft.quote} onChange={e => updateDraft(t, { quote: e.target.value })} />
            <div className="grid md:grid-cols-2 gap-2">
              <input className={inputCls} value={draft.author} onChange={e => updateDraft(t, { author: e.target.value })} />
              <input className={inputCls} value={draft.role} onChange={e => updateDraft(t, { role: e.target.value })} />
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-[13px] text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={draft.active} onChange={e => updateDraft(t, { active: e.target.checked })} />
                Показывать на сайте
              </label>
              <div className="flex items-center gap-2">
                <button onClick={() => onSave(draft)}
                  className="flex items-center gap-1.5 text-[13px] text-primary hover:text-primary/80 font-medium px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-all">
                  <Icon name="Save" size={13} /> Сохранить
                </button>
                <button onClick={() => onDelete(t.id)}
                  className="flex items-center gap-1.5 text-[13px] text-destructive hover:text-destructive/80 font-medium px-3 py-1.5 rounded-lg hover:bg-destructive/5 transition-all">
                  <Icon name="Trash2" size={13} /> Удалить
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminLanding;