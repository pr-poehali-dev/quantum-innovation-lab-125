import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useClientAuth } from "@/context/ClientAuthContext";
import OrderForm from "./OrderForm";
import CabinetBatchDetail from "./CabinetBatchDetail";

const formatMoney = (n: number | null) => n ? `${n.toLocaleString("ru-RU")} ₽` : "—";
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

const CabinetBatches = () => {
  const { batches } = useClientAuth();
  const [openBatchId, setOpenBatchId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  if (openBatchId !== null) {
    const batch = batches.find(b => b.id === openBatchId);
    if (batch) {
      return <CabinetBatchDetail batch={batch} onBack={() => setOpenBatchId(null)} />;
    }
    setOpenBatchId(null);
  }

  if (creating) {
    return (
      <div className="max-w-2xl">
        <button onClick={() => setCreating(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <Icon name="ArrowLeft" size={14} /> Назад к партиям
        </button>
        <h2 className="font-serif text-xl font-bold mb-4">Новая партия</h2>
        <OrderForm onDone={() => setCreating(false)} onCancel={() => setCreating(false)} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-xl font-bold">Мои партии</h2>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95">
          <Icon name="Plus" size={15} /> Новая партия
        </button>
      </div>

      {batches.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
          <Icon name="Package" size={28} className="text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">У вас пока нет партий продукта</p>
          <button onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
            <Icon name="Plus" size={15} /> Создать первую партию
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {batches.map(batch => {
            const lastOrder = batch.orders[0];
            const totalOrders = batch.orders.length;
            return (
              <button key={batch.id} onClick={() => setOpenBatchId(batch.id)}
                className="bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/40 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-serif text-lg font-bold truncate">{batch.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">Партия создана {formatDate(batch.created_at)}</p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
                </div>

                {lastOrder ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full text-white" style={{ background: lastOrder.stage_color }}>
                      {lastOrder.stage_name}
                    </span>
                    <span className="text-sm font-mono text-muted-foreground">
                      {totalOrders} {totalOrders === 1 ? "заказ" : totalOrders < 5 ? "заказа" : "заказов"}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Нет заказов</p>
                )}

                {lastOrder && (
                  <div className="flex items-center gap-3 mt-2 text-[12px] text-muted-foreground">
                    {lastOrder.volume && <span>{lastOrder.volume} кг</span>}
                    {lastOrder.amount && <span>· {formatMoney(lastOrder.amount)}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CabinetBatches;
