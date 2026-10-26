import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import PositionWizard from "@/components/calculator/PositionWizard";
import OrderSummary from "@/components/calculator/OrderSummary";
import { useClientAuth, type LogisticsField } from "@/context/ClientAuthContext";
import {
  clearCart, formatRub, loadCart, maxLeadTime, positionsToApi, saveCart, useCalcData, newUid,
  type Position,
} from "@/lib/calcCore";

type Phase = "name" | "calc" | "order" | "logistics" | "done";

const PHASES: { id: Phase; label: string; icon: string }[] = [
  { id: "name", label: "Название", icon: "Tag" },
  { id: "calc", label: "Состав", icon: "Calculator" },
  { id: "logistics", label: "Доставка", icon: "Truck" },
  { id: "done", label: "Отправка", icon: "Send" },
];

const phaseIndex = (p: Phase) => (p === "order" ? 1 : PHASES.findIndex(x => x.id === p));

const phoneDigits = (v: string) => v.replace(/\D/g, "");

const MIN_SHIP_DAYS = 7;
const isoLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const minShipDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + MIN_SHIP_DAYS);
  return isoLocal(d);
};

interface Props {
  resumeDealId?: number | null;
  onFinished: (batchId: number, dealId: number) => void;
  onCancel: () => void;
  goProfile: () => void;
}

interface SentInfo { batchName: string; phone: string; email: string }

