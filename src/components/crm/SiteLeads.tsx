import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";

const CRM_URL = "https://functions.poehali.dev/0fbf69fe-e1ba-4899-a9c0-98d37524abe1";

interface BriefPosition {
  origin?: string; roast?: string; grind?: string; weight_format?: string; bag_color?: string;
  volume?: number; amount?: number; custom_package?: boolean;
}

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  created_at: string;
  status: "new" | "processed" | "rejected";
  brief: { positions?: BriefPosition[]; total?: number; total_volume?: number; lead_time_days?: number; source?: string } | null;
}

interface Props {
  showToast: (msg: string, ok?: boolean) => void;
  onCount: (n: number) => void;
}

const STATUS_LABEL: Record<Lead["status"], string> = { new: "Новая", processed: "В работе", rejected: "Отклонена" };

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) + ", " +
  new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const SiteLeads = ({ showToast, onCount }: Props) => {
  const { token } = useStaffAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);
  const [filter, setFilter] = useState<"active" | "all">("active");

  const load = () => {
    fetch(CRM_URL, { headers: { "X-Action": "list-leads", "X-Staff-Token": token || "" } })
      .then(r => r.json())
      .then(d => {
        const list: Lead[] = d.leads || [];
        setLeads(list);
        onCount(list.filter(l => l.status === "new").length);
      })
      .catch(() => showToast("Ошибка загрузки заявок", false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (token) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);

  const setStatus = async (id: number, status: Lead["status"]) => {
    const next = leads.map(l => (l.id === id ? { ...l, status } : l));
    setLeads(next);
    onCount(next.filter(l => l.status === "new").length);
    try {
      await fetch(CRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "set-lead-status", "X-Staff-Token": token || "" },
        body: JSON.stringify({ id, status }),
      });
    } catch { showToast("Ошибка сети", false); load(); }
  };

  const shown = filter === "active" ? leads.filter(l => l.status !== "rejected") : leads;

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <p className="text-sm text-muted-foreground max-w-xl">
          Заявки с сайта от тех, кто не входил в личный кабинет. Новые подсвечены — свяжитесь с человеком по телефону или почте.
        </p>
        <div className="flex gap-1 bg-secondary/40 rounded-lg p-1">
          {(["active", "all"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              {f === "active" ? "Актуальные" : "Все"}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Заявок без регистрации пока нет</p>
      ) : (
        <div className="space-y-2.5">
          {shown.map(l => {
            const isOpen = open === l.id;
            const positions = l.brief?.positions ?? [];
            return (
              <div key={l.id} className={`bg-card border rounded-2xl overflow-hidden transition-all ${l.status === "new" ? "border-primary/50 ring-1 ring-primary/20" : "border-border"}`}>
                <button onClick={() => setOpen(isOpen ? null : l.id)} className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{l.phone}</p>
                      <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${
                        l.status === "new" ? "bg-primary text-primary-foreground" : l.status === "processed" ? "bg-green-500/15 text-green-700" : "bg-secondary text-muted-foreground"
                      }`}>{STATUS_LABEL[l.status]}</span>
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{l.email || "почта не указана"} · {fmt(l.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {l.brief?.total ? <span className="text-sm font-semibold hidden sm:inline">{Number(l.brief.total).toLocaleString("ru-RU")} ₽</span> : null}
                    <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-border/60 pt-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <a href={`tel:${l.phone.replace(/[^+\d]/g, "")}`}
                        className="flex items-center gap-1.5 text-[13px] font-medium border border-border rounded-xl px-3.5 py-2 hover:border-primary/40 hover:bg-primary/5 transition-all">
                        <Icon name="Phone" size={13} /> Позвонить
                      </a>
                      {l.email && (
                        <a href={`mailto:${l.email}`}
                          className="flex items-center gap-1.5 text-[13px] font-medium border border-border rounded-xl px-3.5 py-2 hover:border-primary/40 hover:bg-primary/5 transition-all">
                          <Icon name="Mail" size={13} /> Написать
                        </a>
                      )}
                    </div>

                    {positions.length > 0 ? (
                      <div className="bg-secondary/40 rounded-xl p-3 space-y-2">
                        {positions.map((p, i) => (
                          <div key={i} className="flex justify-between gap-3 text-[12px]">
                            <span className="min-w-0">
                              <span className="font-semibold">{p.origin}</span>
                              <span className="text-muted-foreground"> · {p.roast} · {p.grind || "Зерно"} · {p.weight_format} · {p.bag_color}</span>
                              {p.custom_package && <span className="text-primary"> · своя упаковка</span>}
                            </span>
                            <span className="font-mono flex-shrink-0">{(p.volume ?? 0).toLocaleString("ru-RU")} кг · {(p.amount ?? 0).toLocaleString("ru-RU")} ₽</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t border-border text-[12px] font-semibold">
                          <span>Итого · срок до {l.brief?.lead_time_days ?? "—"} дн.</span>
                          <span>{Number(l.brief?.total ?? 0).toLocaleString("ru-RU")} ₽</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[12px] text-muted-foreground">Расчёт не прикреплён — заявка с обычной формы.</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {l.status !== "processed" && (
                        <button onClick={() => setStatus(l.id, "processed")}
                          className="flex items-center gap-1.5 text-[13px] font-medium bg-primary text-primary-foreground rounded-xl px-3.5 py-2 hover:bg-primary/90 transition-all">
                          <Icon name="Check" size={13} /> Взять в работу
                        </button>
                      )}
                      {l.status !== "rejected" && (
                        <button onClick={() => setStatus(l.id, "rejected")}
                          className="flex items-center gap-1.5 text-[13px] font-medium border border-border rounded-xl px-3.5 py-2 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all">
                          <Icon name="X" size={13} /> Отклонить
                        </button>
                      )}
                      {l.status !== "new" && (
                        <button onClick={() => setStatus(l.id, "new")}
                          className="flex items-center gap-1.5 text-[13px] font-medium border border-border rounded-xl px-3.5 py-2 hover:bg-secondary/40 transition-all">
                          <Icon name="Undo2" size={13} /> Вернуть в новые
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SiteLeads;
