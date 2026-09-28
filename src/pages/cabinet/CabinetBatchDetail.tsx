import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { ProductBatch, BatchOrder } from "@/context/ClientAuthContext";
import OrderForm from "./OrderForm";

interface Props {
  batch: ProductBatch;
  onBack: () => void;
}

const formatMoney = (n: number | null) => n ? `${n.toLocaleString("ru-RU")} ₽` : "—";
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

const CabinetBatchDetail = ({ batch, onBack }: Props) => {
  const [mode, setMode] = useState<"view" | "repeat" | "new">("view");
  const [repeatSource, setRepeatSource] = useState<BatchOrder | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const startRepeat = (order: BatchOrder) => {
    setRepeatSource(order);
    setMode("repeat");
  };

  if (mode === "repeat" || mode === "new") {
    return (
      <div className="max-w-2xl">
        <button onClick={() => setMode("view")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <Icon name="ArrowLeft" size={14} /> Назад к партии «{batch.name}»
        </button>
        <h2 className="font-serif text-xl font-bold mb-1">
          {mode === "repeat" ? "Повторить заказ" : "Новый заказ"} — {batch.name}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {mode === "repeat" ? "Параметры заполнены из прошлого заказа — при желании измените их" : "Настройте параметры новой партии"}
        </p>
        <OrderForm
          batchId={batch.id}
          prefill={mode === "repeat" ? repeatSource ?? undefined : undefined}
          onDone={() => setMode("view")}
          onCancel={() => setMode("view")}
        />
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <Icon name="ArrowLeft" size={14} /> Все партии
      </button>

      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h2 className="font-serif text-2xl font-bold">{batch.name}</h2>
          <p className="text-[12px] text-muted-foreground font-mono mt-0.5">Создана {formatDate(batch.created_at)} · {batch.orders.length} {batch.orders.length === 1 ? "заказ" : "заказов"}</p>
        </div>
        <button onClick={() => setMode("new")}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95">
          <Icon name="Plus" size={15} /> Новый заказ
        </button>
      </div>

      <div className="space-y-3">
        {batch.orders.map((order, i) => {
          const isOpen = expandedOrder === order.id;
          const isLatest = i === 0;
          return (
            <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button onClick={() => setExpandedOrder(isOpen ? null : order.id)}
                className="w-full px-5 py-4 flex items-center justify-between gap-3 flex-wrap hover:bg-secondary/20 transition-colors text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary/8 text-primary flex items-center justify-center flex-shrink-0">
                    <Icon name="Package" size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold">Заказ №{order.id}</p>
                      {isLatest && (
                        <span className="text-[9px] font-mono bg-primary/15 text-primary rounded-full px-1.5 py-0.5">ПОСЛЕДНИЙ</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">{formatDate(order.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full text-white" style={{ background: order.stage_color }}>
                    {order.stage_name}
                  </span>
                  <span className="text-sm font-mono text-muted-foreground">{order.volume ? `${order.volume} кг` : "—"}</span>
                  <span className="text-sm font-mono font-semibold">{formatMoney(order.amount)}</span>
                  <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-border pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "Зерно", val: order.origin_label },
                      { label: "Обжарка", val: order.roast },
                      { label: "Упаковка", val: order.packaging },
                      { label: "Фасовка", val: order.weight_format },
                      { label: "Дизайн", val: order.design },
                    ].filter(p => p.val).map(p => (
                      <div key={p.label} className="bg-secondary/40 rounded-xl px-3 py-2 border border-border/50">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-0.5">{p.label}</p>
                        <p className="text-[12px] font-semibold truncate">{p.val}</p>
                      </div>
                    ))}
                  </div>
                  {order.note && (
                    <p className="text-[12px] text-muted-foreground mb-3 bg-secondary/30 rounded-lg px-3 py-2">{order.note}</p>
                  )}
                  <button onClick={() => startRepeat(order)}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">
                    <Icon name="RefreshCw" size={14} /> Повторить с этими параметрами
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CabinetBatchDetail;