const CabinetNewOrder = ({ resumeDealId, onFinished, onCancel }: Props) => {
  const { client, batches, saveOrder, updateLogistics, submitDeal, updateProfile, fetchLogisticsFields } = useClientAuth();
  const calc = useCalcData();

  const resumed = useMemo(() => {
    if (!resumeDealId) return null;
    for (const b of batches) {
      const d = b.deals.find(x => x.id === resumeDealId);
      if (d) return { batch: b, deal: d };
    }
    return null;
  }, [resumeDealId, batches]);

  const [phase, setPhase] = useState<Phase>("name");
  const [batchName, setBatchName] = useState("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [batchId, setBatchId] = useState<number | undefined>();
  const [dealId, setDealId] = useState<number | undefined>();
  const [fields, setFields] = useState<LogisticsField[]>([]);
  const [logistics, setLogistics] = useState<Record<string, string>>({});
  const [shipDate, setShipDate] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<SentInfo | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { fetchLogisticsFields().then(list => setFields(list.filter(f => f.key !== "ship_date"))); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => { if (client?.phone) setPhone(p => p || client.phone || ""); }, [client]);

  // Старт: либо возобновляем черновик, либо подхватываем корзину с сайта
  useEffect(() => {
    if (hydrated || !calc.ready) return;
    if (resumeDealId && !resumed) return;
    if (resumed) {
      const { batch, deal } = resumed;
      setBatchName(batch.name);
      setBatchId(batch.id);
      setDealId(deal.id);
      setPositions(deal.lots.map(l => ({
        uid: newUid(), origin_id: l.origin_id ?? 0, origin_label: l.origin_label ?? "—",
        roast: l.roast ?? "Средняя", weight_format: l.weight_format === "250g" ? "250g" : "1kg",
        color: l.color === "white" ? "white" : l.color === "custom" ? "custom" : "black",
        volume: l.volume ?? calc.minVolume, amount: l.amount ?? 0,
      })));
      setLogistics(deal.logistics_data || {});
      setShipDate(deal.ship_date || "");
      setPhase("order");
    } else {
      const cart = loadCart();
      if (cart.positions.length) {
        setPositions(cart.positions);
        setBatchName(cart.batchName || "");
      }
    }
    setHydrated(true);
  }, [hydrated, calc.ready, resumed, resumeDealId, calc.minVolume]);

  useEffect(() => {
    if (!hydrated || dealId) return;
    saveCart({ positions, batchName });
  }, [positions, batchName, hydrated, dealId]);

  const editing = editingUid ? positions.find(p => p.uid === editingUid) ?? null : null;
  const stepIdx = phaseIndex(phase);
  const totalAmount = positions.reduce((s, p) => s + p.amount, 0);
  const totalVolume = positions.reduce((s, p) => s + p.volume, 0);

  const persist = async (): Promise<boolean> => {
    setBusy(true);
    setError("");
    const res = await saveOrder({
      batch_id: batchId, batch_name: batchName.trim(), deal_id: dealId,
      positions: positionsToApi(positions),
    });
    setBusy(false);
    if (!res.ok) { setError(res.error || "Не удалось сохранить заказ"); return false; }
    setBatchId(res.batchId);
    setDealId(res.dealId);
    return true;
  };

  const startCalc = () => {
    if (!batchName.trim()) { setError("Дайте партии название — так вы найдёте её в списке"); return; }
    setError("");
    setPhase(positions.length ? "order" : "calc");
  };

  const handleDone = (p: Position) => {
    setPositions(prev => (prev.some(x => x.uid === p.uid) ? prev.map(x => (x.uid === p.uid ? p : x)) : [...prev, p]));
    setEditingUid(null);
    setAdding(false);
    setPhase("order");
  };

  const handleRemove = (uid: string) => {
    const next = positions.filter(p => p.uid !== uid);
    setPositions(next);
    if (next.length === 0) setPhase("calc");
  };

  const toLogistics = async () => {
    if (!positions.length) return;
    if (await persist()) setPhase("logistics");
  };

  const saveDraftAndExit = async () => {
    if (positions.length === 0 || !batchName.trim()) { onCancel(); return; }
    if (await persist()) { clearCart(); window.dispatchEvent(new Event("kk-cart-cleared")); onCancel(); }
  };

  const goToPhase = async (target: number) => {
    if (busy || phase === "done") return;
    setError("");
    if (target === 0) { setPhase("name"); return; }
    if (!batchName.trim()) { setPhase("name"); setError("Сначала дайте партии название"); return; }
    if (target === 1) { setPhase(positions.length ? "order" : "calc"); return; }
    if (target === 2) {
      if (!positions.length) { setPhase("calc"); setError("Сначала добавьте хотя бы один сорт"); return; }
      if (phase === "logistics") return;
      if (await persist()) setPhase("logistics");
    }
  };

  const missingRequired = fields.filter(f => f.required && !(logistics[f.key] || "").trim());

  const send = async () => {
    setError("");
    if (!dealId) return;
    if (shipDate && shipDate < minShipDate()) {
      setError(`Дата отгрузки — не раньше чем через ${MIN_SHIP_DAYS} дней (с ${new Date(minShipDate()).toLocaleDateString("ru-RU")})`);
      return;
    }
    if (phoneDigits(phone).length < 10) { setError("Укажите номер телефона — по нему с вами свяжется менеджер"); return; }
    if (missingRequired.length) { setError(`Заполните: ${missingRequired.map(f => f.label).join(", ")}`); return; }
    setBusy(true);
    if (phone.trim() !== (client?.phone || "")) await updateProfile({ phone: phone.trim() });
    const saved = await updateLogistics(dealId, logistics, shipDate || undefined);
    if (!saved.ok) { setBusy(false); setError(saved.error || "Не удалось сохранить логистику"); return; }
    const res = await submitDeal(dealId, phone.trim());
    setBusy(false);
    if (!res.ok) { setError(res.error || "Не удалось отправить на согласование"); return; }
    clearCart();
    window.dispatchEvent(new Event("kk-cart-cleared"));
    setSent({ batchName: res.batchName || batchName, phone: res.contact?.phone || phone, email: res.contact?.email || client?.email || "" });
    setPhase("done");
  };

  const inputCls = "w-full px-3.5 py-3 border border-border rounded-xl text-base sm:text-sm bg-background focus:outline-none focus:border-primary transition-colors";
  const labelCls = "block text-[11px] font-mono text-muted-foreground mb-1.5 tracking-wider";

  if (phase === "done" && sent) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
          <Icon name="CheckCircle" size={40} className="text-green-500" />
        </div>
        <h2 className="font-serif text-2xl font-bold mb-2">Заказ отправлен на согласование</h2>
        <p className="text-sm text-muted-foreground mb-1">Партия «{sent.batchName}»</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Предварительно с вами свяжется менеджер по указанным контактным данным.
        </p>
        <div className="bg-card border border-border rounded-2xl p-4 text-left space-y-2.5 mb-6">
          <div className="flex items-center gap-3 text-sm"><Icon name="Phone" size={15} className="text-primary flex-shrink-0" /><span className="font-medium break-all">{sent.phone}</span></div>
          <div className="flex items-center gap-3 text-sm"><Icon name="Mail" size={15} className="text-primary flex-shrink-0" /><span className="font-medium break-all">{sent.email}</span></div>
        </div>
        <button onClick={() => onFinished(batchId!, dealId!)}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all active:scale-[0.99]">
          Открыть партию
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-serif text-2xl font-bold">{resumed ? "Продолжаем заказ" : "Новый заказ"}</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">Идите по шагам — мы подскажем, что делать дальше</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-3.5 sm:p-4 mb-5 shadow-sm">
        <div className="flex items-center">
          {PHASES.map((p, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={p.id} className="flex items-center flex-1 min-w-0 last:flex-none">
                <button type="button" onClick={() => goToPhase(i)} disabled={busy || p.id === "done"}
                  aria-current={active ? "step" : undefined}
                  className="group flex flex-col items-center gap-1 flex-shrink-0 min-w-[56px] py-0.5 disabled:cursor-default">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                    active ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-110"
                      : done ? "bg-primary/20 text-primary group-hover:bg-primary/30"
                      : "bg-secondary text-muted-foreground group-enabled:group-hover:bg-primary/10 group-enabled:group-hover:text-primary"
                  }`}>
                    <Icon name={done ? "Check" : p.icon} fallback="Circle" size={14} />
                  </span>
                  <span className={`text-[10px] font-mono ${active ? "text-primary font-bold" : done ? "text-primary/70 group-hover:text-primary" : "text-muted-foreground group-enabled:group-hover:text-primary"}`}>{p.label}</span>
                </button>
                {i < PHASES.length - 1 && (
                  <span className="flex-1 h-0.5 mx-1 rounded-full bg-border overflow-hidden">
                    <span className="block h-full bg-primary transition-all duration-500" style={{ width: i < stepIdx ? "100%" : "0%" }} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive flex items-start gap-2">
          <Icon name="AlertCircle" size={15} className="flex-shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}

      {phase === "name" && (
        <div className="max-w-lg">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="font-bold text-lg">Как назовём партию?</h3>
              <p className="text-[13px] text-muted-foreground mt-1">
                Партия — это ваш продукт под собственным именем, например «NORD ROAST». В неё вы добавите нужные сорта.
              </p>
            </div>
            <div>
              <label className={labelCls}>НАЗВАНИЕ ПАРТИИ</label>
              <input autoFocus value={batchName} onChange={e => { setBatchName(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && startCalc()} placeholder="Например: NORD ROAST" className={inputCls} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={onCancel} className="px-5 py-3 rounded-xl border border-border text-sm font-medium hover:bg-secondary/40 transition-colors">Отмена</button>
              <button onClick={startCalc}
                className={`flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all active:scale-[0.99] motion-reduce:animate-none ${batchName.trim() ? "animate-cta-wave" : "opacity-70"}`}>
                Далее: собрать состав <Icon name="ArrowRight" size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === "calc" && (
        <PositionWizard
          key={editing?.uid ?? `new-${positions.length}-${adding}`}
          calc={calc}
          initial={editing}
          positionNumber={editing ? positions.findIndex(p => p.uid === editing.uid) + 1 : positions.length + 1}
          onDone={handleDone}
          onCancel={positions.length > 0 ? () => { setEditingUid(null); setAdding(false); setPhase("order"); } : () => setPhase("name")}
        />
      )}

      {phase === "order" && (
        <OrderSummary positions={positions} tiers={calc.tiers}
          onEdit={uid => { setEditingUid(uid); setPhase("calc"); }}
          onRemove={handleRemove}
          onAdd={() => { setEditingUid(null); setAdding(true); setPhase("calc"); }}>
          <button onClick={toLogistics} disabled={busy || positions.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl text-[15px] font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/25 animate-cta-wave motion-reduce:animate-none disabled:opacity-60 disabled:animate-none active:scale-[0.99]">
            {busy ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            Далее: доставка {!busy && <Icon name="ArrowRight" size={16} />}
          </button>
          <button onClick={saveDraftAndExit} disabled={busy}
            className="w-full flex items-center justify-center gap-2 border border-border py-3 rounded-2xl text-sm font-medium hover:bg-secondary/40 transition-all disabled:opacity-60">
            <Icon name="Save" size={14} /> Сохранить как черновик
          </button>
          <button onClick={() => setPhase("name")} disabled={busy}
            className="w-full flex items-center justify-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground py-1.5 transition-colors">
            <Icon name="ArrowLeft" size={13} /> Назад к названию
          </button>
        </OrderSummary>
      )}

      {phase === "logistics" && (
        <div className="grid lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div>
                <h3 className="font-bold text-lg">Доставка и связь</h3>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Пока достаточно общих сведений. Дизайн и остальные детали менеджер уточнит на согласовании.
                </p>
              </div>

              <div>
                <label className={labelCls}>ЖЕЛАЕМАЯ ДАТА ОТГРУЗКИ</label>
                <input type="date" value={shipDate} min={minShipDate()}
                  onChange={e => { setShipDate(e.target.value); setError(""); }} className={inputCls} />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Отгрузка возможна не раньше чем через {MIN_SHIP_DAYS} дней — с {new Date(minShipDate()).toLocaleDateString("ru-RU")}.
                  Срок производства — до {maxLeadTime(positions, calc.tiers)} дн. с момента подтверждения
                </p>
              </div>

              {fields.map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label.toUpperCase()} {f.required && <span className="text-primary">*</span>}</label>
                  {f.field_type === "textarea" ? (
                    <textarea rows={3} className={inputCls} value={logistics[f.key] || ""}
                      onChange={e => setLogistics(prev => ({ ...prev, [f.key]: e.target.value }))} />
                  ) : (
                    <input type={f.field_type === "date" ? "date" : f.field_type === "phone" ? "tel" : "text"} className={inputCls}
                      value={logistics[f.key] || ""} onChange={e => setLogistics(prev => ({ ...prev, [f.key]: e.target.value }))} />
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-border">
                <label className={labelCls}>ТЕЛЕФОН ДЛЯ СВЯЗИ <span className="text-primary">*</span></label>
                <input type="tel" inputMode="tel" autoComplete="tel" value={phone} placeholder="+7 900 000-00-00"
                  onChange={e => { setPhone(e.target.value); setError(""); }} className={inputCls} />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Почта: <span className="font-medium text-foreground">{client?.email}</span> — менеджер напишет и сюда. Номер сохранится в вашем профиле.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setPhase("order")} disabled={busy}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-border text-sm font-medium hover:bg-secondary/40 transition-colors disabled:opacity-60">
                <Icon name="ArrowLeft" size={14} /> Назад
              </button>
              <button onClick={send} disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all animate-cta-wave motion-reduce:animate-none disabled:opacity-60 disabled:animate-none active:scale-[0.99]">
                {busy ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Send" size={15} />}
                Отправить на согласование
              </button>
            </div>
          </div>

          <div className="bg-primary rounded-2xl p-5 text-primary-foreground shadow-xl shadow-primary/20 lg:sticky lg:top-24">
            <p className="text-[10px] font-mono opacity-60 mb-1 tracking-wider">ПАРТИЯ «{batchName.toUpperCase()}»</p>
            <p className="font-serif text-3xl font-bold">{formatRub(totalAmount)}</p>
            <div className="mt-4 space-y-2 pt-4 border-t border-white/20 text-xs opacity-80">
              <div className="flex justify-between"><span>Позиций</span><span className="font-mono">{positions.length}</span></div>
              <div className="flex justify-between"><span>Объём</span><span className="font-mono">{totalVolume.toLocaleString("ru-RU")} кг</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CabinetNewOrder;
