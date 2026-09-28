import Icon from "@/components/ui/icon";
import { SIDEBAR_GROUPS, type Tab } from "./cabinet.types";
import type { ClientProfile } from "@/context/ClientAuthContext";

interface CabinetSidebarProps {
  tab: Tab;
  setTab: (t: Tab) => void;
  client: ClientProfile | null;
  ordersCount: number;
  open: boolean;
  onClose: () => void;
}

const CabinetSidebar = ({ tab, setTab, client, ordersCount, open, onClose }: CabinetSidebarProps) => {
  const initials = (client?.name || "К К")
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-0 h-screen w-64 bg-card border-r border-border flex flex-col
          transition-transform duration-200 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 7h8v3.5A3 3 0 0 1 8 13.5 3 3 0 0 1 3 10.5Z" fill="white" opacity="0.95"/>
              <path d="M11 8.5h1a1.5 1.5 0 0 1 0 3h-1" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              <path d="M5 5C5 4.2 5.8 3.8 5.8 3S5 1.8 5 1M7.5 5C7.5 4.2 8.3 3.8 8.3 3S7.5 1.8 7.5 1M10 5C10 4.2 10.8 3.8 10.8 3S10 1.8 10 1" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.8"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-serif text-sm font-bold leading-tight truncate">КонтрактКофе</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Личный кабинет</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {SIDEBAR_GROUPS.map(group => (
            <div key={group.title}>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-3 mb-1.5">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = tab === item.id;
                  const badgeValue = item.id === "batches" ? ordersCount : item.badge;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setTab(item.id); onClose(); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/8 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <Icon name={item.icon} fallback="Circle" size={15} className="flex-shrink-0" />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {badgeValue !== undefined && badgeValue !== "" && (
                        item.badge === "LIVE" ? (
                          <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-amber-600 bg-amber-500/10 border border-amber-500/25 rounded-full px-1.5 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            LIVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono bg-secondary text-muted-foreground rounded-full px-1.5 py-0.5">
                            {badgeValue}
                          </span>
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{client?.name || "Клиент"}</p>
            <p className="text-[11px] text-muted-foreground truncate">{client?.company || client?.email || ""}</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default CabinetSidebar;