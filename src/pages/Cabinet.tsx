import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import type { Tab } from "./cabinet/cabinet.types";
import CabinetSidebar from "./cabinet/CabinetSidebar";
import CabinetDashboard from "./cabinet/CabinetDashboard";
import CabinetBatches from "./cabinet/CabinetBatches";
import CabinetDocs from "./cabinet/CabinetDocs";
import CabinetMockups from "./cabinet/CabinetMockups";
import CabinetChat from "./cabinet/CabinetChat";
import ClientLoginGate from "@/components/cabinet/ClientLoginGate";
import { useClientAuth } from "@/context/ClientAuthContext";

const TITLES: Record<Tab, string> = {
  dashboard: "Дашборд",
  batches: "Мои партии",
  docs: "Документы",
  mockups: "Дизайн-макеты",
  chat: "Чат с менеджером",
};

const VALID_TABS: Tab[] = ["dashboard", "batches", "docs", "mockups", "chat"];

const CabinetContent = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "dashboard";
  const [tab, setTab] = useState<Tab>(VALID_TABS.includes(initialTab) ? initialTab : "dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { client, batches, logout } = useClientAuth();

  return (
    <div className="min-h-screen bg-background flex">
      <CabinetSidebar
        tab={tab}
        setTab={setTab}
        client={client}
        ordersCount={batches.length}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0">
        {/* Шапка */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="px-4 md:px-6 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 -ml-1.5 text-muted-foreground">
                <Icon name="Menu" size={20} />
              </button>
              <span className="text-sm text-muted-foreground hidden sm:inline">КонтрактКофе</span>
              <span className="text-border text-lg hidden sm:inline">/</span>
              <span className="text-sm font-medium truncate">{TITLES[tab]}</span>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <Link to="/" className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="ArrowLeft" size={14} /> На сайт
              </Link>
              <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors" title="Выйти">
                <Icon name="LogOut" size={15} />
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          {tab === "dashboard" && <CabinetDashboard setTab={setTab} />}
          {tab === "batches" && <CabinetBatches />}
          {tab === "docs" && <CabinetDocs />}
          {tab === "mockups" && <CabinetMockups />}
          {tab === "chat" && <CabinetChat />}
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