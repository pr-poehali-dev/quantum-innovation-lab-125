import Icon from "@/components/ui/icon";
import { PASSPORT } from "./cabinet.types";

interface CabinetReorderProps {
  passportVer: number;
  reorderVolume: number;
  reorderSent: boolean;
  setReorderVolume: (v: number) => void;
  setReorderSent: (v: boolean) => void;
}

const CabinetReorder = ({
  passportVer,
  reorderVolume,
  reorderSent,
  setReorderVolume,
  setReorderSent,
}: CabinetReorderProps) => {
  const activeVersion = PASSPORT.versions[passportVer];

  return (
    <div className="max-w-2xl">
      {!reorderSent ? (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${PASSPORT.colorTop}, ${PASSPORT.colorBottom})` }}>
                <Icon name="BookOpen" size={15} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{PASSPORT.brand} · {PASSPORT.id}</p>
                <p className="text-[11px] text-muted-foreground">Рецептура {activeVersion.v} от {activeVersion.date} · без изменений</p>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] text-green-600 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Актуальная
              </span>
            </div>
            <div className="p-5 grid grid-cols-3 gap-2">
              {activeVersion.params.map(p => (
                <div key={p.label} className="text-center p-3 bg-secondary/40 rounded-xl border border-border/50">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{p.label}</p>
                  <p className="text-xs font-semibold leading-tight">{p.val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <p className="text-[10px] font-mono text-muted-foreground tracking-wider mb-0.5">ТОЛЬКО МЕНЯЕМ</p>
                <h3 className="font-semibold text-lg">Объём партии</h3>
              </div>
              <span className="font-serif text-4xl font-bold text-primary">{reorderVolume}<span className="text-2xl ml-1">кг</span></span>
            </div>

            <input type="range" min={50} max={1000} step={50} value={reorderVolume}
              onChange={e => setReorderVolume(Number(e.target.value))}
              className="w-full h-2.5 bg-secondary rounded-full appearance-none cursor-pointer mb-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md" />
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-5">
              <span>50 кг</span><span>1 000 кг</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { vol: 100, label: "Как прошлый раз", hint: "~100 кг"    },
                { vol: 300, label: "Увеличить ×2",    hint: "Скидка 5%"  },
                { vol: 600, label: "По максимуму",    hint: "Скидка 10%" },
              ].map(q => (
                <button key={q.vol} onClick={() => setReorderVolume(q.vol)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    reorderVolume === q.vol
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border hover:border-primary/30 hover:bg-secondary/30"
                  }`}>
                  <p className="text-xs font-semibold">{q.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{q.hint}</p>
                </button>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/15 rounded-xl px-5 py-4 flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-mono text-muted-foreground tracking-wider">СТОИМОСТЬ</p>
                <p className="font-serif text-2xl font-bold text-primary">
                  {Math.round(reorderVolume * 487 * (reorderVolume >= 500 ? 0.9 : reorderVolume >= 200 ? 0.95 : 1)).toLocaleString("ru-RU")} ₽
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-muted-foreground tracking-wider">СРОК</p>
                <p className="font-serif text-2xl font-bold">{reorderVolume <= 200 ? 14 : reorderVolume <= 500 ? 18 : 25} <span className="text-base font-normal text-muted-foreground">дн</span></p>
              </div>
            </div>

            <button onClick={() => setReorderSent(true)}
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-base hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.99]">
              <Icon name="RefreshCw" size={18} />
              Повторить партию — {reorderVolume} кг
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl px-8 py-14 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center mb-6">
            <Icon name="CheckCircle" size={40} className="text-green-500" />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-2">Заявка отправлена!</h2>
          <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-1">
            Партия <strong>{reorderVolume} кг · {PASSPORT.brand}</strong> передана менеджеру.
          </p>
          <p className="text-[11px] font-mono text-muted-foreground mb-8">Рецептура {activeVersion.v} · без изменений</p>
          <button onClick={() => setReorderSent(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Создать ещё одну заявку
          </button>
        </div>
      )}
    </div>
  );
};

export default CabinetReorder;
