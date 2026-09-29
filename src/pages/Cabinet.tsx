import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import type { Tab } from "./cabinet/cabinet.types";
import CabinetSidebar from "./cabinet/CabinetSidebar";
import CabinetDashboard from "./cabinet/CabinetDashboard";
import CabinetBatches from "./cabinet/CabinetBatches";
import CabinetBatchDetail from "./cabinet/CabinetBatchDetail";
import CabinetDealDetail from "./cabinet/CabinetDealDetail";
import CabinetDocs from "./cabinet/CabinetDocs";
import CabinetMockups from "./cabinet/CabinetMockups";
import CabinetChat from "./cabinet/CabinetChat";
import CabinetProfile from "./cabinet/CabinetProfile";
import ClientLoginGate from "@/components/cabinet/ClientLoginGate";
import { useClientAuth } from "@/context/ClientAuthContext";

const TITLES: Record<Tab, string> = {
  dashboard: "Дашборд",
  batches: "Мои партии",
  docs: "Документы",
  mockups: "Дизайн-макеты",
  chat: "Чат с менеджером",
  profile: "Личные данные",
};

const VALID_TABS: Tab[] = ["dashboard", "batches", "docs", "mockups", "chat", "profile"];

const CabinetContent = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "dashboard";
  const [tab, setTab] = useState<Tab>(VALID_TABS.includes(initialTab) ? initialTab : "dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openBatchId, setOpenBatchId] = useState<number | null>(null);
  const [openDealId, setOpenDealId] = useState<number | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { client, batches, logout, unreadNotifications, fetchNotifications, markNotificationsRead } = useClientAuth();
  const [notifications, setNotifications] = useState<{ id: number; title: string; body: string; created_at: string; is_read: boolean }[]>([]);

  const hasLiveDeal = batches.some(b => b.deals.some(d => d.status === "submitted"));

  const goTab = (t: Tab) => { setTab(t); setOpenBatchId(null); setOpenDealId(null); setSidebarOpen(false); };
  const openBatch = (batchId: number) => { setOpenBatchId(batchId); setOpenDealId(null); };
  const openDeal = (batchId: number, dealId: number) => { setTab("batches"); setOpenBatchId(batchId); setOpenDealId(dealId); };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleNotifications = async () => {
    if (!notifOpen) {
      const list = await fetchNotifications();
      setNotifications(list);
      if (unreadNotifications > 0) markNotificationsRead();
    }
    setNotifOpen(o => !o);
  };

  const currentBatch = openBatchId !== null ? batches.find(b => b.id === openBatchId) : undefined;
  const currentDeal = currentBatch && openDealId !== null ? currentBatch.deals.find(d => d.id === openDealId) : undefined;

  // Хлебные крошки, кликабельные — построены по текущему уровню вложенности
  const crumbs: { label: string; onClick?: () => void }[] = [{ label: "КонтрактКофе" }];
  if (tab === "batches") {
    crumbs.push({ label: "Мои партии", onClick: currentBatch ? () => setOpenBatchId(null) : undefined });
    if (currentBatch) {
      crumbs.push({ label: currentBatch.name, onClick: currentDeal ? () => setOpenDealId(null) : undefined });
      if (currentDeal) crumbs.push({ label: "Заказ" });
    }
  } else {
    crumbs.push({ label: TITLES[tab] });
  }

  return (
    <div className="min-h-screen bg-background flex">
      <CabinetSidebar
        tab={tab}
        setTab={goTab}
        client={client}
        ordersCount={batches.length}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
        hasLiveDeal={hasLiveDeal}
      />

      <div className="flex-1 min-w-0">
        {/* Шапка */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="px-4 md:px-6 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 -ml-1.5 text-muted-foreground flex-shrink-0">
                <Icon name="Menu" size={20} />
              </button>
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-2 min-w-0">
                  {i > 0 && <span className="text-border text-lg hidden sm:inline">/</span>}
                  {c.onClick ? (
                    <button onClick={c.onClick} className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate">
                      {c.label}
                    </button>
                  ) : (
                    <span className={`text-sm truncate ${i === crumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground hidden sm:inline"}`}>
                      {c.label}
                    </span>
                  )}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Уведомления */}
              <div ref={notifRef} className="relative">
                <button onClick={toggleNotifications} className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="Bell" size={17} />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold">Уведомления</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Пока нет уведомлений</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="px-4 py-3 border-b border-border last:border-0">
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-[12px] text-muted-foreground mt-0.5">{n.body}</p>
                            <p className="text-[10px] text-muted-foreground/70 font-mono mt-1">
                              {new Date(n.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="ArrowLeft" size={14} /> <span className="hidden sm:inline">На сайт</span>
              </Link>
              <button onClick={logout} className="md:hidden p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Выйти">
                <Icon name="LogOut" size={17} />
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          {tab === "dashboard" && <CabinetDashboard setTab={goTab} openDeal={openDeal} />}
          {tab === "batches" && !currentBatch && <CabinetBatches onOpenBatch={openBatch} />}
          {tab === "batches" && currentBatch && !currentDeal && (
            <CabinetBatchDetail batch={currentBatch} onOpenDeal={(dealId) => setOpenDealId(dealId)} />
          )}
          {tab === "batches" && currentDeal && <CabinetDealDetail deal={currentDeal} goProfile={() => goTab("profile")} />}
          {tab === "docs" && <CabinetDocs />}
          {tab === "mockups" && <CabinetMockups />}
          {tab === "chat" && <CabinetChat />}
          {tab === "profile" && <CabinetProfile />}
        </div>
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