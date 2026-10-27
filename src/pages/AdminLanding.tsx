import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";
import HeroWorkflowPanels from "@/components/admin/landing/HeroWorkflowPanels";
import AboutFeaturesCtaPanels from "@/components/admin/landing/AboutFeaturesCtaPanels";
import TeamFooterPanels from "@/components/admin/landing/TeamFooterPanels";
import TestimonialsEditor from "@/components/admin/landing/TestimonialsEditor";
import type {
  Tab, HeroData, WorkflowData, FeaturesData, AboutStatsData, TeamMeta, PageOption, FooterData, Testimonial, CtaData,
} from "@/components/admin/landing/landingTypes";
import ContactsEditor from "@/components/admin/landing/ContactsEditor";
import ConsentEditor, { type ConsentData } from "@/components/admin/landing/ConsentEditor";
import { DEFAULT_CONTACTS, type SiteContacts } from "@/lib/siteContent";
import { DEFAULT_CONSENT } from "@/components/ConsentCheckbox";

const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";

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

            <HeroWorkflowPanels tab={tab} hero={hero} setHero={setHero} workflow={workflow} setWorkflow={setWorkflow}
              saving={saving} saveSection={saveSection} inputCls={inputCls} labelCls={labelCls} />

            <AboutFeaturesCtaPanels tab={tab} aboutStats={aboutStats} setAboutStats={setAboutStats}
              features={features} setFeatures={setFeatures} cta={cta} setCta={setCta}
              saving={saving} saveSection={saveSection} inputCls={inputCls} labelCls={labelCls} />

            {/* ── КОНТАКТЫ ── */}
            {tab === "contacts" && (
              <ContactsEditor initial={contacts} saving={saving} inputCls={inputCls} labelCls={labelCls}
                onSave={async data => { setContacts(data); await saveSection("contacts", data); }} />
            )}

            <TeamFooterPanels tab={tab} teamMeta={teamMeta} setTeamMeta={setTeamMeta} footer={footer} setFooter={setFooter}
              showToast={showToast} saving={saving} saveSection={saveSection} inputCls={inputCls} labelCls={labelCls} />

            {/* ── СОГЛАСИЕ ── */}
            {tab === "consent" && (
              <ConsentEditor initial={consent} pages={pages} saving={saving} inputCls={inputCls} labelCls={labelCls}
                onSave={async data => { setConsent(data); await saveSection("consent", data); }} />
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

export default AdminLanding;
