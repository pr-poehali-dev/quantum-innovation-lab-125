import Icon from "@/components/ui/icon";
import { PASSPORT, MOCKUPS } from "./cabinet.types";
import StatusDot from "./StatusDot";

interface CabinetPassportProps {
  passportVer: number;
  setPassportVer: (i: number) => void;
}

const CabinetPassport = ({ passportVer, setPassportVer }: CabinetPassportProps) => {
  const activeVersion = PASSPORT.versions[passportVer];

  return (
    <div className="grid md:grid-cols-3 gap-5">
      <div className="md:col-span-2 space-y-4">
        {/* Параметры рецептуры */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground tracking-wider mb-0.5">ПАСПОРТ · {PASSPORT.id}</p>
              <h2 className="font-serif text-xl font-bold">{PASSPORT.brand}</h2>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-green-600 bg-green-500/8 border border-green-500/20 rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Активная версия
            </span>
          </div>
          {activeVersion.params.length > 0 && (
            <div className="p-5 grid grid-cols-2 gap-3">
              {activeVersion.params.map(p => (
                <div key={p.label} className="bg-secondary/40 rounded-xl px-4 py-3 border border-border/50">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{p.label}</p>
                  <p className="text-sm font-semibold">{p.val}</p>
                </div>
              ))}
            </div>
          )}
          {activeVersion.note && (
            <div className="mx-5 mb-5 flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
              <Icon name="Info" size={14} className="text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{activeVersion.note}</p>
            </div>
          )}
        </div>

        {/* Макеты */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Макеты упаковки</h3>
            <button className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/80 transition-colors">
              <Icon name="Upload" size={13} /> Загрузить
            </button>
          </div>
          <div className="divide-y divide-border">
            {MOCKUPS.map((m, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-3.5 hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                    <Icon name="FileImage" size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusDot status={m.status} />
                      <span className="text-[11px] text-muted-foreground">
                        {m.status === "approved" ? "Согласован" : "Архив"} · {m.date}
                        {m.comment ? ` · ${m.comment}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-primary/8 text-primary hover:text-primary/80 transition-colors">
                  <Icon name="Download" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* История версий */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden self-start">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">История рецептур</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Кликните для просмотра</p>
        </div>
        <div className="p-4 space-y-2">
          {PASSPORT.versions.map((v, i) => (
            <button key={v.v} onClick={() => setPassportVer(i)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                passportVer === i
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-secondary/30"
              }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold font-mono ${passportVer === i ? "text-primary" : ""}`}>{v.v}</span>
                  {v.active && (
                    <span className="text-[9px] font-mono bg-green-500/15 text-green-600 border border-green-500/25 rounded-full px-1.5 py-0.5">
                      текущая
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">{v.date}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{v.note}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CabinetPassport;
