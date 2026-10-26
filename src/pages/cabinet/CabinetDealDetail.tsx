import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { useClientAuth, type BatchDeal, type LogisticsField } from "@/context/ClientAuthContext";
import { colorLabel, formatLabel, formatRub, grindLabel } from "@/lib/calcCore";
import ManagerCard from "@/components/cabinet/ManagerCard";

interface Props {
  deal: BatchDeal;
  goProfile: () => void;
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

const CabinetDealDetail = ({ deal }: Props) => {
  const { fetchLogisticsFields } = useClientAuth();
  const [fields, setFields] = useState<LogisticsField[]>([]);
  const [managerOpen, setManagerOpen] = useState(false);

  useEffect(() => { fetchLogisticsFields().then(list => setFields(list.filter(f => f.key !== "ship_date"))); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const totalAmount = deal.lots.reduce((s, l) => s + (l.amount || 0), 0);
  const totalVolume = deal.lots.reduce((s, l) => s + (l.volume || 0), 0);
  const filled = fields.filter(f => (deal.logistics_data?.[f.key] || "").trim());
  const stagePct = deal.progress_percent;

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-serif text-2xl font-bold">Состав партии</h2>
          {deal.status === "draft" ? (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">Черновик</span>
          ) : (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full text-white" style={{ background: deal.stage_color || "#64748b" }}>
              {deal.stage_name}
            </span>
          )}
        </div>
        <p className="text-[12px] text-muted-foreground font-mono mt-1">
          Отправлена {formatDate(deal.created_at)} · {deal.lots.length} поз. · {totalVolume.toLocaleString("ru-RU")} кг · {formatRub(totalAmount)}
        </p>
        {deal.assigned_to && deal.assigned_name && (
          <button onClick={() => setManagerOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">
            <Icon name="UserCheck" size={14} /> Менеджер: {deal.assigned_name}
          </button>
        )}
      </div>

      {stagePct !== null && stagePct !== undefined && deal.status === "submitted" && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Готовность партии</span><span className="font-mono text-primary font-semibold">{stagePct}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${stagePct}%` }} />
          </div>
        </div>
      )}

      {deal.docs_total > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0"><Icon name="FileCheck" size={16} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Документы: оформлено {deal.docs_done} из {deal.docs_total}</p>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(deal.docs_done / deal.docs_total) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {deal.lots.map((lot, i) => (
          <div key={lot.id} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{lot.origin_label || "—"}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    {lot.roast} обжарка · {grindLabel(lot.grind)} · {formatLabel(lot.weight_format)} · пакет: {colorLabel(lot.color)}
                  </p>
                  {lot.color === "custom" && (
                    <p className="text-[11px] text-primary mt-1 flex items-center gap-1"><Icon name="Info" size={11} /> Детали упаковки — с менеджером</p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-serif text-lg font-bold">{formatRub(lot.amount || 0)}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{(lot.volume || 0).toLocaleString("ru-RU")} кг</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Icon name="Truck" size={15} className="text-primary" />
          <h3 className="font-semibold text-sm">Доставка</h3>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Желаемая дата отгрузки</span>
            <span className="font-medium text-right">{deal.ship_date ? formatDate(deal.ship_date) : "не указана"}</span>
          </div>
          {filled.map(f => (
            <div key={f.key} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{f.label}</span>
              <span className="font-medium text-right">{deal.logistics_data[f.key]}</span>
            </div>
          ))}
        </div>
      </div>

      {managerOpen && deal.assigned_to && (
        <ManagerCard staffId={deal.assigned_to} fallbackName={deal.assigned_name} onClose={() => setManagerOpen(false)} />
      )}
    </div>
  );
};

export default CabinetDealDetail;
