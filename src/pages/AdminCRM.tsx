import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";
import ClientDrawer from "@/components/crm/ClientDrawer";
import DealDrawer from "@/components/crm/DealDrawer";
import KanbanBoard from "@/components/crm/KanbanBoard";
import ChatsInbox from "@/components/crm/ChatsInbox";

const CRM_URL = "https://functions.poehali.dev/0fbf69fe-e1ba-4899-a9c0-98d37524abe1";
const CHAT_URL = "https://functions.poehali.dev/f943216e-4ba2-4e31-9cff-fcfc562f339b";

interface ClientRow {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  company: string | null;
  created_at: string;
  deals_count: number;
  total_amount: number;
}

type Tab = "kanban" | "clients" | "chats";

const AdminCRM = () => {
  const { token } = useStaffAuth();
  const [tab, setTab] = useState<Tab>("kanban");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openClientId, setOpenClientId] = useState<number | null>(null);
  const [openDealId, setOpenDealId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [kanbanRefresh, setKanbanRefresh] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const authHeaders = { "X-Staff-Token": token || "" };

  const loadClients = () => {
    fetch(CRM_URL, { headers: { "X-Action": "list-clients", ...authHeaders } })
      .then(r => r.json())
      .then(d => setClients(d.clients || []))
      .catch(() => showToast("Ошибка загрузки клиентов", false));
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(CRM_URL, { headers: { "X-Action": "list-clients", ...authHeaders } })
      .then(r => r.json())
      .then(c => setClients(c.clients || []))
      .catch(() => showToast("Ошибка загрузки", false))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const loadUnread = () => {
      fetch(CHAT_URL, { headers: { "X-Action": "list-conversations", ...authHeaders } })
        .then(r => r.json())
        .then(d => setUnreadChats((d.conversations || []).reduce((sum: number, c: { unread: number }) => sum + c.unread, 0)))
        .catch(() => {});
    };
    loadUnread();
    const interval = setInterval(loadUnread, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="ArrowLeft" size={16} />
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <Icon name="Users" size={16} className="text-primary" />
              <span className="font-semibold text-sm">Клиенты и сделки</span>
            </div>
          </div>
          <Link to="/admin/stages" className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="GitBranch" size={13} />
            <span className="hidden sm:inline">Этапы сделки</span>
          </Link>
        </div>
      </header>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium ${
          toast.ok ? "bg-green-500 text-white" : "bg-destructive text-white"
        }`}>
          <Icon name={toast.ok ? "Check" : "X"} size={14} />
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Вкладки */}
        <div className="flex gap-1 mb-6 bg-secondary/40 rounded-xl p-1 w-fit">
          <button onClick={() => setTab("kanban")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "kanban" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            <Icon name="Kanban" size={14} />
            Канбан
          </button>
          <button onClick={() => setTab("clients")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "clients" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            <Icon name="Users" size={14} />
            Клиенты
            <span className="text-[10px] font-mono bg-secondary text-muted-foreground rounded-full px-1.5 py-0.5">
              {clients.length}
            </span>
          </button>
          <button onClick={() => setTab("chats")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "chats" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            <Icon name="MessageCircle" size={14} />
            Чаты
            {unreadChats > 0 && (
              <span className="text-[10px] font-mono bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {unreadChats}
              </span>
            )}
          </button>
        </div>

        {tab === "kanban" ? (
          <KanbanBoard onOpenDeal={setOpenDealId} showToast={showToast} refreshSignal={kanbanRefresh} />
        ) : tab === "chats" ? (
          <ChatsInbox onOpenClient={setOpenClientId} />
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {clients.length === 0 && (
              <p className="text-sm text-muted-foreground py-10 text-center">Клиентов пока нет — они появятся сами, как только оформят партию</p>
            )}
            {clients.map(c => (
              <button key={c.id} onClick={() => setOpenClientId(c.id)}
                className="w-full bg-card border border-border rounded-xl px-4 py-3.5 flex items-center justify-between gap-4 hover:border-primary/40 hover:shadow-sm transition-all text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                      {c.phone && <span>{c.phone}</span>}
                      {c.city && <span>{c.city}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-[12px] font-mono text-muted-foreground">{c.deals_count} партий</p>
                    <p className="text-sm font-semibold">{c.total_amount.toLocaleString("ru-RU")} ₽</p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {openClientId !== null && (
        <ClientDrawer
          clientId={openClientId}
          onClose={() => setOpenClientId(null)}
          onChanged={() => { loadClients(); setKanbanRefresh(n => n + 1); }}
          onOpenDeal={dealId => { setOpenClientId(null); setOpenDealId(dealId); }}
          showToast={showToast}
        />
      )}

      {openDealId !== null && (
        <DealDrawer
          dealId={openDealId}
          onClose={() => setOpenDealId(null)}
          onChanged={() => { loadClients(); setKanbanRefresh(n => n + 1); }}
          onOpenClient={clientId => { setOpenDealId(null); setOpenClientId(clientId); }}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default AdminCRM;
