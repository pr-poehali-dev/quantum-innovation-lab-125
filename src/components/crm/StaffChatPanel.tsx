import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";
import ChatBubble, { type ChatDoc, type ChatMessage } from "@/components/chat/ChatBubble";
import { fileToBase64, MAX_CHAT_FILE_MB } from "@/lib/fileToBase64";

const CHAT_URL = "https://functions.poehali.dev/f943216e-4ba2-4e31-9cff-fcfc562f339b";
const CRM_URL = "https://functions.poehali.dev/0fbf69fe-e1ba-4899-a9c0-98d37524abe1";
const POLL_MS = 5000;

interface ClientDocOption { id: number; title: string; status: string; deal_id: number; deal_title: string }

interface Props {
  clientId?: number;
  guestId?: number;
  height?: number;
}

const STATUS_HINT: Record<string, string> = { todo: "не отправлен", sent: "ждёт подписи", returned: "получен", done: "оформлен" };

const StaffChatPanel = ({ clientId, guestId, height = 380 }: Props) => {
  const { token } = useStaffAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docOptions, setDocOptions] = useState<ClientDocOption[]>([]);
  const [docMenu, setDocMenu] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ClientDocOption | null>(null);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const idHeader: Record<string, string> = clientId ? { "X-Client-Id": String(clientId) } : { "X-Guest-Id": String(guestId) };
  const canAttach = !!clientId;

  const load = () => {
    if (!token) return;
    fetch(CHAT_URL, { headers: { "X-Action": "list", "X-Staff-Token": token, ...idHeader } })
      .then(r => r.json())
      .then(d => {
        const next: ChatMessage[] = d.messages || [];
        setMessages(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadDocs = () => {
    if (!token || !clientId) return;
    fetch(CRM_URL, { headers: { "X-Action": "list-client-documents", "X-Staff-Token": token, "X-Client-Id": String(clientId) } })
      .then(r => r.json()).then(d => setDocOptions(d.documents || [])).catch(() => {});
  };

  useEffect(() => {
    load();
    loadDocs();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, clientId, guestId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_CHAT_FILE_MB * 1024 * 1024) { setError(`Файл больше ${MAX_CHAT_FILE_MB} МБ`); e.target.value = ""; return; }
    setError("");
    setFile(f);
  };

  const reset = () => { setFile(null); setSelectedDoc(null); setDocMenu(false); if (fileRef.current) fileRef.current.value = ""; };

  const send = async () => {
    const text = draft.trim();
    if ((!text && !file && !selectedDoc) || !token || sending) return;
    setSending(true);
    setError("");
    try {
      const body: Record<string, unknown> = { text, client_id: clientId, guest_id: guestId };
      if (file) { body.file_base64 = await fileToBase64(file); body.file_name = file.name; }
      if (selectedDoc) body.doc_id = selectedDoc.id;
      const r = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "send", "X-Staff-Token": token },
        body: JSON.stringify(body),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error || "Не удалось отправить"); return; }
      setDraft("");
      reset();
      load();
      loadDocs();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSending(false);
    }
  };

  const mark = async (docId: number, status: ChatDoc["status"]) => {
    if (!token) return;
    await fetch(CRM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Action": "set-document-status", "X-Staff-Token": token },
      body: JSON.stringify({ id: docId, status }),
    }).catch(() => {});
    load();
    loadDocs();
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
            <ChatBubble key={m.id} m={m} mine={m.sender_type === "staff"} time={formatTime(m.created_at)} canMark onMark={mark} />
          ))
        )}
      </div>

      {(file || selectedDoc || error) && (
        <div className="px-3 pt-2 space-y-1.5">
          {selectedDoc && (
            <div className="flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-lg px-3 py-1.5 text-[12px]">
              <Icon name="FileText" size={13} className="text-primary flex-shrink-0" />
              <span className="flex-1 min-w-0 truncate">Документ: <b>{selectedDoc.title}</b> · {selectedDoc.deal_title}</span>
              <button onClick={() => setSelectedDoc(null)} aria-label="Убрать"><Icon name="X" size={13} className="text-muted-foreground" /></button>
            </div>
          )}
          {file && (
            <div className="flex items-center gap-2 bg-secondary/60 rounded-lg px-3 py-1.5 text-[12px]">
              <Icon name="Paperclip" size={13} className="text-primary flex-shrink-0" />
              <span className="flex-1 min-w-0 truncate">{file.name}</span>
              <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }} aria-label="Убрать"><Icon name="X" size={13} className="text-muted-foreground" /></button>
            </div>
          )}
          {error && <p className="text-[12px] text-destructive">{error}</p>}
        </div>
      )}

      <div className="px-3 py-2.5 border-t border-border flex items-center gap-2 relative">
        {canAttach && (
          <>
            <input ref={fileRef} type="file" onChange={pickFile} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.txt" />
            <button onClick={() => fileRef.current?.click()} aria-label="Прикрепить файл" title="Прикрепить файл"
              className="w-9 h-9 rounded-lg border border-border text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-primary hover:border-primary/40 transition-colors">
              <Icon name="Paperclip" size={15} />
            </button>
            <button onClick={() => { loadDocs(); setDocMenu(o => !o); }} aria-label="Отправить документ" title="Отправить документ из сделки"
              className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                docMenu || selectedDoc ? "border-primary text-primary bg-primary/8" : "border-border text-muted-foreground hover:text-primary hover:border-primary/40"
              }`}>
              <Icon name="FileSignature" size={15} />
            </button>
            {docMenu && (
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto z-10">
                <p className="px-3 py-2 text-[11px] font-mono text-muted-foreground border-b border-border">ДОКУМЕНТЫ СДЕЛОК КЛИЕНТА</p>
                {docOptions.length === 0 ? (
                  <p className="px-3 py-4 text-[12px] text-muted-foreground text-center">
                    Нет документов. Добавьте их в карточке сделки в разделе «Документы».
                  </p>
                ) : docOptions.map(d => (
                  <button key={d.id} onClick={() => { setSelectedDoc(d); setDocMenu(false); }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium truncate">{d.title}</span>
                      <span className="block text-[11px] text-muted-foreground truncate">{d.deal_title}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{STATUS_HINT[d.status] || d.status}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ответить…"
          className="flex-1 min-w-0 px-3 py-2 border border-border rounded-lg text-base sm:text-sm focus:outline-none focus:border-primary transition-colors"
        />
        <button onClick={send} disabled={sending || (!draft.trim() && !file && !selectedDoc)} aria-label="Отправить"
          className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 hover:bg-primary/90 transition-colors disabled:opacity-60">
          <Icon name="Send" size={14} />
        </button>
      </div>
    </div>
  );
};

export default StaffChatPanel;
