import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";

const CHAT_URL = "https://functions.poehali.dev/f943216e-4ba2-4e31-9cff-fcfc562f339b";
const POLL_MS = 5000;

interface Message {
  id: number;
  sender_type: "client" | "staff";
  staff_name: string | null;
  text: string;
  created_at: string;
}

interface Props {
  clientId: number;
  height?: number;
}

const StaffChatPanel = ({ clientId, height = 380 }: Props) => {
  const { token } = useStaffAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = () => {
    if (!token) return;
    fetch(CHAT_URL, { headers: { "X-Action": "list", "X-Staff-Token": token, "X-Client-Id": String(clientId) } })
      .then(r => r.json())
      .then(d => setMessages(d.messages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, clientId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !token || sending) return;
    setSending(true);
    setDraft("");
    try {
      await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "send", "X-Staff-Token": token },
        body: JSON.stringify({ text, client_id: clientId }),
      });
      load();
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col" style={{ height }}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-sm gap-2">
            <Icon name="MessageCircle" size={24} className="text-muted-foreground/40" />
            Переписки пока нет
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`flex ${m.sender_type === "staff" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%]">
                {m.sender_type === "staff" && m.staff_name && (
                  <p className="text-[10px] text-muted-foreground mb-0.5 mr-1 text-right">{m.staff_name}</p>
                )}
                <div className={`rounded-2xl px-3 py-2 text-[13px] ${
                  m.sender_type === "staff" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary/60 rounded-bl-sm"
                }`}>
                  {m.text}
                </div>
                <p className={`text-[10px] text-muted-foreground mt-0.5 ${m.sender_type === "staff" ? "text-right" : ""}`}>
                  {formatTime(m.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="px-3 py-2.5 border-t border-border flex items-center gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ответить клиенту…"
          className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
        />
        <button onClick={send} disabled={sending || !draft.trim()}
          className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 hover:bg-primary/90 transition-colors disabled:opacity-60">
          <Icon name="Send" size={14} />
        </button>
      </div>
    </div>
  );
};

export default StaffChatPanel;