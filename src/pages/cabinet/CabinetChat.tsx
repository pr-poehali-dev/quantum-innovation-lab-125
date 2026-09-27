import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useClientAuth } from "@/context/ClientAuthContext";

const CHAT_URL = "https://functions.poehali.dev/f943216e-4ba2-4e31-9cff-fcfc562f339b";
const POLL_MS = 5000;

interface Message {
  id: number;
  sender_type: "client" | "staff";
  staff_name: string | null;
  text: string;
  created_at: string;
}

const CabinetChat = () => {
  const { token, client } = useClientAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = () => {
    if (!token) return;
    fetch(CHAT_URL, { headers: { "X-Action": "list", "X-Client-Token": token } })
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
  }, [token]);

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
        headers: { "Content-Type": "application/json", "X-Action": "send", "X-Client-Token": token },
        body: JSON.stringify({ text }),
      });
      load();
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-2xl">
      <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col" style={{ height: 520 }}>
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Icon name="Headset" size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold">Поддержка КонтрактКофе</p>
            <p className="text-[11px] text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> На связи 24/7
            </p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-sm gap-2">
              <Icon name="MessageCircle" size={28} className="text-muted-foreground/40" />
              Напишите нам — ответит менеджер или поддержка
            </div>
          ) : (
            messages.map(m => (
              <div key={m.id} className={`flex ${m.sender_type === "client" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[75%]">
                  {m.sender_type === "staff" && m.staff_name && (
                    <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">{m.staff_name}</p>
                  )}
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.sender_type === "client" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary/60 rounded-bl-sm"
                  }`}>
                    {m.text}
                  </div>
                  <p className={`text-[10px] text-muted-foreground mt-1 ${m.sender_type === "client" ? "text-right" : ""}`}>
                    {formatTime(m.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-border flex items-center gap-2">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Написать сообщение…"
            disabled={!client}
            className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-60"
          />
          <button onClick={send} disabled={sending || !draft.trim()}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 hover:bg-primary/90 transition-colors disabled:opacity-60">
            <Icon name="Send" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CabinetChat;
