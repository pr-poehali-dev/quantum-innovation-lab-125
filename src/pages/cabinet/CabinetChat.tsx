import { useState, useEffect, useRef, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { useClientAuth } from "@/context/ClientAuthContext";
import ManagerCard from "@/components/cabinet/ManagerCard";
import ChatBubble, { type ChatDoc, type ChatMessage } from "@/components/chat/ChatBubble";
import { fileToBase64, MAX_CHAT_FILE_MB } from "@/lib/fileToBase64";

const CHAT_URL = "https://functions.poehali.dev/f943216e-4ba2-4e31-9cff-fcfc562f339b";
const POLL_MS = 5000;

const CabinetChat = () => {
  const { token, client, batches, refresh } = useClientAuth();
  const [managerOpen, setManagerOpen] = useState(false);
  const managerDeal = batches.flatMap(b => b.deals).find(d => d.assigned_to && d.assigned_name);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [replyDoc, setReplyDoc] = useState<ChatDoc | null>(null);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    if (!token) return;
    fetch(CHAT_URL, { headers: { "X-Action": "list", "X-Client-Token": token } })
      .then(r => r.json())
      .then(d => {
        const next: ChatMessage[] = d.messages || [];
        setMessages(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      })
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

  const pending = useMemo(() => {
    const seen = new Map<number, ChatDoc>();
    messages.forEach(m => { if (m.doc) seen.set(m.doc.id, m.doc); });
    return Array.from(seen.values()).filter(d => d.status === "sent" || d.status === "returned");
  }, [messages]);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_CHAT_FILE_MB * 1024 * 1024) { setError(`Файл больше ${MAX_CHAT_FILE_MB} МБ`); e.target.value = ""; return; }
    setError("");
    setFile(f);
  };

  const clearFile = () => { setFile(null); setReplyDoc(null); if (fileRef.current) fileRef.current.value = ""; };

  const startReply = (doc: ChatDoc) => {
    setReplyDoc(doc);
    setError("");
    fileRef.current?.click();
  };

  const send = async () => {
    const text = draft.trim();
    if ((!text && !file) || !token || sending) return;
    if (replyDoc && !file) { setError("Прикрепите подписанный файл"); return; }
    setSending(true);
    setError("");
    try {
      const body: Record<string, unknown> = { text };
      if (file) { body.file_base64 = await fileToBase64(file); body.file_name = file.name; }
      if (replyDoc) body.doc_id = replyDoc.id;
      const r = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "send", "X-Client-Token": token },
        body: JSON.stringify(body),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error || "Не удалось отправить"); return; }
      setDraft("");
      clearFile();
      load();
      refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-2xl">
      <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-[calc(100dvh-170px)] min-h-[420px] max-h-[720px]">
        <div className="px-4 sm:px-5 py-3.5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Icon name="Headset" size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Поддержка КонтрактКофе</p>
            <p className="text-[11px] text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> На связи 24/7
            </p>
          </div>
          {managerDeal?.assigned_to && (
            <button onClick={() => setManagerOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg px-3 py-2 hover:bg-primary/5 transition-colors flex-shrink-0">
              <Icon name="UserCheck" size={13} /> <span className="hidden min-[400px]:inline">Мой менеджер</span>
            </button>
          )}
        </div>

        {pending.length > 0 && (
          <div className="px-4 sm:px-5 py-2.5 border-b border-border bg-amber-500/5 flex items-center gap-2 text-[12px]">
            <Icon name="FileClock" size={14} className="text-amber-600 flex-shrink-0" />
            <span className="text-amber-800">
              Документы в работе: {pending.map(d => d.title).join(", ")}
            </span>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
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
              <ChatBubble key={m.id} m={m} mine={m.sender_type === "client"} time={formatTime(m.created_at)} onReply={startReply} />
            ))
          )}
        </div>

        {(file || error) && (
          <div className="px-4 pt-2.5 space-y-1.5">
            {file && (
              <div className="flex items-center gap-2 bg-secondary/60 rounded-xl px-3 py-2 text-[12px]">
                <Icon name={replyDoc ? "FileSignature" : "Paperclip"} size={13} className="text-primary flex-shrink-0" />
                <span className="flex-1 min-w-0 truncate">
                  {replyDoc ? `Подписанный «${replyDoc.title}»: ` : ""}{file.name}
                </span>
                <button onClick={clearFile} aria-label="Убрать" className="text-muted-foreground hover:text-foreground"><Icon name="X" size={13} /></button>
              </div>
            )}
            {error && <p className="text-[12px] text-destructive flex items-center gap-1"><Icon name="AlertCircle" size={12} />{error}</p>}
          </div>
        )}

        <div className="px-3 sm:px-4 py-3 border-t border-border flex items-center gap-2">
          <input ref={fileRef} type="file" onChange={pickFile} className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.txt" />
          <button onClick={() => { setReplyDoc(null); fileRef.current?.click(); }} disabled={!client} aria-label="Прикрепить файл"
            className="w-11 h-11 rounded-xl border border-border text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-60">
            <Icon name="Paperclip" size={17} />
          </button>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder={replyDoc ? "Комментарий (необязательно)" : "Написать сообщение…"}
            disabled={!client}
            className="flex-1 min-w-0 px-3 py-2.5 border border-border rounded-xl text-base sm:text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-60"
          />
          <button onClick={send} disabled={sending || (!draft.trim() && !file)} aria-label="Отправить"
            className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 hover:bg-primary/90 transition-colors disabled:opacity-60">
            {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Send" size={16} />}
          </button>
        </div>
      </div>

      {managerOpen && managerDeal?.assigned_to && (
        <ManagerCard staffId={managerDeal.assigned_to} fallbackName={managerDeal.assigned_name} onClose={() => setManagerOpen(false)} />
      )}
    </div>
  );
};

export default CabinetChat;
