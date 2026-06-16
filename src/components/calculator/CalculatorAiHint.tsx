import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { AI_HINTS, calcBotReply, ChatMsg } from "./calculator.types";


const CalculatorAiHint = ({ step }: { step: number }) => {
  const [open,   setOpen]   = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [msgs,   setMsgs]   = useState<ChatMsg[]>([]);
  const [input,  setInput]  = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hints = AI_HINTS[step] ?? [];

  useEffect(() => {
    // При смене шага сбрасываем активный вопрос, чат не сбрасываем
    setActive(null);
  }, [step]);

  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [msgs, open]);

  const sendMsg = (text: string) => {
    if (!text.trim()) return;
    setMsgs(m => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMsgs(m => [...m, { role: "bot", text: calcBotReply(text) }]);
      setTyping(false);
    }, 700 + Math.random() * 400);
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-full border transition-all ${
          open
            ? "bg-primary border-primary text-white"
            : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
        }`}
      >
        <Icon name="Sparkles" size={13} />
        Помочь с выбором
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={12} />
      </button>

      {open && (
        <div className="mt-3 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Шапка */}
          <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="Bot" size={11} className="text-primary" />
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground">AI-помощник</span>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground/60">
              {step + 1} / 5 шаг
            </span>
          </div>

          {/* Популярные вопросы для текущего шага */}
          {hints.length > 0 && (
            <div className="px-3 pt-3 pb-1 space-y-1.5">
              <p className="text-[10px] font-mono text-muted-foreground px-1 mb-2">ЧАСТЫЕ ВОПРОСЫ</p>
              {hints.map((h, i) => (
                <div key={i}>
                  <button
                    onClick={() => setActive(active === i ? null : i)}
                    className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[13px] transition-all ${
                      active === i
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-secondary hover:bg-secondary/80 text-foreground"
                    }`}
                  >
                    <span>{h.q}</span>
                    <Icon
                      name={active === i ? "ChevronUp" : "ChevronDown"}
                      size={12}
                      className={`flex-shrink-0 ${active === i ? "text-white/70" : "text-muted-foreground"}`}
                    />
                  </button>
                  {active === i && (
                    <div className="mx-1 mt-1 mb-1.5 px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-xl text-[12px] leading-relaxed text-foreground">
                      <div className="flex gap-2">
                        <Icon name="Bot" size={12} className="text-primary flex-shrink-0 mt-0.5" />
                        <span>{h.a}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* История ответов чата (если есть) */}
          {msgs.length > 0 && (
            <div className="px-3 pt-2 space-y-2 max-h-40 overflow-y-auto">
              {msgs.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "bot" && (
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name="Bot" size={10} className="text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-[12px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-secondary text-foreground rounded-tl-sm"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="Bot" size={10} className="text-primary" />
                  </div>
                  <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2 flex gap-1 items-center">
                    {[0, 1, 2].map(d => (
                      <div key={d} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{ animationDelay: `${d * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Поле ввода — всегда внизу */}
          <div className="p-2.5 border-t border-border flex gap-2 mt-1">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMsg(input)}
              placeholder="Задайте свой вопрос..."
              className="flex-1 text-[12px] px-3 py-2 bg-secondary rounded-xl border-none outline-none placeholder:text-muted-foreground text-foreground focus:ring-1 focus:ring-primary/20"
            />
            <button
              onClick={() => sendMsg(input)}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-30 transition-opacity flex-shrink-0 hover:bg-primary/90">
              <Icon name="Send" size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculatorAiHint;