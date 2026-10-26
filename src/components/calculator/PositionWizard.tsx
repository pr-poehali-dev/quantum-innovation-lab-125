import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import PassportDialog from "@/components/calculator/PassportDialog";
import GrindPicker from "@/components/calculator/GrindPicker";
import BagPreview from "@/components/calculator/BagPreview";
import {
  FORMAT_OPTIONS, PACK_TYPES, LABEL_SIZES, TONE_OPTIONS, parsePack, packCode, packShort, type Pack, GRIND_OPTIONS, grindLabel, type Grind, MAX_VOLUME, PACKAGING_LABEL, ROAST_OPTIONS,
  calcAmount, calcLeadTime, formatLabel, formatRub, newUid,
  type CalcData, type CalcOrigin, passportFilled, type Position, type WeightFormat,
} from "@/lib/calcCore";

const STEP_DEFS = [
  { id: "origin", label: "Зерно", icon: "Leaf", title: "Выберите зерно", emoji: "🌿" },
  { id: "roast", label: "Обжарка", icon: "Flame", title: "Обжарка и вид кофе", emoji: "🔥" },
  { id: "pack", label: "Упаковка", icon: "Box", title: "Упаковка", emoji: "📦" },
  { id: "volume", label: "Объём", icon: "BarChart2", title: "Объём позиции", emoji: "⚖️" },
];

interface Props {
  calc: CalcData;
  initial?: Position | null;
  positionNumber: number;
  onDone: (p: Position) => void;
  onCancel?: () => void;
}

const Card = ({ label, desc, selected, onClick, padRight }: { label: string; desc?: string; selected: boolean; onClick: () => void; padRight?: boolean }) => (
  <button type="button" onClick={onClick}
    className={`relative text-left p-3.5 rounded-2xl border transition-all duration-200 w-full active:scale-[0.98] ${
      selected ? "border-primary bg-primary/8 shadow-sm shadow-primary/10" : "border-border hover:border-primary/50 hover:bg-secondary/60"
    }`}>
    <p className={`text-sm font-semibold leading-tight ${padRight ? "pr-[124px]" : "pr-6"} ${selected ? "text-primary" : ""}`}>{label}</p>
    {desc && <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>}
    {selected && (
      <span className={`absolute right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center ${padRight ? "top-1/2 -translate-y-1/2" : "top-2.5"}`}>
        <Icon name="Check" size={11} className="text-primary-foreground" />
      </span>
    )}
  </button>
);

