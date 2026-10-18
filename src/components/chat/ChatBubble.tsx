import Icon from "@/components/ui/icon";

export interface ChatDoc {
  id: number;
  title: string;
  status: "todo" | "sent" | "returned" | "done";
  deal_id: number;
  file_url: string | null;
  file_name: string | null;
  signed_file_url: string | null;
  signed_file_name: string | null;
}

export interface ChatMessage {
  id: number;
  sender_type: "client" | "guest" | "staff";
  staff_name: string | null;
  text: string;
  created_at: string;
  kind: "text" | "file" | "doc";
  file_url: string | null;
  file_name: string | null;
  doc: ChatDoc | null;
}

const DOC_STYLE: Record<ChatDoc["status"], { label: string; wrap: string; icon: string; iconCls: string }> = {
  todo: { label: "Не отправлен", wrap: "bg-secondary/60 border-border", icon: "FileText", iconCls: "bg-muted-foreground/20 text-muted-foreground" },
  sent: { label: "Ждёт подписи", wrap: "bg-secondary/70 border-border", icon: "FileClock", iconCls: "bg-muted-foreground/20 text-muted-foreground" },
  returned: { label: "Подписан клиентом — ждёт проверки", wrap: "bg-sky-500/10 border-sky-500/30", icon: "FileInput", iconCls: "bg-sky-500/20 text-sky-700" },
  done: { label: "Оформлен", wrap: "bg-green-500/10 border-green-500/40", icon: "FileCheck", iconCls: "bg-green-500/20 text-green-700" },
};

interface Props {
  m: ChatMessage;
  mine: boolean;
  time: string;
  canMark?: boolean;
  onMark?: (docId: number, status: ChatDoc["status"]) => void;
  onReply?: (doc: ChatDoc) => void;
}

const ChatBubble = ({ m, mine, time, canMark, onMark, onReply }: Props) => {
  const bubble = mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary/60 rounded-bl-sm";

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%] min-w-0">
        {!mine && m.staff_name && <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">{m.staff_name}</p>}
        {mine && m.staff_name && <p className="text-[10px] text-muted-foreground mb-0.5 mr-1 text-right">{m.staff_name}</p>}

        {m.doc && (() => {
          const st = DOC_STYLE[m.doc.status] ?? DOC_STYLE.sent;
          const doc = m.doc;
          return (
            <div className={`rounded-2xl border p-3 mb-1 w-[260px] max-w-full transition-colors ${st.wrap} ${doc.status === "done" ? "" : ""}`}>
              <div className="flex items-start gap-2.5">
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${st.iconCls}`}>
                  <Icon name={st.icon} fallback="FileText" size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold leading-tight ${doc.status === "done" ? "text-green-800" : ""}`}>{doc.title}</p>
                  <p className={`text-[11px] mt-0.5 ${doc.status === "done" ? "text-green-700 font-medium" : "text-muted-foreground"}`}>{st.label}</p>
                </div>
              </div>

              {(doc.file_url || doc.signed_file_url) && (
                <div className="mt-2.5 space-y-1">
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[12px] text-primary hover:underline min-w-0">
                      <Icon name="Download" size={12} className="flex-shrink-0" /> <span className="truncate">{doc.file_name || "Скачать"}</span>
                    </a>
                  )}
                  {doc.signed_file_url && (
                    <a href={doc.signed_file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[12px] text-green-700 hover:underline min-w-0">
                      <Icon name="FileSignature" size={12} className="flex-shrink-0" /> <span className="truncate">{doc.signed_file_name || "Подписанный файл"}</span>
                    </a>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {canMark && doc.status !== "done" && (
                  <button onClick={() => onMark?.(doc.id, "done")}
                    className="flex items-center gap-1 text-[12px] font-medium bg-green-600 text-white rounded-lg px-3 py-1.5 hover:bg-green-700 transition-colors">
                    <Icon name="Check" size={12} /> Отметить оформленным
                  </button>
                )}
                {canMark && doc.status === "done" && (
                  <button onClick={() => onMark?.(doc.id, doc.signed_file_url ? "returned" : "sent")}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline">Снять отметку</button>
                )}
                {!canMark && doc.status !== "done" && onReply && (
                  <button onClick={() => onReply(doc)}
                    className="flex items-center gap-1 text-[12px] font-medium bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:bg-primary/90 transition-colors">
                    <Icon name="Upload" size={12} /> {doc.status === "returned" ? "Загрузить заново" : "Отправить подписанный"}
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {m.kind === "file" && m.file_url && (
          <a href={m.file_url} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 mb-1 text-sm ${bubble}`}>
            <Icon name="Paperclip" size={14} className="flex-shrink-0" />
            <span className="truncate underline underline-offset-2">{m.file_name || "Файл"}</span>
          </a>
        )}

        {m.text && <div className={`rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${bubble}`}>{m.text}</div>}
        <p className={`text-[10px] text-muted-foreground mt-0.5 ${mine ? "text-right" : ""}`}>{time}</p>
      </div>
    </div>
  );
};

export default ChatBubble;
