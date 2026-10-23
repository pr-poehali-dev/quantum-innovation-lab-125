import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  COLOR_OPTIONS, FORMAT_OPTIONS, MAX_VOLUME, PACKAGING_LABEL, ROAST_OPTIONS,
  calcAmount, calcLeadTime, formatLabel, formatRub, newUid,
  type BagColor, type CalcData, type Position, type WeightFormat,
} from "@/lib/calcCore";

const STEP_DEFS = [
  { id: "origin", label: "Зерно", icon: "Leaf", title: "Выберите зерно", emoji: "🌿" },
  { id: "roast", label: "Обжарка", icon: "Flame", title: "Степень обжарки", emoji: "🔥" },
  { id: "pack", label: "Упаковка", icon: "Box", title: "Фасовка и пакет", emoji: "📦" },
  { id: "volume", label: "Объём", icon: "BarChart2", title: "Объём позиции", emoji: "⚖️" },
];

interface Props {
  calc: CalcData;
  initial?: Position | null;
  positionNumber: number;
  onDone: (p: Position) => void;
  onCancel?: () => void;
}

const Card = ({ label, desc, selected, onClick }: { label: string; desc?: string; selected: boolean; onClick: () => void }) => (
  <button type="button" onClick={onClick}
    className={`relative text-left p-3.5 rounded-2xl border transition-all duration-200 w-full active:scale-[0.98] ${
      selected ? "border-primary bg-primary/8 shadow-sm shadow-primary/10" : "border-border hover:border-primary/50 hover:bg-secondary/60"
    }`}>
    <p className={`text-sm font-semibold leading-tight pr-6 ${selected ? "text-primary" : ""}`}>{label}</p>
    {desc && <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>}
    {selected && (
      <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
        <Icon name="Check" size={11} className="text-primary-foreground" />
      </span>
    )}
  </button>
);

