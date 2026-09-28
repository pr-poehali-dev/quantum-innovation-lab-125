import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useClientAuth } from "@/context/ClientAuthContext";

const DOCS_URL = "https://functions.poehali.dev/728446de-2a8e-45c1-a93a-a0040873e23b";

interface ClientDoc {
  id: number;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_name: string;
  file_size_kb: number;
  created_at: string;
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

const CabinetDocs = () => {
  const { token } = useClientAuth();
  const [docs, setDocs] = useState<ClientDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(DOCS_URL, { headers: { "X-Action": "list-mine", "X-Client-Token": token } })
      .then(r => r.json())
      .then(d => setDocs(d.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">
        Документы появятся здесь после того, как менеджер их загрузит
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-serif text-xl font-bold mb-5">Документы</h2>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="divide-y divide-border">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-secondary/20 transition-colors gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                  <Icon name="FileText" size={15} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {doc.description ? `${doc.description} · ` : ""}{formatDate(doc.created_at)}
                  </p>
                </div>
              </div>
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" download={doc.file_name}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5 flex-shrink-0">
                <Icon name="Download" size={13} /> Скачать
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CabinetDocs;
