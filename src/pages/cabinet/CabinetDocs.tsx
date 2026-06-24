import Icon from "@/components/ui/icon";
import { ORDERS_HISTORY, DOCS } from "./cabinet.types";
import StatusDot from "./StatusDot";

const CabinetDocs = () => {
  return (
    <div className="space-y-4">
      {ORDERS_HISTORY.map(order => {
        const orderDocs = DOCS.filter(d => d.order === order.id);
        if (!orderDocs.length) return null;
        return (
          <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusDot status={order.status} />
                <div>
                  <p className="text-sm font-bold">{order.id} · {order.brand}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{order.date} · {order.volume} кг · {order.total}</p>
                </div>
              </div>
              <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                order.status === "done"
                  ? "bg-green-500/8 text-green-600 border-green-500/20"
                  : "bg-amber-500/8 text-amber-600 border-amber-500/20"
              }`}>
                {order.status === "done" ? "Доставлен" : "В производстве"}
              </span>
            </div>
            <div className="divide-y divide-border">
              {orderDocs.map((d, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3.5 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                      <Icon name="FileText" size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{d.type} · {d.size}</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5">
                    <Icon name="Download" size={13} /> Скачать
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CabinetDocs;
