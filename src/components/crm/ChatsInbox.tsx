import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";
import StaffChatPanel from "@/components/crm/StaffChatPanel";

const CHAT_URL = "https://functions.poehali.dev/f943216e-4ba2-4e31-9cff-fcfc562f339b";
const POLL_MS = 6000;

interface ClientConversation {
  client_id: number;
  client_name: string;
  client_company: string | null;
  last_message: string;
  last_at: string;
  last_sender: "client" | "staff";
  unread: number;
}

interface GuestConversation {
  guest_id: number;
  guest_name: string;
  last_message: string;
  last_at: string;
  last_sender: "guest" | "staff";
  unread: number;
}

interface Props {
  onOpenClient?: (clientId: number) => void;
}

type Kind = "clients" | "guests";

const ChatsInbox = ({ onOpenClient }: Props) => {
  const { token } = useStaffAuth();
  const [kind, setKind] = useState<Kind>("clients");
  const [clientConvos, setClientConvos] = useState<ClientConversation[]>([]);
  const [guestConvos, setGuestConvos] = useState<GuestConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClientId, setActiveClientId] = useState<number | null>(null);
  const [activeGuestId, setActiveGuestId] = useState<number | null>(null);

  const load = () => {
    if (!token) return;
    Promise.all([
      fetch(CHAT_URL, { headers: { "X-Action": "list-conversations", "X-Staff-Token": token } }).then(r => r.json()),
      fetch(CHAT_URL, { headers: { "X-Action": "list-guest-conversations", "X-Staff-Token": token } }).then(r => r.json()),
    ]).then(([c, g]) => {
      setClientConvos(c.conversations || []);
      setGuestConvos(g.conversations || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const totalGuestUnread = guestConvos.reduce((s, c) => s + c.unread, 0);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    return sameDay
      ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const activeClient = clientConvos.find(c => c.client_id === activeClientId);
  const activeGuest = guestConvos.find(c => c.guest_id === activeGuestId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Переключатель Клиенты / Гости */}
      <div className="flex gap-1 mb-4 bg-secondary/40 rounded-xl p-1 w-fit">
        <button onClick={() => setKind("clients")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
            kind === "clients" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}>
          <Icon name="Users" size={14} /> Клиенты
        </button>
        <button onClick={() => setKind("guests")}
          className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
            kind === "guests" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}>
          <Icon name="UserRound" size={14} /> Гости
          {totalGuestUnread > 0 && (
            <span className="text-[10px] font-mono bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
              {totalGuestUnread}
            </span>
          )}
        </button>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-5">

        {/* Список диалогов */}
        {kind === "clients" ? (
          <div>
            {clientConvos.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                <Icon name="Inbox" size={24} className="mx-auto mb-2 text-muted-foreground/40" />
                Обращений пока нет
              </div>
            ) : (
              <div className="space-y-1.5">
                {clientConvos.map(c => (
                  <button
                    key={c.client_id}
                    onClick={() => { setActiveClientId(c.client_id); setClientConvos(prev => prev.map(x => x.client_id === c.client_id ? { ...x, unread: 0 } : x)); }}
                    className={`w-full text-left rounded-xl px-3.5 py-3 border transition-all ${
                      activeClientId === c.client_id ? "bg-primary/6 border-primary/30" : "bg-card border-border hover:border-primary/30"
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
        ) : (
          <div>
            {guestConvos.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                <Icon name="Inbox" size={24} className="mx-auto mb-2 text-muted-foreground/40" />
                Гости пока не писали
              </div>
            ) : (
              <div className="space-y-1.5">
                {guestConvos.map(c => (
                  <button
                    key={c.guest_id}
                    onClick={() => { setActiveGuestId(c.guest_id); setGuestConvos(prev => prev.map(x => x.guest_id === c.guest_id ? { ...x, unread: 0 } : x)); }}
                    className={`w-full text-left rounded-xl px-3.5 py-3 border transition-all ${
                      activeGuestId === c.guest_id ? "bg-primary/6 border-primary/30" : "bg-card border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                        <span className="text-[9px] font-mono bg-amber-500/10 text-amber-600 border border-amber-500/25 rounded-full px-1.5 py-0.5">НЕАВТОРИЗОВАН</span>
                        {c.guest_name}
                      </p>
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
        )}

        {/* Активный диалог */}
        <div>
          {kind === "clients" ? (
            activeClientId === null ? (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                <Icon name="MessageSquare" size={28} className="mb-2 text-muted-foreground/40" />
                Выберите диалог слева
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <p className="font-serif text-lg font-bold">{activeClient?.client_name}</p>
                    {activeClient?.client_company && (
                      <span className="text-[12px] text-muted-foreground">· {activeClient.client_company}</span>
                    )}
                  </div>
                  {onOpenClient && (
                    <button onClick={() => onOpenClient(activeClientId)}
                      className="flex items-center gap-1.5 text-[12px] text-primary hover:text-primary/70 transition-colors">
                      <Icon name="ExternalLink" size={12} />
                      Карточка клиента
                    </button>
                  )}
                </div>
                <StaffChatPanel key={`c${activeClientId}`} clientId={activeClientId} height={560} />
              </div>
            )
          ) : (
            activeGuestId === null ? (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                <Icon name="MessageSquare" size={28} className="mb-2 text-muted-foreground/40" />
                Выберите диалог слева
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="font-serif text-lg font-bold">{activeGuest?.guest_name}</p>
                  <span className="text-[10px] font-mono bg-amber-500/10 text-amber-600 border border-amber-500/25 rounded-full px-1.5 py-0.5">НЕАВТОРИЗОВАН</span>
                </div>
                <StaffChatPanel key={`g${activeGuestId}`} guestId={activeGuestId} height={560} />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatsInbox;
