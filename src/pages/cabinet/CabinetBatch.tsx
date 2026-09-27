import Icon from "@/components/ui/icon";
import { TIMELINE, PASSPORT, MANAGER } from "./cabinet.types";
import type { ClientDeal, ClientStage } from "@/context/ClientAuthContext";
import type { Tab } from "./cabinet.types";

interface CabinetBatchProps {
  deals: ClientDeal[];
  stages: ClientStage[];
  setTab: (t: Tab) => void;
}

const CabinetBatch = ({ deals, stages, setTab }: CabinetBatchProps) => {
  const activeDeal = deals[0];
  const maxOrder = stages[stages.length - 1]?.sort_order || 1;
  const dealProgress = activeDeal ? Math.round((activeDeal.stage_order / maxOrder) * 100) : 0;
  const doneCount = TIMELINE.filter(t => t.done).length;

  if (!activeDeal) {
    return (
      <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">
        Активных партий пока нет
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Заголовок заказа */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-serif text-xl font-bold">Заказ №{activeDeal.id}</h1>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full text-white" style={{ background: activeDeal.stage_color }}>
            {activeDeal.stage_name}
          </span>
          {activeDeal.brand && (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-primary/8 text-primary">{activeDeal.brand}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab("reorder")} className="text-xs font-medium border border-border rounded-lg px-3 py-2 hover:bg-secondary/40 transition-colors flex items-center gap-1.5">
            <Icon name="RefreshCw" size={13} /> Повторить
          </button>
          <button onClick={() => setTab("docs")} className="text-xs font-medium border border-border rounded-lg px-3 py-2 hover:bg-secondary/40 transition-colors flex items-center gap-1.5">
            <Icon name="FileText" size={13} /> Документы
          </button>
        </div>
      </div>

      {/* Priority grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-[11px] text-muted-foreground mb-1">Сколько</p>
          <p className="font-serif text-2xl font-bold">{activeDeal.volume || "—"} <span className="text-sm font-normal text-muted-foreground">кг</span></p>
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <p className="text-[11px] text-primary mb-1">Когда отгрузка</p>
          <p className="font-serif text-2xl font-bold text-primary">11 <span className="text-sm font-normal">июня</span></p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Ориентировочно</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-[11px] text-amber-600 mb-1">Готовность</p>
          <p className="font-serif text-2xl font-bold text-amber-600">{dealProgress}%</p>
          <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${dealProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Где сейчас */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 flex-wrap">
        <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
          <Icon name="FlaskConical" size={20} />
        </div>
        <div className="flex-1 min-w-[180px]">
          <p className="text-[11px] text-muted-foreground">Где сейчас</p>
          <p className="font-semibold">{activeDeal.stage_name}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Таймлайн */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <p className="font-semibold text-sm">Этапы производства</p>
            <span className="text-[10px] text-muted-foreground">{doneCount} из {TIMELINE.length} завершено</span>
          </div>
          <div className="p-4 space-y-1">
            {TIMELINE.map((item, i) => {
              const isActive = !item.done && (i === 0 || TIMELINE[i - 1].done);
              return (
                <div key={item.id}>
                  <div className={`flex items-center gap-4 p-3.5 rounded-xl transition-all ${
                    item.done ? "bg-green-500/5 border border-green-500/15"
                    : isActive ? "bg-amber-500/8 border border-amber-500/20"
                    : "border border-transparent bg-secondary/20"
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.done ? "bg-green-500/15 text-green-600"
                      : isActive ? "bg-amber-500/15 text-amber-500"
                      : "bg-secondary text-muted-foreground"
                    }`}>
                      <Icon name={item.done ? "CheckCircle2" : item.icon} fallback="Circle" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-semibold ${item.done ? "" : isActive ? "text-amber-600" : "text-muted-foreground"}`}>{item.label}</p>
                        {isActive && (
                          <span className="text-[9px] font-mono bg-amber-400/20 text-amber-600 border border-amber-400/30 rounded-full px-2 py-0.5">СЕЙЧАС</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <span className={`text-sm font-mono font-bold flex-shrink-0 ${item.done ? "text-green-600" : isActive ? "text-amber-500" : "text-muted-foreground"}`}>{item.date}</span>
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className="ml-8 flex"><div className={`w-0.5 h-3 ${item.done ? "bg-green-500/30" : "bg-border"}`} /></div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mx-4 mb-4 flex items-center gap-2.5 bg-secondary/30 border border-dashed border-border rounded-xl px-4 py-3">
            <Icon name="MapPin" size={15} className="text-muted-foreground flex-shrink-0" />
            <p className="text-[12px] text-muted-foreground">Трек-номер появится после отгрузки · Ожидается 11 июня</p>
          </div>
        </div>

        {/* Правая колонка */}
        <div className="space-y-4">
          {/* Паспорт продукта */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${PASSPORT.colorTop}, ${PASSPORT.colorBottom})` }}>
                {PASSPORT.brand.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{PASSPORT.brand} · {PASSPORT.id}</p>
                <p className="text-[10px] text-muted-foreground">Рецептура v3</p>
              </div>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {PASSPORT.versions[0].params.slice(0, 4).map(p => (
                <div key={p.label} className="bg-secondary/40 rounded-lg px-2.5 py-2 border border-border/50">
                  <p className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5">{p.label}</p>
                  <p className="text-[11px] font-semibold truncate">{p.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Чат мини */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                {MANAGER.initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{MANAGER.name}</p>
                <p className="text-[10px] text-green-600">● Онлайн · ваш менеджер</p>
              </div>
            </div>
            <div className="bg-secondary/40 rounded-xl px-3 py-2.5 text-[12px] text-muted-foreground mb-3">
              {MANAGER.messages[MANAGER.messages.length - 1].text}
            </div>
            <button onClick={() => setTab("chat")} className="w-full text-xs font-medium text-primary border border-primary/30 rounded-lg py-2 hover:bg-primary/5 transition-colors">
              Открыть чат
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CabinetBatch;
