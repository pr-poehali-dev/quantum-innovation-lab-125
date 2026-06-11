import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "Какой минимальный заказ?",
  "Сколько стоит своя упаковка?",
  "Как долго делается первая партия?",
  "Работаете ли с вендингом?",
];

const BOT_ANSWERS: Record<string, string> = {
  "минимальный заказ": "Минимальная партия — от 50 кг. Это идеально для тестирования рынка или запуска небольшой кофейни.",
  "стоит своя упаковка": "Стоимость упаковки зависит от типа: крафт без принта — включено в базовую цену, с логотипом +25 ₽/кг, фольга с печатью +45 ₽/кг, премиум дизайн +80 ₽/кг.",
  "первая партия": "Срок производства первой партии — от 14 дней для заказов до 200 кг. Для больших объёмов — 18–25 дней.",
  "вендинг": "Да, мы специализируемся на кофе для вендинговых автоматов. Подбираем помол и обжарку под конкретную модель автомата.",
  "default": "Хороший вопрос! Наши менеджеры ответят детально — нажмите «Получить предложение» или напишите на info@kontraktkafe.ru",
};

function getBotReply(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, answer] of Object.entries(BOT_ANSWERS)) {
    if (key !== "default" && lower.includes(key)) return answer;
  }
  return BOT_ANSWERS["default"];
}

const AiChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Привет! Я помощник КонтрактКофе. Отвечу на вопросы о производстве, упаковке и условиях сотрудничества." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", text };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, { role: "assistant", text: getBotReply(text) }]);
      setTyping(false);
    }, 900 + Math.random() * 400);
  };

  return (
    <>
      {/* Кнопка открытия */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all flex items-center justify-center"
        aria-label="Открыть чат"
      >
        {open
          ? <Icon name="X" size={22} />
          : <Icon name="MessageCircle" size={22} />
        }
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
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
                <p className="text-white/70 text-[10px]">AI-помощник · онлайн</p>
              </div>
            </div>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1 mr-2">
                    <Icon name="Coffee" size={11} className="text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1 mr-2">
                  <Icon name="Coffee" size={11} className="text-primary" />
                </div>
                <div className="bg-secondary px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
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
                disabled={!input.trim()}
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
