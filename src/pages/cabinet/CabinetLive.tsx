import Icon from "@/components/ui/icon";
import { TIMELINE } from "./cabinet.types";

interface CabinetLiveProps {
  currentProgress: number;
  totalProgress: number;
}

const CabinetLive = ({ currentProgress, totalProgress }: CabinetLiveProps) => {
  return (
    <div className="space-y-5">
      {/* Статус-карта */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-mono text-amber-500 font-bold tracking-wider">ПРОИЗВОДСТВО · В ПРЯМОМ ЭФИРЕ</span>
            </div>
            <h2 className="font-serif text-2xl font-bold">Заказ ORD-2847</h2>
            <p className="text-muted-foreground text-sm mt-0.5">NORD ROAST · 200 кг · Тёмная обжарка</p>
          </div>
          <div className="text-right bg-amber-500/8 border border-amber-500/20 rounded-2xl px-5 py-3">
            <p className="text-[10px] font-mono text-muted-foreground">ГОТОВНОСТЬ</p>
            <p className="font-serif text-4xl font-bold text-amber-500">
              {Math.round((currentProgress / totalProgress) * 100)}%
            </p>
          </div>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden mb-1.5">
          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
            style={{ width: `${(currentProgress / totalProgress) * 100}%` }} />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>Старт 01.06</span>
          <span>Отгрузка 11.06</span>
        </div>
      </div>

      {/* Таймлайн этапов */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold">Этапы производства</h3>
        </div>
        <div className="p-5 space-y-1">
          {TIMELINE.map((item, i) => {
            const isActive = !item.done && (i === 0 || TIMELINE[i - 1].done);
            return (
              <div key={item.id}>
                <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  item.done  ? "bg-green-500/5 border border-green-500/15"
                  : isActive ? "bg-amber-500/8 border border-amber-500/20"
                  :            "border border-transparent bg-secondary/20"
                }`}>
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.done  ? "bg-green-500/15 text-green-600"
                    : isActive ? "bg-amber-500/15 text-amber-500"
                    :            "bg-secondary text-muted-foreground"
                  }`}>
                    <Icon name={item.done ? "CheckCircle2" : item.icon} fallback="Circle" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${
                        item.done ? "" : isActive ? "text-amber-600" : "text-muted-foreground"
                      }`}>{item.label}</p>
                      {isActive && (
                        <span className="text-[9px] font-mono bg-amber-400/20 text-amber-600 border border-amber-400/30 rounded-full px-2 py-0.5">
                          СЕЙЧАС
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <span className={`text-sm font-mono font-bold flex-shrink-0 ${
                    item.done ? "text-green-600" : isActive ? "text-amber-500" : "text-muted-foreground"
                  }`}>{item.date}</span>
                </div>
                {i < TIMELINE.length - 1 && (
                  <div className="ml-9 flex">
                    <div className={`w-0.5 h-3 ${item.done ? "bg-green-500/30" : "bg-border"}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Трек-номер ожидание */}
      <div className="bg-secondary/30 border border-dashed border-border rounded-2xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
          <Icon name="MapPin" size={18} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Трек-номер появится после отгрузки</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Ожидается 11 июня · СДЭК</p>
        </div>
      </div>
    </div>
  );
};

export default CabinetLive;
