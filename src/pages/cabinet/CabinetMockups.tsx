import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useClientAuth } from "@/context/ClientAuthContext";

const CLIENT_AUTH_URL = "https://functions.poehali.dev/6de59166-2dc1-44b2-831e-bc348d5c3c83";

interface Mockup {
  id: number;
  file_url: string;
  file_name: string;
  uploaded_by: "client" | "staff";
  status: "pending" | "approved" | "archived";
  comment: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = { pending: "На согласовании", approved: "Согласован", archived: "Архив" };
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/8 text-amber-600 border-amber-500/20",
  approved: "bg-green-500/8 text-green-600 border-green-500/20",
  archived: "bg-secondary text-muted-foreground border-border",
};

const CabinetMockups = () => {
  const { batches, token } = useClientAuth();
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(batches[0]?.id ?? null);
  const [mockups, setMockups] = useState<Mockup[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = (batchId: number) => {
    if (!token) return;
    setLoading(true);
    fetch(CLIENT_AUTH_URL, { headers: { "X-Action": "list-mockups", "X-Client-Token": token, "X-Batch-Id": String(batchId) } })
      .then(r => r.json())
      .then(d => setMockups(d.mockups || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (selectedBatchId) load(selectedBatchId); }, [selectedBatchId, token]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBatchId || !token) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async ev => {
        const b64 = (ev.target?.result as string).split(",")[1];
        await fetch(CLIENT_AUTH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Action": "upload-mockup", "X-Client-Token": token },
          body: JSON.stringify({ batch_id: selectedBatchId, file_base64: b64, file_name: file.name }),
        });
        load(selectedBatchId);
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  if (batches.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">
        Создайте партию, чтобы загружать дизайн-макеты
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h2 className="font-serif text-xl font-bold">Дизайн-макеты</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Загружайте макеты упаковки и отслеживайте статус согласования</p>
        </div>
        <select value={selectedBatchId ?? ""} onChange={e => setSelectedBatchId(Number(e.target.value))}
          className="px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors">
          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">Макеты партии</h3>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors disabled:opacity-60">
            {uploading ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Icon name="Upload" size={13} />}
            {uploading ? "Загружаем…" : "Загрузить макет"}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.ai,.psd" onChange={onFileChange} className="hidden" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mockups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Макетов пока нет — загрузите первый файл
          </div>
        ) : (
          <div className="divide-y divide-border">
            {mockups.map(m => (
              <div key={m.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-secondary/20 transition-colors gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                    <Icon name="FileImage" size={15} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">
                        {m.uploaded_by === "client" ? "Загружено вами" : "От менеджера"} · {new Date(m.created_at).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                    {m.comment && <p className="text-[11px] text-muted-foreground mt-0.5">{m.comment}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[m.status]}`}>
                    {STATUS_LABELS[m.status]}
                  </span>
                  <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-primary/8 text-primary hover:text-primary/80 transition-colors">
                    <Icon name="Download" size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CabinetMockups;
