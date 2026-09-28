import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const CHAT_URL = "https://functions.poehali.dev/f943216e-4ba2-4e31-9cff-fcfc562f339b";
const GUEST_TOKEN_KEY = "kk_guest_token";
const POLL_MS = 5000;

interface Message {
  id?: number;
  sender_type: "guest" | "staff";
  staff_name?: string | null;
  text: string;
}

const SUGGESTIONS = [
  "Какой минимальный заказ?",
  "Сколько стоит своя упаковка?",
  "Как долго делается первая партия?",
  "Работаете ли с вендингом?",
];

const AiChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender_type: "staff", staff_name: "КонтрактКофе", text: "Привет! Напишите вопрос — ответит менеджер. Обычно отвечаем в течение получаса в рабочее время." },
  ]);
  const [input, setInput] = useState("");
  const [guestToken, setGuestToken] = useState<string | null>(() => localStorage.getItem(GUEST_TOKEN_KEY));
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = (token: string) => {
    fetch(CHAT_URL, { headers: { "X-Action": "list", "X-Guest-Token": token } })
      .then(r => r.json())
      .then(d => {
        if (d.messages?.length) {
          setMessages([messages[0], ...d.messages.map((m: { sender_type: string; staff_name?: string; text: string; id: number }) => ({
            id: m.id, sender_type: m.sender_type, staff_name: m.staff_name, text: m.text,
          }))]);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!open || !guestToken) return;
    loadMessages(guestToken);
    const interval = setInterval(() => loadMessages(guestToken), POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, guestToken]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const ensureGuestToken = async (): Promise<string> => {
    if (guestToken) return guestToken;
    const r = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Action": "start-guest" },
      body: JSON.stringify({}),
    });
    const d = await r.json();
    localStorage.setItem(GUEST_TOKEN_KEY, d.token);
    setGuestToken(d.token);
    return d.token;
  };

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    setMessages(m => [...m, { sender_type: "guest", text }]);
    setInput("");
    try {
      const token = await ensureGuestToken();
      await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "send", "X-Guest-Token": token },
        body: JSON.stringify({ text }),
      });
      loadMessages(token);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes dotPulse {
          0%, 89% { transform: scale(1); opacity: 1; }
          90% { transform: scale(2.2); opacity: 0.4; }
          100% { transform: scale(1); opacity: 1; }
        }
        .dot-pulse {
          animation: dotPulse 10s ease-out infinite;
        }
        .chat-btn:hover {
          animation: chatBounce 0.4s ease;
        }
        @keyframes chatBounce {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.12) translateY(-3px); }
          65%  { transform: scale(0.96) translateY(1px); }
          100% { transform: scale(1) translateY(0); }
        }
      `}</style>

      <button
        onClick={() => setOpen(o => !o)}
        className="chat-btn fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center"
        aria-label="Открыть чат"
      >
        {open
          ? <Icon name="X" size={22} />
          : <Icon name="MessageCircle" size={22} />
        }
        {!open && (
          <span className="dot-pulse absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
        )}
      </button>

      {/* Панель чата */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[340px] max-w-[calc(100vw-24px)] transition-all duration-300 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ height: 460 }}>

          {/* Заголовок */}
          <div className="bg-primary px-4 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Icon name="Coffee" size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">КонтрактКофе</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-white/70 text-[10px]">Чат с менеджером</p>
              </div>
            </div>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={m.id ?? i} className={`flex ${m.sender_type === "guest" ? "justify-end" : "justify-start"}`}>
                {m.sender_type === "staff" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1 mr-2">
                    <Icon name="Coffee" size={11} className="text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.sender_type === "guest"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Быстрые вопросы */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Ввод */}
          <div className="px-3 pb-3 pt-1 border-t border-border">
            <div className="flex gap-2 items-center bg-secondary rounded-xl px-3 py-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send(input)}
                placeholder="Напишите вопрос..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button onClick={() => send(input)}
                disabled={!input.trim() || sending}
                className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-30 transition-opacity hover:bg-primary/90">
                <Icon name="Send" size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AiChat;
