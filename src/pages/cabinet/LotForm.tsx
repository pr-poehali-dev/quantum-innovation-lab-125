import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { ROASTS, BAG_COLORS } from "@/components/calculator/calculator.types";
import { calcPrice1kg, calcPrice250g, type CalcOrigin } from "@/components/PriceCalculator";
import { useClientAuth, type DealLot } from "@/context/ClientAuthContext";

const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";

interface CalcParams { [key: string]: { value: number; label: string } }

interface Props {
  dealId: number;
  prefill?: DealLot;
  onDone: () => void;
  onCancel?: () => void;
}

const LotForm = ({ dealId, prefill, onDone, onCancel }: Props) => {
  const { saveLot } = useClientAuth();
  const [origins, setOrigins] = useState<CalcOrigin[]>([]);
  const [params, setParams] = useState<CalcParams>({});
  const [usdRate, setUsdRate] = useState(85);
  const [minVolume, setMinVolume] = useState(500);

  const [originId, setOriginId] = useState<number | null>(prefill?.origin_id ?? null);
  const [roast, setRoast] = useState(prefill?.roast || ROASTS[1].label);
  const [weightFormat, setWeightFormat] = useState<"1kg" | "250g">(prefill?.weight_format === "250g" ? "250g" : "1kg");
  const [color, setColor] = useState<"black" | "white" | "custom">(
    prefill?.color === "white" ? "white" : prefill?.color === "custom" ? "custom" : "black"
  );
  const [volume, setVolume] = useState(prefill?.volume || 500);
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
        if (d.min_volume && !prefill) { setMinVolume(d.min_volume); setVolume(d.min_volume); }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedOrigin = origins.find(o => o.id === originId);
  const isSmall = weightFormat === "250g";
  const pricePerUnit = selectedOrigin
    ? (isSmall ? calcPrice250g(selectedOrigin, params, usdRate) : calcPrice1kg(selectedOrigin, params, usdRate))
    : 0;
  const packsCount = isSmall ? Math.round((volume * 1000) / 250) : volume;
  const total = selectedOrigin ? Math.round(packsCount * pricePerUnit) : 0;

  const submit = async () => {
    if (!originId) { setError("Выберите зерно"); return; }
    setSubmitting(true);
    setError("");
    const res = await saveLot({
      id: prefill?.id,
      deal_id: dealId,
      origin_id: originId, roast, packaging: "Квадропак, бесшовный пакет",
      weight_format: weightFormat, color, volume, amount: total, note,
    });
    setSubmitting(false);
    if (res.ok) onDone();
    else setError(res.error || "Не удалось сохранить лот");
  };

  const selectCls = "w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary transition-colors";
  const labelCls = "block text-[11px] font-mono text-muted-foreground mb-1.5 tracking-wider";

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
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
          <label className={labelCls}>ФАСОВКА</label>
          <select className={selectCls} value={weightFormat} onChange={e => setWeightFormat(e.target.value as "1kg" | "250g")}>
            <option value="1kg">1 кг</option>
            <option value="250g">250 г</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>ЦВЕТ ПАКЕТА</label>
          <select className={selectCls} value={color} onChange={e => setColor(e.target.value as "black" | "white" | "custom")}>
            {BAG_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>ОБЪЁМ, КГ (минимум {minVolume}, шаг 5)</label>
          <input type="number" min={minVolume} step={5} className={selectCls} value={volume}
            onChange={e => setVolume(Number(e.target.value) || minVolume)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>КОММЕНТАРИЙ (НЕОБЯЗАТЕЛЬНО)</label>
        <textarea className={selectCls} rows={2} value={note} onChange={e => setNote(e.target.value)}
          placeholder="Особые пожелания к лоту" />
      </div>

      <div className="bg-primary/5 border border-primary/15 rounded-xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground tracking-wider">СТОИМОСТЬ ЛОТА</p>
          <p className="font-serif text-2xl font-bold text-primary">{total.toLocaleString("ru-RU")} ₽</p>
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
          {submitting ? "Сохраняем…" : prefill ? "Сохранить лот" : "Добавить лот"}
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

export default LotForm;