const PositionWizard = ({ calc, initial, positionNumber, onDone, onCancel }: Props) => {
  const [step, setStep] = useState(initial ? 3 : 0);
  const [originId, setOriginId] = useState<number | null>(initial?.origin_id ?? null);
  const [roast, setRoast] = useState(initial?.roast ?? ROAST_OPTIONS[1].label);
  const [format, setFormat] = useState<WeightFormat>(initial?.weight_format ?? "1kg");
  const [color, setColor] = useState<BagColor>(initial?.color ?? "black");
  const [volume, setVolume] = useState(initial?.volume ?? calc.minVolume);
  const [volumeText, setVolumeText] = useState(String(initial?.volume ?? calc.minVolume));
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initial) { setVolume(calc.minVolume); setVolumeText(String(calc.minVolume)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calc.minVolume]);

  const origin = calc.origins.find(o => o.id === originId);
  const volumeValid = volume >= calc.minVolume && volume <= MAX_VOLUME;
  const amount = calcAmount(origin, format, volume);
  const perKg = volume > 0 ? Math.round(amount / volume) : 0;
  const leadTime = calcLeadTime(volume, calc.tiers);
  const canNext = step === 0 ? !!origin : step === 3 ? volumeValid : true;
  const isLast = step === STEP_DEFS.length - 1;

  const goTo = (i: number) => {
    setStep(i);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const commitVolume = (raw: string) => {
    const n = Math.round(Number(raw.replace(",", ".")) / calc.volumeStep) * calc.volumeStep;
    const next = Math.min(MAX_VOLUME, Math.max(calc.minVolume, Number.isFinite(n) && n > 0 ? n : calc.minVolume));
    setVolume(next);
    setVolumeText(String(next));
  };

  const setVolumeBoth = (n: number) => {
    const next = Math.min(MAX_VOLUME, Math.max(calc.minVolume, n));
    setVolume(next);
    setVolumeText(String(next));
  };

  const finish = () => {
    if (!origin || !volumeValid) return;
    onDone({
      uid: initial?.uid ?? newUid(),
      origin_id: origin.id, origin_label: origin.label, roast, weight_format: format, color,
      volume, amount,
    });
  };

  const hints = [
    "Выберите сорт — он определяет вкус и базовую цену",
    "Обжарка не влияет на стоимость — выбирайте по вкусу",
    "Фасовка и цвет пакета — одни на всю позицию",
    `От ${calc.minVolume.toLocaleString("ru-RU")} до ${MAX_VOLUME.toLocaleString("ru-RU")} кг на одну позицию`,
  ];

  return (
    <div ref={topRef} className="grid lg:grid-cols-3 gap-5 items-start scroll-mt-24">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-card border border-border rounded-2xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center">
            {STEP_DEFS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={s.id} className="flex items-center flex-1 min-w-0 last:flex-none">
                  <button type="button" onClick={() => (done || active) && goTo(i)} disabled={i > step}
                    className="flex flex-col items-center gap-1 flex-shrink-0 min-w-[44px] disabled:cursor-not-allowed">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      active ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-110"
                        : done ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                    }`}>
                      <Icon name={done ? "Check" : s.icon} fallback="Circle" size={13} />
                    </span>
                    <span className={`text-[9px] font-mono ${active ? "text-primary font-bold" : done ? "text-primary/70" : "text-muted-foreground"}`}>
                      {s.label}
                    </span>
                  </button>
                  {i < STEP_DEFS.length - 1 && (
                    <span className="flex-1 h-0.5 mx-1 rounded-full bg-border overflow-hidden">
                      <span className="block h-full bg-primary transition-all duration-500" style={{ width: i < step ? "100%" : "0%" }} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-border/60 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-muted-foreground tracking-widest">
                ПОЗИЦИЯ {positionNumber} · ШАГ {step + 1} / {STEP_DEFS.length}
              </span>
              <h3 className="font-bold text-lg mt-0.5 leading-tight">{STEP_DEFS[step].title}</h3>
              <p className="text-[12px] text-muted-foreground mt-1">{hints[step]}</p>
            </div>
            <span className="text-3xl opacity-40 flex-shrink-0">{STEP_DEFS[step].emoji}</span>
          </div>

          <div className="p-5 sm:p-6 min-h-[250px]">
            {step === 0 && (
              calc.origins.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  {calc.ready ? "Список сортов пока пуст" : "Загружаем сорта…"}
                </p>
              ) : (
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                  {calc.origins.map(o => (
                    <Card key={o.id} label={o.label} selected={originId === o.id} onClick={() => setOriginId(o.id)} />
                  ))}
                </div>
              )
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3">
                {ROAST_OPTIONS.map(r => (
                  <Card key={r.label} label={r.label} desc={r.desc} selected={roast === r.label} onClick={() => setRoast(r.label)} />
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-mono text-muted-foreground mb-2 tracking-wider">ФАСОВКА</p>
                  <div className="grid grid-cols-2 gap-3">
                    {FORMAT_OPTIONS.map(f => (
                      <Card key={f.value} label={f.label} desc={f.desc} selected={format === f.value} onClick={() => setFormat(f.value)} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-mono text-muted-foreground mb-2 tracking-wider">ЦВЕТ ПАКЕТА</p>
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3">
                    {COLOR_OPTIONS.map(c => (
                      <Card key={c.value} label={c.label} desc={c.desc} selected={color === c.value} onClick={() => setColor(c.value)} />
                    ))}
                  </div>
                  {color === "custom" && (
                    <p className="text-[12px] text-primary bg-primary/8 border border-primary/20 rounded-xl px-3 py-2.5 mt-3 flex items-start gap-2">
                      <Icon name="Info" size={13} className="flex-shrink-0 mt-0.5" />
                      Стоимость считаем так же. Детали своей упаковки обсудит с вами менеджер.
                    </p>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-secondary/40 rounded-xl px-3 py-2.5">
                  <Icon name="Package" size={13} className="flex-shrink-0" /> Тип упаковки: {PACKAGING_LABEL}
                </p>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-sm text-muted-foreground">Количество</span>
                  <span className="font-serif text-3xl font-bold text-primary">{volume.toLocaleString("ru-RU")} кг</span>
                </div>
                <input type="range" min={calc.minVolume} max={MAX_VOLUME} step={calc.volumeStep} value={volume}
                  onChange={e => setVolumeBoth(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer mb-1 touch-pan-x [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md" />
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-4">
                  <span>{calc.minVolume.toLocaleString("ru-RU")} кг</span><span>{MAX_VOLUME.toLocaleString("ru-RU")} кг</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setVolumeBoth(volume - calc.volumeStep)} disabled={volume <= calc.minVolume} aria-label="Меньше"
                    className="w-11 h-11 rounded-xl border border-border flex items-center justify-center hover:bg-secondary/60 hover:border-primary/40 transition-all flex-shrink-0 disabled:opacity-40">
                    <Icon name="Minus" size={15} />
                  </button>
                  <input type="text" inputMode="numeric" value={volumeText}
                    onChange={e => { setVolumeText(e.target.value.replace(/[^\d]/g, "")); const n = Number(e.target.value.replace(/[^\d]/g, "")); if (n) setVolume(n); }}
                    onBlur={e => commitVolume(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && commitVolume((e.target as HTMLInputElement).value)}
                    className="flex-1 min-w-0 text-center px-3 py-2.5 border border-border rounded-xl text-base font-mono focus:outline-none focus:border-primary transition-colors" />
                  <button type="button" onClick={() => setVolumeBoth(volume + calc.volumeStep)} disabled={volume >= MAX_VOLUME} aria-label="Больше"
                    className="w-11 h-11 rounded-xl border border-border flex items-center justify-center hover:bg-secondary/60 hover:border-primary/40 transition-all flex-shrink-0 disabled:opacity-40">
                    <Icon name="Plus" size={15} />
                  </button>
                </div>
                {!volumeValid && (
                  <p className="text-[12px] text-destructive mt-2.5 flex items-center gap-1.5">
                    <Icon name="AlertCircle" size={13} />
                    {volume < calc.minVolume
                      ? `Минимум ${calc.minVolume.toLocaleString("ru-RU")} кг на одну позицию`
                      : `Максимум ${MAX_VOLUME.toLocaleString("ru-RU")} кг на одну позицию`}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center gap-2 px-4 sm:px-6 py-4 border-t border-border/60 bg-secondary/20">
            <button type="button" onClick={() => (step === 0 ? onCancel?.() : goTo(step - 1))}
              disabled={step === 0 && !onCancel}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm border border-border hover:bg-card transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <Icon name="ArrowLeft" size={14} /> {step === 0 && onCancel ? "К заказу" : "Назад"}
            </button>
            <button type="button" onClick={isLast ? finish : () => goTo(step + 1)} disabled={!canNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
              {isLast ? <><Icon name="Check" size={14} /> {initial ? "Сохранить позицию" : "Добавить в заказ"}</> : <>Далее <Icon name="ArrowRight" size={14} /></>}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 lg:sticky lg:top-24">
        <div className="bg-primary rounded-2xl p-5 sm:p-6 text-primary-foreground shadow-xl shadow-primary/20">
          <p className="text-[10px] font-mono opacity-60 mb-1 tracking-wider">ЭТА ПОЗИЦИЯ</p>
          <p className="font-serif text-3xl sm:text-4xl font-bold">{formatRub(amount)}</p>
          <p className="text-sm opacity-70 mt-1">{perKg.toLocaleString("ru-RU")} ₽ / кг</p>
          <div className="mt-4 space-y-2 pt-4 border-t border-white/20">
            {[
              { label: "Зерно", val: origin?.label ?? "—" },
              { label: "Обжарка", val: step >= 1 || initial ? roast : "—" },
              { label: "Фасовка", val: step >= 2 || initial ? formatLabel(format) : "—" },
              { label: "Пакет", val: step >= 2 || initial ? COLOR_OPTIONS.find(c => c.value === color)?.label ?? "—" : "—" },
              { label: "Объём", val: `${volume.toLocaleString("ru-RU")} кг` },
            ].map(r => (
              <div key={r.label} className="flex justify-between gap-3 text-xs opacity-80">
                <span>{r.label}</span><span className="font-mono text-right truncate">{r.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0"><Icon name="Clock" size={16} /></span>
          <div>
            <p className="text-sm font-semibold">Срок производства: {leadTime} дн.</p>
            <p className="text-[11px] text-muted-foreground">с момента подтверждения</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionWizard;
