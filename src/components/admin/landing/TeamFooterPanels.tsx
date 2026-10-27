import Icon from "@/components/ui/icon";
import TeamEditor from "@/components/admin/landing/TeamEditor";
import type { Tab, TeamMeta, FooterData } from "@/components/admin/landing/landingTypes";

interface Props {
  tab: Tab;
  teamMeta: TeamMeta | null;
  setTeamMeta: (v: TeamMeta) => void;
  footer: FooterData | null;
  setFooter: (v: FooterData) => void;
  showToast: (msg: string, ok?: boolean) => void;
  saving: boolean;
  saveSection: (key: string, data: unknown) => Promise<void>;
  inputCls: string;
  labelCls: string;
}

const TeamFooterPanels = ({ tab, teamMeta, setTeamMeta, footer, setFooter, showToast, saving, saveSection, inputCls, labelCls }: Props) => {
  return (
    <>
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
    </>
  );
};

export default TeamFooterPanels;