const PositionWizard = ({ calc, initial, positionNumber, onDone, onCancel }: Props) => {
  const [step, setStep] = useState(initial ? 3 : 0);
  const [originId, setOriginId] = useState<number | null>(initial?.origin_id ?? null);
  const [roast, setRoast] = useState(initial?.roast ?? ROAST_OPTIONS[1].label);
  const [passportOrigin, setPassportOrigin] = useState<CalcOrigin | null>(null);
  const [grind, setGrind] = useState<Grind>(initial?.grind ?? "beans");
  const [format, setFormat] = useState<WeightFormat>(initial?.weight_format ?? "1kg");
  const [pack, setPack] = useState<Pack>(parsePack(initial?.color));
  const color = packCode(pack);
  const [volume, setVolume] = useState(initial?.volume ?? calc.minVolume);
  const [volumeText, setVolumeText] = useState(String(initial?.volume ?? calc.minVolume));
  const topRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initial) { setVolume(calc.minVolume); setVolumeText(String(calc.minVolume)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calc.minVolume]);

  const origin = calc.origins.find(o => o.id === originId);
  const volumeValid = volume >= calc.minVolume && volume <= MAX_VOLUME;
  const amount = calcAmount(origin, format, volume);
  const perKg = volume > 0 ? Math.round(amount / volume) : 0;
  const leadTime = calcLeadTime(volume, calc.tiers);
  const canNext = step === 0 ? !!origin : step === 1 ? grind === "beans" || grind.startsWith("ground-") : step === 3 ? volumeValid : true;
  const isLast = step === STEP_DEFS.length - 1;

  const goTo = (i: number) => {
    setStep(i);
    bodyRef.current?.scrollTo({ top: 0 });
    const el = topRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top < 60 || r.bottom > window.innerHeight) {
        const y = window.scrollY + r.top - (window.innerWidth < 1024 ? 64 : 96);
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
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
      origin_id: origin.id, origin_label: origin.label, roast, grind, weight_format: format, color,
      volume, amount,
    });
  };

  const hints = [
    "Выберите сорт — он определяет вкус и базовую цену",
    "Степень обжарки и вид (зерно или молотый) на цену не влияют",
    "Выберите фасовку и вид упаковки — одни на всю позицию",
    `От ${calc.minVolume.toLocaleString("ru-RU")} до ${MAX_VOLUME.toLocaleString("ru-RU")} кг на одну позицию`,
  ];

  return (
    <div ref={topRef} className="max-lg:flex max-lg:flex-col max-lg:gap-2.5 max-lg:w-full max-lg:min-w-0 max-lg:h-[calc(100dvh-5.5rem)] max-lg:min-h-[480px] max-lg:max-h-[760px] lg:grid lg:grid-cols-3 gap-5 max-lg:items-stretch lg:items-start scroll-mt-24">
      <PassportDialog origin={passportOrigin} onClose={() => setPassportOrigin(null)} onSelect={setOriginId} selected={passportOrigin?.id === originId} />
      <div className="lg:col-span-2 max-lg:min-w-0 max-lg:flex max-lg:flex-col max-lg:flex-1 max-lg:min-h-0 max-lg:gap-2.5 lg:space-y-4">
        <div className="bg-card border border-border rounded-2xl p-2.5 sm:p-4 shadow-sm flex-shrink-0">
          <div className="flex items-center">
            {STEP_DEFS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={s.id} className="flex items-center flex-1 min-w-0 last:flex-none">
                  <button type="button" onClick={() => goTo(i)} disabled={i > 0 && !origin}
                    className="flex flex-col items-center gap-1 flex-shrink-0 min-w-[44px] disabled:cursor-not-allowed disabled:opacity-60 group">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      active ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-110"
                        : done ? "bg-primary/20 text-primary group-hover:bg-primary/30" : "bg-secondary text-muted-foreground group-enabled:group-hover:bg-primary/10 group-enabled:group-hover:text-primary"
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

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden max-lg:flex max-lg:flex-col max-lg:flex-1 max-lg:min-h-0">
          <div className="px-4 sm:px-6 pt-3 sm:pt-5 pb-3 sm:pb-4 border-b border-border/60 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-muted-foreground tracking-widest">
                ПОЗИЦИЯ {positionNumber} · ШАГ {step + 1} / {STEP_DEFS.length}
              </span>
              <h3 className="font-bold text-lg mt-0.5 leading-tight">{STEP_DEFS[step].title}</h3>
              <p className="text-[12px] text-muted-foreground mt-1 max-sm:line-clamp-1">{hints[step]}</p>
            </div>
            <span className="text-3xl opacity-40 flex-shrink-0 max-sm:hidden">{STEP_DEFS[step].emoji}</span>
          </div>

          <div ref={bodyRef} className="p-4 sm:p-6 lg:min-h-[250px] max-lg:flex-1 max-lg:min-h-0 max-lg:overflow-y-auto max-lg:overscroll-contain">
            {step === 0 && (
              calc.origins.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  {calc.ready ? "Список сортов пока пуст" : "Загружаем сорта…"}
                </p>
              ) : (
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                  {calc.origins.map(o => (
                    <div key={o.id} className="relative">
                      <Card label={o.label} selected={originId === o.id} onClick={() => setOriginId(o.id)} padRight={passportFilled(o.passport)} />
                      {passportFilled(o.passport) && (
                        <button type="button" onClick={() => setPassportOrigin(o)}
                          aria-label={`Паспорт продукта: ${o.label}`} title="Паспорт продукта"
                          className={`group/p absolute top-1/2 -translate-y-1/2 ${originId === o.id ? "right-10" : "right-3"} h-8 pl-2 pr-2 hover:pr-3 rounded-full flex items-center gap-1 overflow-hidden border border-primary/30 bg-card text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-sm transition-all duration-200 active:scale-90`}>
                          <Icon name="FileText" size={14} className="flex-shrink-0 transition-transform group-hover/p:rotate-[-8deg]" />
                          <span className="max-w-0 group-hover/p:max-w-[60px] overflow-hidden whitespace-nowrap text-[11px] font-semibold transition-all duration-200">Паспорт</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3">
                {ROAST_OPTIONS.map(r => (
                  <div key={r.label} className="relative">
                    {origin?.recommended_roast === r.label && (
                      <span className="absolute -top-2 left-3 z-10 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        <Icon name="Star" size={9} /> Рекомендуем
                      </span>
                    )}
                    <Card label={r.label} desc={r.desc} selected={roast === r.label} onClick={() => setRoast(r.label)} />
                  </div>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="mt-5">
                <p className="text-[11px] font-mono text-muted-foreground mb-2 tracking-wider">ВИД КОФЕ</p>
                <div className="grid grid-cols-2 gap-3">
                  {GRIND_OPTIONS.map(g => {
                    const sel = g.value === "beans" ? grind === "beans" : grind !== "beans";
                    return <Card key={g.value} label={g.label} desc={g.desc} selected={sel}
                      onClick={() => setGrind(g.value === "beans" ? "beans" : grind === "beans" ? "ground" : grind)} />;
                  })}
                </div>
                {grind !== "beans" && (
                  <div className="mt-4" style={{ animation: "grind-in .3s ease-out" }}>
                    <p className="text-[11px] font-mono text-muted-foreground mb-2 tracking-wider">ПОМОЛ</p>
                    <GrindPicker value={grind} onChange={setGrind} />
                  </div>
                )}
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
                  <p className="text-[11px] font-mono text-muted-foreground mb-2 tracking-wider">УПАКОВКА</p>
                  <div className="grid grid-cols-1 min-[560px]:grid-cols-3 gap-3">
                    {PACK_TYPES.map(t => {
                      const sel = pack.type === t.value;
                      return (
                        <button key={t.value} type="button" onClick={() => setPack({ ...pack, type: t.value })}
                          className={`relative text-left p-3 rounded-2xl border transition-all duration-200 active:scale-[0.98] flex min-[560px]:flex-col items-center min-[560px]:items-stretch gap-3 ${
                            sel ? "border-primary bg-primary/8 shadow-sm shadow-primary/10" : "border-border hover:border-primary/50 hover:bg-secondary/60"
                          }`}>
                          <span className={`flex-shrink-0 w-14 h-[74px] min-[560px]:w-full min-[560px]:h-28 rounded-xl flex items-center justify-center bg-secondary/50 text-foreground`}>
                            <BagPreview type={t.value} tone={pack.tone} size="classic" mini className="h-full w-auto" />
                          </span>
                          <span className="min-w-0">
                            <span className={`block text-sm font-semibold leading-tight pr-6 ${sel ? "text-primary" : ""}`}>{t.label}</span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5">{t.desc}</span>
                          </span>
                          {sel && (
                            <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Icon name="Check" size={11} className="text-primary-foreground" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {pack.type === "stm" && (
                  <p className="text-[12px] text-primary bg-primary/8 border border-primary/20 rounded-xl px-3 py-2.5 flex items-start gap-2">
                    <Icon name="Info" size={13} className="flex-shrink-0 mt-0.5" />
                    Ваш логотип и дизайн печатаются на всей упаковке так, как вы захотите. Макет и тираж согласует менеджер, стоимость считаем так же.
                  </p>
                )}

                {pack.type === "label" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-mono text-muted-foreground mb-2 tracking-wider">КАКОЙ БУДЕТ НАКЛЕЙКА</p>
                      <div className="grid grid-cols-3 gap-3">
                        {LABEL_SIZES.map(l => {
                          const sel = pack.size === l.value;
                          return (
                            <button key={l.value} type="button" onClick={() => setPack({ ...pack, size: l.value })}
                              className={`relative p-2.5 rounded-2xl border transition-all active:scale-[0.98] text-center ${
                                sel ? "border-primary bg-primary/8" : "border-border hover:border-primary/50 hover:bg-secondary/60"
                              }`}>
                              <span className="flex justify-center h-24 text-foreground">
                                <BagPreview type="label" tone={pack.tone} size={l.value} mini className="h-full w-auto" />
                              </span>
                              <span className={`block text-[13px] font-semibold mt-1.5 ${sel ? "text-primary" : ""}`}>{l.label}</span>
                              <span className="block text-[10px] text-muted-foreground leading-tight">{l.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <p className="text-[12px] text-primary bg-primary/8 border border-primary/20 rounded-xl px-3 py-2.5 flex items-start gap-2">
                      <Icon name="Info" size={13} className="flex-shrink-0 mt-0.5" />
                      Наклейка может быть любой формы и размера — главное, чтобы помещалась на пачке. Макет менеджер уточнит с вами после заявки.
                    </p>
                  </div>
                )}

                {pack.type !== "stm" && (
                  <div>
                    <p className="text-[11px] font-mono text-muted-foreground mb-2 tracking-wider">ЦВЕТ ПАКЕТА</p>
                    <div className="grid grid-cols-2 gap-3">
                      {TONE_OPTIONS.map(t => (
                        <button key={t.value} type="button" onClick={() => setPack({ ...pack, tone: t.value })}
                          className={`relative flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-[0.98] text-left ${
                            pack.tone === t.value ? "border-primary bg-primary/8" : "border-border hover:border-primary/50 hover:bg-secondary/60"
                          }`}>
                          <span className={`w-6 h-6 rounded-full border border-border flex-shrink-0 ${t.value === "black" ? "bg-[#1c1c1e]" : "bg-[#f7f7f5]"}`} />
                          <span className={`text-sm font-semibold ${pack.tone === t.value ? "text-primary" : ""}`}>{t.label}</span>
                          {pack.tone === t.value && (
                            <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Icon name="Check" size={11} className="text-primary-foreground" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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

          <div className="flex justify-between items-center gap-2 px-3 sm:px-6 py-3 sm:py-4 border-t border-border/60 bg-secondary/20 flex-shrink-0 max-lg:pr-[68px]">
            <button type="button" onClick={() => (step === 0 ? onCancel?.() : goTo(step - 1))}
              disabled={step === 0 && !onCancel}
              aria-label={step === 0 && onCancel ? "К заказу" : "Назад"}
              className="flex items-center justify-center gap-1.5 max-sm:w-10 max-sm:h-10 sm:px-4 sm:py-2.5 rounded-full text-sm border border-border hover:bg-card transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
              <Icon name="ArrowLeft" size={14} /> <span className="max-sm:hidden">{step === 0 && onCancel ? "К заказу" : "Назад"}</span>
            </button>
            <div className="lg:hidden flex-1 min-w-0 text-center leading-tight">
              <p className="font-serif text-[15px] font-bold whitespace-nowrap">{formatRub(amount)}</p>
              <p className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">{perKg.toLocaleString("ru-RU")} ₽/кг</p>
            </div>
            <button type="button" onClick={isLast ? finish : () => goTo(step + 1)} disabled={!canNext}
              className="flex items-center justify-center gap-2 px-4 sm:px-7 h-11 sm:h-auto sm:py-3 rounded-full text-sm bg-primary flex-shrink-0 text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/25 active:scale-[0.98] animate-cta-wave motion-reduce:animate-none disabled:animate-none">
              {isLast ? <><Icon name="Check" size={14} /> {initial ? "Сохранить позицию" : "Добавить в заказ"}</> : <>Далее <Icon name="ArrowRight" size={14} /></>}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block space-y-3 lg:sticky lg:top-24">
        <div className="bg-primary rounded-2xl p-5 sm:p-6 text-primary-foreground shadow-xl shadow-primary/20">
          <p className="text-[10px] font-mono opacity-60 mb-1 tracking-wider">ЭТА ПОЗИЦИЯ</p>
          <p className="font-serif text-3xl sm:text-4xl font-bold">{formatRub(amount)}</p>
          <p className="text-sm opacity-70 mt-1">{perKg.toLocaleString("ru-RU")} ₽ / кг</p>
          <div className="mt-4 space-y-2 pt-4 border-t border-white/20">
            {[
              { label: "Зерно", val: origin?.label ?? "—" },
              { label: "Обжарка", val: step >= 1 || initial ? roast : "—" },
              { label: "Вид", val: step >= 1 || initial ? grindLabel(grind) : "—" },
              { label: "Фасовка", val: step >= 2 || initial ? formatLabel(format) : "—" },
              { label: "Пакет", val: step >= 2 || initial ? packShort(color) : "—" },
              { label: "Объём", val: `${volume.toLocaleString("ru-RU")} кг` },
            ].map(r => (
              <div key={r.label} className="flex justify-between gap-3 text-xs opacity-80">
                <span>{r.label}</span><span className="font-mono text-right truncate">{r.val}</span>
              </div>
            ))}
          </div>
        </div>
        {step >= 2 && (
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
            <span className="flex-shrink-0 w-20 h-28 flex items-center justify-center text-foreground">
              <BagPreview type={pack.type} tone={pack.tone} size={pack.size} className="h-full w-auto" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-mono text-muted-foreground tracking-wider mb-1">ВАША УПАКОВКА</p>
              <p className="text-sm font-semibold leading-snug">{packShort(color)}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                {pack.type === "stm" ? "Логотип и дизайн — на всей упаковке"
                  : pack.type === "label" ? "Наклейка с вашим логотипом на готовом пакете"
                  : "Без нанесения, чистый пакет"}
              </p>
            </div>
          </div>
        )}
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
