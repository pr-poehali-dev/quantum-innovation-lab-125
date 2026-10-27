import Icon from "@/components/ui/icon";
import type { Tab, HeroData, WorkflowData } from "@/components/admin/landing/landingTypes";

interface Props {
  tab: Tab;
  hero: HeroData | null;
  setHero: (v: HeroData) => void;
  workflow: WorkflowData | null;
  setWorkflow: (v: WorkflowData) => void;
  saving: boolean;
  saveSection: (key: string, data: unknown) => Promise<void>;
  inputCls: string;
  labelCls: string;
}

const HeroWorkflowPanels = ({ tab, hero, setHero, workflow, setWorkflow, saving, saveSection, inputCls, labelCls }: Props) => {
  return (
    <>
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
    </>
  );
};

export default HeroWorkflowPanels;
