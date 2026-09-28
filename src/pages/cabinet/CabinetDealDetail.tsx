import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useClientAuth, type BatchDeal, type LogisticsField } from "@/context/ClientAuthContext";
import { BAG_COLORS } from "@/components/calculator/calculator.types";
import LotForm from "./LotForm";

interface Props {
  deal: BatchDeal;
}

const formatMoney = (n: number | null) => n ? `${n.toLocaleString("ru-RU")} ₽` : "—";
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
const colorLabel = (v: string | null) => BAG_COLORS.find(c => c.value === v)?.label ?? v ?? "—";
const weightLabel = (v: string | null) => v === "250g" ? "250 г" : v === "1kg" ? "1 кг" : v ?? "—";

const CabinetDealDetail = ({ deal }: Props) => {
  const { deleteLot, updateLogistics, submitDeal, fetchLogisticsFields } = useClientAuth();
  const [addingLot, setAddingLot] = useState(false);
  const [editingLotId, setEditingLotId] = useState<number | null>(null);
  const [fields, setFields] = useState<LogisticsField[]>([]);
  const [logisticsForm, setLogisticsForm] = useState<Record<string, string>>(deal.logistics_data || {});
  const [savingLogistics, setSavingLogistics] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [toast, setToast] = useState("");

  const isDraft = deal.status === "draft";

  useEffect(() => {
    fetchLogisticsFields().then(setFields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLogisticsForm(deal.logistics_data || {});
  }, [deal.logistics_data]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const totalAmount = deal.lots.reduce((s, l) => s + (l.amount || 0), 0);
  const totalVolume = deal.lots.reduce((s, l) => s + (l.volume || 0), 0);

  const editingLot = editingLotId ? deal.lots.find(l => l.id === editingLotId) : undefined;

  const handleDeleteLot = async (id: number) => {
    if (!confirm("Удалить лот?")) return;
    const res = await deleteLot(id);
    if (!res.ok) showToast(res.error || "Не удалось удалить лот");
  };

  const saveLogistics = async () => {
    setSavingLogistics(true);
    const res = await updateLogistics(deal.id, logisticsForm);
    setSavingLogistics(false);
    if (res.ok) showToast("Логистика сохранена ✓");
    else showToast(res.error || "Ошибка сохранения");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    const res = await submitDeal(deal.id);
    setSubmitting(false);
    if (!res.ok) setSubmitError(res.error || "Не удалось отправить на согласование");
  };

  if (addingLot || editingLotId) {
    return (
      <div className="max-w-2xl">
        <button onClick={() => { setAddingLot(false); setEditingLotId(null); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <Icon name="ArrowLeft" size={14} /> Назад к заказу
        </button>
        <h2 className="font-serif text-xl font-bold mb-4">{editingLot ? "Редактировать лот" : "Новый лот"}</h2>
        <LotForm
          dealId={deal.id}
          prefill={editingLot}
          onDone={() => { setAddingLot(false); setEditingLotId(null); }}
          onCancel={() => { setAddingLot(false); setEditingLotId(null); }}
        />
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-serif text-2xl font-bold">Заказ №{deal.id}</h2>
            {isDraft ? (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">Черновик</span>
            ) : (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full text-white" style={{ background: deal.stage_color || "#64748b" }}>
                {deal.stage_name}
              </span>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground font-mono mt-0.5">
            Создан {formatDate(deal.created_at)} · {deal.lots.length} {deal.lots.length === 1 ? "лот" : "лотов"} · {totalVolume} кг · {formatMoney(totalAmount)}
          </p>
        </div>
        {isDraft && (
          <button onClick={() => setAddingLot(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95">
            <Icon name="Plus" size={15} /> Добавить лот
          </button>
        )}
      </div>

      {/* Лоты */}
      <div className="space-y-3 mb-6">
        {deal.lots.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
            {isDraft ? "Добавьте первый лот, чтобы отправить заказ на согласование" : "В этом заказе нет лотов"}
          </div>
        ) : (
          deal.lots.map(lot => (
            <div key={lot.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-primary/8 text-primary flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                    {lot.lot_number}
                  </span>
                  <p className="text-sm font-bold">Лот {lot.lot_number} — {lot.origin_label || "—"}</p>
                </div>
                {isDraft && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setEditingLotId(lot.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors">
                      <Icon name="Pencil" size={13} />
                    </button>
                    <button onClick={() => handleDeleteLot(lot.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors">
                      <Icon name="Trash2" size={13} />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: "Обжарка", val: lot.roast },
                  { label: "Фасовка", val: weightLabel(lot.weight_format) },
                  { label: "Цвет", val: colorLabel(lot.color) },
                  { label: "Объём", val: lot.volume ? `${lot.volume} кг` : "—" },
                ].map(p => (
                  <div key={p.label} className="bg-secondary/40 rounded-xl px-3 py-2 border border-border/50">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-0.5">{p.label}</p>
                    <p className="text-[12px] font-semibold truncate">{p.val}</p>
                  </div>
                ))}
              </div>
              {lot.note && <p className="text-[12px] text-muted-foreground mt-2">{lot.note}</p>}
              <p className="text-sm font-bold text-primary mt-2 text-right">{formatMoney(lot.amount)}</p>
            </div>
          ))
        )}
      </div>

      {/* Логистика */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Icon name="Truck" size={15} className="text-primary" />
          <h3 className="font-semibold text-sm">Логистика доставки</h3>
        </div>
        <div className="p-5 space-y-3">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 tracking-wider">
                {f.label.toUpperCase()} {f.required && <span className="text-primary">*</span>}
              </label>
              {f.field_type === "textarea" ? (
                <textarea
                  disabled={!isDraft}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors disabled:opacity-60"
                  rows={2}
                  value={logisticsForm[f.key] || ""}
                  onChange={e => setLogisticsForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                />
              ) : (
                <input
                  disabled={!isDraft}
                  type={f.field_type === "date" ? "date" : f.field_type === "phone" ? "tel" : "text"}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors disabled:opacity-60"
                  value={logisticsForm[f.key] || ""}
                  onChange={e => setLogisticsForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          {isDraft && (
            <button onClick={saveLogistics} disabled={savingLogistics}
              className="flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 rounded-xl px-4 py-2 hover:bg-primary/5 transition-colors disabled:opacity-60">
              {savingLogistics ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Icon name="Save" size={14} />}
              Сохранить логистику
            </button>
          )}
        </div>
      </div>

      {/* Отправка на согласование */}
      {isDraft && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1">Готовы отправить заказ на согласование?</p>
              <p className="text-[13px] text-muted-foreground mb-3">
                После отправки менеджер увидит заказ и свяжется с вами. Изменить лоты будет уже нельзя.
              </p>
              {submitError && <p className="text-sm text-destructive mb-3">{submitError}</p>}
              <button onClick={handleSubmit} disabled={submitting || deal.lots.length === 0}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50">
                {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Send" size={15} />}
                Отправить на согласование
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CabinetDealDetail;