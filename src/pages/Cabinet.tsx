import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { PASSPORT, TIMELINE, TABS, type Tab } from "./cabinet/cabinet.types";
import CabinetPassport from "./cabinet/CabinetPassport";
import CabinetLive from "./cabinet/CabinetLive";
import CabinetReorder from "./cabinet/CabinetReorder";
import CabinetDocs from "./cabinet/CabinetDocs";
import ClientLoginGate from "@/components/cabinet/ClientLoginGate";
import { useClientAuth } from "@/context/ClientAuthContext";

const CabinetContent = () => {
  const [tab,           setTab]           = useState<Tab>("passport");
  const [passportVer,   setPassportVer]   = useState(0);
  const [reorderVolume, setReorderVolume] = useState(200);
  const [reorderSent,   setReorderSent]   = useState(false);

  const { client, deals, stages, logout } = useClientAuth();
  const activeDeal = deals[0];

  const activeVersion   = PASSPORT.versions[passportVer];
  const currentProgress = TIMELINE.filter(t => t.done).length;
  const totalProgress   = TIMELINE.length;

  const dealProgress = activeDeal
    ? Math.round((activeDeal.stage_order / (stages[stages.length - 1]?.sort_order || 1)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">

      {/* Шапка */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 7h8v3.5A3 3 0 0 1 8 13.5 3 3 0 0 1 3 10.5Z" fill="white" opacity="0.95"/>
                  <path d="M11 8.5h1a1.5 1.5 0 0 1 0 3h-1" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                  <path d="M5 5C5 4.2 5.8 3.8 5.8 3S5 1.8 5 1M7.5 5C7.5 4.2 8.3 3.8 8.3 3S7.5 1.8 7.5 1M10 5C10 4.2 10.8 3.8 10.8 3S10 1.8 10 1" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.8"/>
                </svg>
              </div>
              <span className="font-serif text-sm font-bold">КонтрактКофе</span>
            </Link>
            <span className="text-border text-lg">/</span>
            <span className="text-sm text-muted-foreground">{client?.name || "Личный кабинет"}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="ArrowLeft" size={14} /> На сайт
            </Link>
            <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors" title="Выйти">
              <Icon name="LogOut" size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Реальные сделки клиента */}
      {activeDeal && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[11px] font-mono text-muted-foreground tracking-wider mb-0.5">ТЕКУЩАЯ СДЕЛКА</p>
              <p className="font-serif text-lg font-bold">{activeDeal.brand || `Заказ №${activeDeal.id}`}</p>
              {activeDeal.volume && <p className="text-[12px] text-muted-foreground">{activeDeal.volume} кг</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full text-white" style={{ background: activeDeal.stage_color }}>
                {activeDeal.stage_name}
              </span>
            </div>
            <div className="w-full sm:w-40">
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${dealProgress}%` }} />
              </div>
            </div>
          </div>
          {deals.length > 1 && (
            <p className="text-[12px] text-muted-foreground mt-2">Всего сделок: {deals.length}</p>
          )}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Дашборд-шапка */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Активный бренд */}
          <div className="col-span-2 rounded-2xl overflow-hidden relative"
            style={{ background: `linear-gradient(135deg, ${PASSPORT.colorTop}, ${PASSPORT.colorBottom})`, minHeight: 130 }}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
            <div className="relative p-5 h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-mono text-white/50 tracking-widest mb-1">АКТИВНЫЙ БРЕНД · {PASSPORT.id}</p>
                  <p className="font-serif text-2xl font-bold text-white">{PASSPORT.brand}</p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: PASSPORT.accent }}>{PASSPORT.sub}</p>
                </div>
                <div className="text-[10px] font-mono mt-1 px-2 py-1 rounded-full border border-white/20 text-white/60">
                  {activeVersion.v} · {activeVersion.date}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {["Зерно", "Обжарка", "Упаковка"].map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Live-этапы */}
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:border-amber-400/40 transition-colors"
            onClick={() => setTab("live")}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-mono text-amber-500 font-bold">LIVE</span>
              </div>
              <Icon name="Radio" size={14} className="text-amber-400" />
            </div>
            <div>
              <p className="font-serif text-3xl font-bold">{Math.round((currentProgress / totalProgress) * 100)}%</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">партия готова</p>
            </div>
            <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                style={{ width: `${(currentProgress / totalProgress) * 100}%` }} />
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-2">ORD-2847 · {TIMELINE.find(t => !t.done)?.label}</p>
          </div>

          {/* Отгрузка */}
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-muted-foreground">ОТГРУЗКА</span>
              <Icon name="Truck" size={14} className="text-primary" />
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-primary">11 июн</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">200 кг · СДЭК</p>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-mono text-muted-foreground">ожидание трек-номера</span>
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex gap-1 mb-6 bg-secondary/40 rounded-xl p-1 w-fit overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              <Icon name={t.icon} fallback="Circle" size={14} />
              {t.label}
              {t.badge && (
                <span className="text-[9px] font-mono bg-amber-400/15 text-amber-600 border border-amber-400/25 rounded-full px-1.5 py-0.5">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Контент вкладок */}
        {tab === "passport" && (
          <CabinetPassport
            passportVer={passportVer}
            setPassportVer={setPassportVer}
          />
        )}

        {tab === "live" && (
          <CabinetLive
            currentProgress={currentProgress}
            totalProgress={totalProgress}
          />
        )}

        {tab === "reorder" && (
          <CabinetReorder
            passportVer={passportVer}
            reorderVolume={reorderVolume}
            reorderSent={reorderSent}
            setReorderVolume={setReorderVolume}
            setReorderSent={setReorderSent}
          />
        )}

        {tab === "docs" && (
          <CabinetDocs />
        )}

      </div>
    </div>
  );
};

const Cabinet = () => (
  <ClientLoginGate>
    <CabinetContent />
  </ClientLoginGate>
);

export default Cabinet;