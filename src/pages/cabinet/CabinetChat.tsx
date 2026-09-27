import { useState } from "react";
import Icon from "@/components/ui/icon";
import { MANAGER } from "./cabinet.types";

const CabinetChat = () => {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(MANAGER.messages);

  const send = () => {
    if (!draft.trim()) return;
    setMessages(prev => [...prev, { from: "out", text: draft.trim(), time: "сейчас" }]);
    setDraft("");
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col" style={{ height: 520 }}>
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
            {MANAGER.initials}
          </div>
          <div>
            <p className="text-sm font-semibold">{MANAGER.name}</p>
            <p className="text-[11px] text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Онлайн · ваш менеджер
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "out" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%]">
                <div className={`rounded-2xl px-3.5 py-2.5 text-sm ${
                  m.from === "out" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary/60 rounded-bl-sm"
                }`}>
                  {m.text}
                </div>
                <p className={`text-[10px] text-muted-foreground mt-1 ${m.from === "out" ? "text-right" : ""}`}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-border flex items-center gap-2">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Написать сообщение…"
            className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <button onClick={send} className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 hover:bg-primary/90 transition-colors">
            <Icon name="Send" size={16} />
          </button>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">Демо-режим — реальная отправка сообщений появится позже</p>
    </div>
  );
};

export default CabinetChat;
