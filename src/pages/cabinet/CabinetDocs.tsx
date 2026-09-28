import Icon from "@/components/ui/icon";
import { useClientAuth } from "@/context/ClientAuthContext";

const formatMoney = (n: number | null) => n ? `${n.toLocaleString("ru-RU")} ₽` : "—";
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

const CabinetDocs = () => {
  const { batches } = useClientAuth();
  const allOrders = batches.flatMap(b => b.orders.map(o => ({ ...o, batchName: b.name })));

  if (allOrders.length === 0) {
    return (
      <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground text-sm">
        Документы появятся после первого заказа
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allOrders.map(order => (
        <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: order.stage_color }} />
              <div>
                <p className="text-sm font-bold">{order.batchName} · Заказ №{order.id}</p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {formatDate(order.created_at)}{order.volume ? ` · ${order.volume} кг` : ""}{order.amount ? ` · ${formatMoney(order.amount)}` : ""}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full text-white" style={{ background: order.stage_color }}>
              {order.stage_name}
            </span>
          </div>
          <div className="px-6 py-4 text-sm text-muted-foreground flex items-center gap-2">
            <Icon name="Clock" size={14} />
            Документы по заказу появятся здесь после выставления счёта менеджером
          </div>
        </div>
      ))}
    </div>
  );
};

export default CabinetDocs;
