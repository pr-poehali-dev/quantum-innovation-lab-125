import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { ROASTS, PACKAGINGS, DESIGNS } from "@/components/calculator/calculator.types";
import { calcPrice1kg, calcPrice250g, type CalcOrigin } from "@/components/PriceCalculator";
import { useClientAuth, type BatchOrder } from "@/context/ClientAuthContext";

const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";

interface CalcParams { [key: string]: { value: number; label: string } }

interface Props {
  batchId?: number;
  batchName?: string;
  prefill?: BatchOrder;
  onDone: () => void;
  onCancel?: () => void;
}

const OrderForm = ({ batchId, batchName, prefill, onDone, onCancel }: Props) => {
  const { createOrder } = useClientAuth();
  const [origins, setOrigins] = useState<CalcOrigin[]>([]);
  const [params, setParams] = useState<CalcParams>({});
  const [usdRate, setUsdRate] = useState(85);

  const [newBatchName, setNewBatchName] = useState(batchName || "");
  const [originId, setOriginId] = useState<number | null>(prefill?.origin_id ?? null);
  const [roast, setRoast] = useState(prefill?.roast || ROASTS[1].label);
  const [packaging, setPackaging] = useState(prefill?.packaging || PACKAGINGS[1].label);
  const [weightFormat, setWeightFormat] = useState(prefill?.weight_format || "1 кг");
  const [design, setDesign] = useState(prefill?.design || DESIGNS[2].label);
  const [volume, setVolume] = useState(prefill?.volume || 100);
  const [note, setNote] = useState(prefill?.note || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(ABOUT_URL, { headers: { "X-Action": "get-calc" } })
      .then(r => r.json())
      .then(d => {
        if (d.origins?.length) {
          setOrigins(d.origins);
          if (originId === null) setOriginId(d.origins[0].id);
        }
        if (d.params) setParams(d.params);
        if (d.usd_rate) setUsdRate(d.usd_rate);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedOrigin = origins.find(o => o.id === originId);
  const roastExtra = ROASTS.find(r => r.label === roast)?.extra ?? 0;
  const pkgExtra = PACKAGINGS.find(p => p.label === packaging)?.extra ?? 0;
  const designExtra = DESIGNS.find(d => d.label === design && !d.soon)?.extra ?? 0;
  const isSmall = weightFormat === "250 г";
  const basePerKg = selectedOrigin ? (isSmall ? calcPrice250g(selectedOrigin, params, usdRate) * 4 : calcPrice1kg(selectedOrigin, params, usdRate)) : 0;
  const pricePerKg = basePerKg + roastExtra + pkgExtra + designExtra;
  const discount = volume >= 500 ? 0.1 : volume >= 200 ? 0.05 : 0;
  const total = selectedOrigin ? Math.round(volume * pricePerKg * (1 - discount)) : 0;

  const submit = async () => {
    if (!batchId && !newBatchName.trim()) { setError("Дайте название партии"); return; }
    if (!originId) { setError("Выберите зерно"); return; }
    setSubmitting(true);
    setError("");
    const res = await createOrder({
      batch_id: batchId,
      batch_name: batchId ? undefined : newBatchName.trim(),
      origin_id: originId, roast, packaging, weight_format: weightFormat, design,
      volume, amount: total, note,
    });
    setSubmitting(false);
    if (res.ok) onDone();
    else setError(res.error || "Не удалось создать заказ");
  };

  const selectCls = "w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors";
  const labelCls = "block text-[11px] font-mono text-muted-foreground mb-1.5 tracking-wider";

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      {!batchId && (
        <div>
          <label className={labelCls}>НАЗВАНИЕ ПАРТИИ</label>
          <input value={newBatchName} onChange={e => setNewBatchName(e.target.value)}
            placeholder="Например: NORD ROAST"
            className={selectCls} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>ЗЕРНО</label>
          <select className={selectCls} value={originId ?? ""} onChange={e => setOriginId(Number(e.target.value))}>
            {origins.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>ОБЖАРКА</label>
          <select className={selectCls} value={roast} onChange={e => setRoast(e.target.value)}>
            {ROASTS.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>УПАКОВКА</label>
          <select className={selectCls} value={packaging} onChange={e => setPackaging(e.target.value)}>
            {PACKAGINGS.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>ФАСОВКА</label>
          <select className={selectCls} value={weightFormat} onChange={e => setWeightFormat(e.target.value)}>
            <option value="1 кг">1 кг</option>
            <option value="250 г">250 г</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>ДИЗАЙН</label>
          <select className={selectCls} value={design} onChange={e => setDesign(e.target.value)}>
            {DESIGNS.filter(d => !d.soon).map(d => <option key={d.label} value={d.label}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>ОБЪЁМ, КГ</label>
          <input type="number" min={50} step={10} className={selectCls} value={volume}
            onChange={e => setVolume(Number(e.target.value) || 0)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>КОММЕНТАРИЙ (НЕОБЯЗАТЕЛЬНО)</label>
        <textarea className={selectCls} rows={2} value={note} onChange={e => setNote(e.target.value)}
          placeholder="Особые пожелания к партии" />
      </div>

      <div className="bg-primary/5 border border-primary/15 rounded-xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground tracking-wider">СТОИМОСТЬ</p>
          <p className="font-serif text-2xl font-bold text-primary">{total.toLocaleString("ru-RU")} ₽</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono text-muted-foreground tracking-wider">СРОК</p>
          <p className="font-serif text-2xl font-bold">{volume <= 200 ? 14 : volume <= 500 ? 18 : 25} <span className="text-base font-normal text-muted-foreground">дн</span></p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5"><Icon name="AlertCircle" size={14} />{error}</p>
      )}

      <div className="flex items-center gap-2">
        <button onClick={submit} disabled={submitting}
          className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Icon name="Check" size={16} />}
          {submitting ? "Отправляем…" : "Заказать"}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="px-5 py-3.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary/40 transition-colors">
            Отмена
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderForm;
