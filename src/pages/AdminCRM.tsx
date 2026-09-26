import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";
import ClientDrawer from "@/components/crm/ClientDrawer";

const CRM_URL = "https://functions.poehali.dev/0fbf69fe-e1ba-4899-a9c0-98d37524abe1";

interface Lead {
  id: number;
  name: string;
  phone: string;
  city: string | null;
  email: string | null;
  created_at: string;
  has_deal: boolean;
}

interface ClientRow {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  company: string | null;
  created_at: string;
  deals_count: number;
  total_amount: number;
}

type Tab = "leads" | "clients";

const AdminCRM = () => {
  const { token } = useStaffAuth();
  const [tab, setTab] = useState<Tab>("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openClientId, setOpenClientId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [creatingFromLead, setCreatingFromLead] = useState<number | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const authHeaders = { "X-Staff-Token": token || "" };

  const loadLeads = () => {
    fetch(CRM_URL, { headers: { "X-Action": "list-leads", ...authHeaders } })
      .then(r => r.json())
      .then(d => setLeads(d.leads || []))
      .catch(() => showToast("Ошибка загрузки заявок", false));
  };

  const loadClients = () => {
    fetch(CRM_URL, { headers: { "X-Action": "list-clients", ...authHeaders } })
      .then(r => r.json())
      .then(d => setClients(d.clients || []))
      .catch(() => showToast("Ошибка загрузки клиентов", false));
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetch(CRM_URL, { headers: { "X-Action": "list-leads", ...authHeaders } }).then(r => r.json()),
      fetch(CRM_URL, { headers: { "X-Action": "list-clients", ...authHeaders } }).then(r => r.json()),
    ]).then(([l, c]) => {
      setLeads(l.leads || []);
      setClients(c.clients || []);
    }).catch(() => showToast("Ошибка загрузки", false))
      .finally(() => setLoading(false));
  }, [token]);

  const createDealFromLead = async (leadId: number) => {
    setCreatingFromLead(leadId);
    try {
      const r = await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "create-deal", ...authHeaders },
        body: JSON.stringify({ lead_id: leadId }),
      });
      const d = await r.json();
      if (r.ok) {
        showToast("Сделка создана ✓");
        loadLeads();
        loadClients();
        setTab("clients");
        setOpenClientId(d.client_id);
      } else showToast(d.error || "Ошибка", false);
    } catch { showToast("Ошибка сети", false); }
    finally { setCreatingFromLead(null); }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) + " · " +
      d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="ArrowLeft" size={16} />
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <Icon name="Users" size={16} className="text-primary" />
              <span className="font-semibold text-sm">Клиенты и сделки</span>
            </div>
          </div>
          <Link to="/admin/stages" className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="GitBranch" size={13} />
            Этапы сделки
          </Link>
        </div>
      </header>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium ${
          toast.ok ? "bg-green-500 text-white" : "bg-destructive text-white"
        }`}>
          <Icon name={toast.ok ? "Check" : "X"} size={14} />
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Вкладки */}
        <div className="flex gap-1 mb-6 bg-secondary/40 rounded-xl p-1 w-fit">
          <button onClick={() => setTab("leads")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "leads" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            <Icon name="Inbox" size={14} />
            Новые заявки
            {leads.filter(l => !l.has_deal).length > 0 && (
              <span className="text-[10px] font-mono bg-primary/15 text-primary rounded-full px-1.5 py-0.5">
                {leads.filter(l => !l.has_deal).length}
              </span>
            )}
          </button>
          <button onClick={() => setTab("clients")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "clients" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            <Icon name="Users" size={14} />
            Клиенты
            <span className="text-[10px] font-mono bg-secondary text-muted-foreground rounded-full px-1.5 py-0.5">
              {clients.length}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "leads" ? (
          <div className="space-y-2">
            {leads.length === 0 && (
              <p className="text-sm text-muted-foreground py-10 text-center">Заявок пока нет</p>
            )}
            {leads.map(lead => (
              <div key={lead.id} className="bg-card border border-border rounded-xl px-4 py-3.5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{lead.name}</p>
                    <span className="text-[11px] font-mono text-muted-foreground">{lead.phone}</span>
                    {lead.has_deal && (
                      <span className="text-[10px] font-mono bg-green-100 text-green-700 rounded-full px-1.5 py-0.5">в работе</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[12px] text-muted-foreground">
                    {lead.city && <span>{lead.city}</span>}
                    {lead.email && <span>{lead.email}</span>}
                    <span>{formatDate(lead.created_at)}</span>
                  </div>
                </div>
                {!lead.has_deal && (
                  <button
                    onClick={() => createDealFromLead(lead.id)}
                    disabled={creatingFromLead === lead.id}
                    className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-[13px] font-medium hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60 flex-shrink-0"
                  >
                    {creatingFromLead === lead.id
                      ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Icon name="Plus" size={13} />
                    }
                    В сделку
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {clients.length === 0 && (
              <p className="text-sm text-muted-foreground py-10 text-center">Клиентов пока нет — создайте сделку из заявки</p>
            )}
            {clients.map(c => (
              <button key={c.id} onClick={() => setOpenClientId(c.id)}
                className="w-full bg-card border border-border rounded-xl px-4 py-3.5 flex items-center justify-between gap-4 hover:border-primary/40 hover:shadow-sm transition-all text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                      {c.phone && <span>{c.phone}</span>}
                      {c.city && <span>{c.city}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-[12px] font-mono text-muted-foreground">{c.deals_count} сделок</p>
                    <p className="text-sm font-semibold">{c.total_amount.toLocaleString("ru-RU")} ₽</p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {openClientId !== null && (
        <ClientDrawer
          clientId={openClientId}
          onClose={() => setOpenClientId(null)}
          onChanged={() => { loadClients(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default AdminCRM;
