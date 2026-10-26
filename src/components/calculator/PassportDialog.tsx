import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { CalcOrigin } from "@/lib/calcCore";

interface Props {
  origin: CalcOrigin | null;
  onClose: () => void;
  onSelect?: (id: number) => void;
  selected?: boolean;
}

const Block = ({ title, text, icon, className = "" }: { title: string; text?: string; icon: string; className?: string }) =>
  text ? (
    <section className={`rounded-2xl border border-border bg-card p-4 ${className}`}>
      <p className="text-[10px] font-mono tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
        <Icon name={icon} fallback="Circle" size={11} className="text-primary" /> {title}
      </p>
      <p className="text-[13px] leading-relaxed whitespace-pre-line">{text}</p>
    </section>
  ) : null;

const Fact = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-[10px] font-mono tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="text-[13px] font-semibold leading-snug">{value}</p>
    </div>
  ) : null;

const Scale = ({ label, value }: { label: string; value?: number }) =>
  value ? (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-[10px] font-mono tracking-widest text-muted-foreground mb-2">{label}</p>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={`h-2 flex-1 rounded-full transition-colors ${i <= value ? "bg-primary" : "bg-secondary"}`} />
        ))}
        <span className="text-[12px] font-bold font-mono ml-1.5 tabular-nums">{value}/5</span>
      </div>
    </div>
  ) : null;

const PassportDialog = ({ origin, onClose, onSelect, selected }: Props) => {
  const p = origin?.passport;
  const notes = (p?.flavor_profile || "").split(/[·,]/).map(s => s.trim()).filter(Boolean);

  return (
    <Dialog open={!!origin} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[920px] w-[calc(100vw-1rem)] sm:w-[calc(100vw-3rem)] max-h-[92vh] overflow-hidden p-0 gap-0 rounded-2xl sm:rounded-3xl flex flex-col">
        {origin && p && (
          <>
            <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-border bg-card pr-12">
              <p className="text-[10px] font-mono text-primary tracking-widest mb-1 flex items-center gap-1.5">
                <Icon name="BadgeCheck" size={12} /> ПАСПОРТ ПРОДУКТА
              </p>
              <DialogTitle className="font-serif text-xl sm:text-3xl font-bold leading-tight text-left uppercase">{origin.label}</DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground mt-1 text-left">
                {p.subtitle || "Подробная информация о сорте"}
              </DialogDescription>
            </div>

            <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
              <div className="grid md:grid-cols-[260px_minmax(0,1fr)] gap-4">
                <div className="space-y-3">
                  {p.photo_url && (
                    <div className="rounded-2xl border border-border bg-card p-2.5">
                      <img src={p.photo_url} alt={origin.label} className="w-full aspect-square object-cover rounded-xl" />
                    </div>
                  )}
                  {notes.length > 0 && (
                    <div className="rounded-2xl border border-border bg-card p-4">
                      <p className="text-[10px] font-mono tracking-widest text-muted-foreground mb-2">ВКУСОВОЙ ПРОФИЛЬ</p>
                      <div className="flex flex-wrap gap-1.5">
                        {notes.map(n => (
                          <span key={n} className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[12px] font-semibold capitalize">{n}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 min-w-0">
                  <Block title="О ВКУСЕ" text={p.taste} icon="Sparkles" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Fact label="РАЗМЕР ЗЕРНА · СКРИН" value={p.screen} />
                    <Fact label="ОБРАБОТКА" value={p.process} />
                    <Fact label="ОБЖАРКА" value={p.roast} />
                    <Scale label="КИСЛОТНОСТЬ" value={p.acidity} />
                    <Scale label="ПЛОТНОСТЬ" value={p.density} />
                    <Scale label="АРОМАТ" value={p.aroma} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Block title="СПОСОБЫ ПРИГОТОВЛЕНИЯ" text={p.methods} icon="Coffee" />
                    <Block title="КОМУ ПОДОЙДЁТ" text={p.for_whom} icon="Users" />
                  </div>
                </div>
              </div>

              {(p.pairing || p.story) && (
                <div className="mt-4 rounded-2xl border border-border bg-card p-4 space-y-3">
                  {p.pairing && (
                    <div>
                      <p className="text-[10px] font-mono tracking-widest text-muted-foreground mb-1">С ЧЕМ СОЧЕТАЕТСЯ</p>
                      <p className="text-[13px] leading-relaxed whitespace-pre-line">{p.pairing}</p>
                    </div>
                  )}
                  {p.story && (
                    <div>
                      <p className="text-[10px] font-mono tracking-widest text-muted-foreground mb-1">ПРОИСХОЖДЕНИЕ И ОСОБЕННОСТИ</p>
                      <p className="text-[13px] leading-relaxed whitespace-pre-line">{p.story}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-border bg-card">
              <button type="button" onClick={onClose}
                className="px-4 py-2.5 rounded-full text-sm border border-border hover:bg-secondary/60 transition-colors">
                Закрыть
              </button>
              {onSelect && (
                <button type="button" onClick={() => { onSelect(origin.id); onClose(); }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-md shadow-primary/25">
                  <Icon name="Check" size={14} /> {selected ? "Этот сорт выбран" : "Выбрать этот сорт"}
                </button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PassportDialog;
