import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";
import StaffChatPanel from "@/components/crm/StaffChatPanel";

const CHAT_URL = "https://functions.poehali.dev/f943216e-4ba2-4e31-9cff-fcfc562f339b";
const POLL_MS = 6000;

interface Conversation {
  client_id: number;
  client_name: string;
  client_company: string | null;
  last_message: string;
  last_at: string;
  last_sender: "client" | "staff";
  unread: number;
}

const AdminChats = () => {
  const { token } = useStaffAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);

  const load = () => {
    if (!token) return;
    fetch(CHAT_URL, { headers: { "X-Action": "list-conversations", "X-Staff-Token": token } })
      .then(r => r.json())
      .then(d => setConversations(d.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // При открытии диалога — считаем его прочитанным локально сразу
  const openConversation = (id: number) => {
    setActiveId(id);
    setConversations(prev => prev.map(c => c.client_id === id ? { ...c, unread: 0 } : c));
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    return sameDay
      ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);
  const active = conversations.find(c => c.client_id === activeId);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="ArrowLeft" size={16} />
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <Icon name="MessageCircle" size={16} className="text-primary" />
              <span className="font-semibold text-sm">Чаты с клиентами</span>
              {totalUnread > 0 && (
                <span className="text-[10px] font-mono bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                  {totalUnread}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-[280px_1fr] gap-5">

          {/* Список диалогов */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                <Icon name="Inbox" size={24} className="mx-auto mb-2 text-muted-foreground/40" />
                Обращений пока нет
              </div>
            ) : (
              <div className="space-y-1.5">
                {conversations.map(c => (
                  <button
                    key={c.client_id}
                    onClick={() => openConversation(c.client_id)}
                    className={`w-full text-left rounded-xl px-3.5 py-3 border transition-all ${
                      activeId === c.client_id
                        ? "bg-primary/6 border-primary/30"
                        : "bg-card border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold truncate">{c.client_name}</p>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatTime(c.last_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] text-muted-foreground truncate">
                        {c.last_sender === "staff" && <span className="text-muted-foreground/60">Вы: </span>}
                        {c.last_message}
                      </p>
                      {c.unread > 0 && (
                        <span className="text-[10px] font-mono bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Активный диалог */}
          <div>
            {activeId === null ? (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                <Icon name="MessageSquare" size={28} className="mb-2 text-muted-foreground/40" />
                Выберите диалог слева
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="font-serif text-lg font-bold">{active?.client_name}</p>
                  {active?.client_company && (
                    <span className="text-[12px] text-muted-foreground">· {active.client_company}</span>
                  )}
                </div>
                <StaffChatPanel key={activeId} clientId={activeId} height={560} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChats;