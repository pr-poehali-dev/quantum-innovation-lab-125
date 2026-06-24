import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { STEPS, ROASTS, PACKAGINGS, DESIGNS, OptionCardProps } from "./calculator.types";
import CalculatorAiHint from "./CalculatorAiHint";
import type { CalcOrigin } from "@/components/PriceCalculator";

// ── Анимированная карточка ────────────────────────────────────

const OptionCard = ({ label, desc, icon, flag, extra, selected, soon, onClick }: OptionCardProps) => (
  <button
    onClick={onClick}
    disabled={soon}
    className={`relative p-3.5 rounded-2xl border text-left transition-all duration-200 w-full group ${
      selected
        ? "border-primary bg-primary/8 shadow-sm shadow-primary/10"
        : soon
        ? "border-border/40 opacity-40 cursor-not-allowed"
        : "border-border hover:border-primary/50 hover:bg-secondary/60 hover:scale-[1.01]"
    }`}
  >
    {soon && (
      <span className="absolute top-2 right-2 text-[9px] font-mono bg-accent/10 text-accent border border-accent/20 rounded-full px-1.5 py-0.5">V2</span>
    )}
    <div className="flex items-start gap-3">
      {flag && <span className="text-2xl leading-none mt-0.5">{flag}</span>}
      {icon && !flag && (
        <div className={`mt-0.5 transition-colors ${selected ? "text-primary" : "text-muted-foreground group-hover:text-primary/60"}`}>
          <Icon name={icon} fallback="Circle" size={18} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight transition-colors ${selected ? "text-primary" : ""}`}>{label}</p>
        {desc && <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>}
        {extra !== undefined && extra > 0 && (
          <p className="text-[10px] font-mono text-muted-foreground/70 mt-1">+{extra} ₽/кг</p>
        )}
      </div>
    </div>
    {selected && (
      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
        <Icon name="Check" size={11} className="text-primary-foreground" />
      </div>
    )}
  </button>
);

// ── Контент шага с анимацией появления ───────────────────────

const StepContent = ({ children, stepKey }: { children: React.ReactNode; stepKey: number }) => {
  const [visible, setVisible] = useState(false);
  const prev = useRef(stepKey);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => { setVisible(true); prev.current = stepKey; }, 60);
    return () => clearTimeout(t);
  }, [stepKey]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.28s ease, transform 0.28s ease",
    }}>
      {children}
    </div>
  );
};

// ── Пропы панели ─────────────────────────────────────────────

interface CalculatorStepPanelProps {
  step: number;
  origin: number;
  roast: number;
  pkg: number;
  design: number;
  volume: number;
  canNext: boolean;
  isLast: boolean;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setOrigin: (v: number) => void;
  setRoast: (v: number) => void;
  setPkg: (v: number) => void;
  setDesign: (v: number) => void;
  setVolume: (v: number) => void;
  goNext: () => void;
  onSubmit: () => void;
  dynamicOrigins?: CalcOrigin[];
}

// ── Компонент ─────────────────────────────────────────────────

const CalculatorStepPanel = ({
  step, origin, roast, pkg, design, volume,
  canNext, isLast,
  setStep, setOrigin, setRoast, setPkg, setDesign, setVolume,
  goNext, onSubmit, dynamicOrigins,
}: CalculatorStepPanelProps) => {
  return (
    <div className="lg:col-span-2">

      {/* Игровой прогресс-трек */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const done   = i < step;
            const active = i === step;
            const locked = i > step;
            return (
              <div key={s.id} className="flex items-center flex-1 min-w-0">
                {/* Узел */}
                <button
                  onClick={() => (done || active) && setStep(() => i)}
                  disabled={locked}
                  className={`relative flex-shrink-0 flex flex-col items-center gap-1 group transition-all duration-300 ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}
                  style={{ minWidth: 44 }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    active  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-110"
                    : done  ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
                  }`}>
                    {done
                      ? <Icon name="Check" size={13} />
                      : <Icon name={s.icon} fallback="Circle" size={13} />
                    }
                  </div>
                  <span className={`text-[9px] font-mono whitespace-nowrap transition-colors ${
                    active ? "text-primary font-bold" : done ? "text-primary/70" : "text-muted-foreground"
                  }`}>
                    {s.label}
                  </span>
                  {/* Пульс на активном */}
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary/20 animate-ping" />
                  )}
                </button>
                {/* Соединительная линия */}
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden bg-border">
                    <div
                      className="h-full bg-primary transition-all duration-500 rounded-full"
                      style={{ width: i < step ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Карточка шага */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Шапка шага */}
        <div className="px-6 pt-5 pb-4 border-b border-border/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest">
              ШАГ {String(step + 1).padStart(2, "0")} / {STEPS.length}
            </span>
            <h3 className="font-bold text-lg mt-0.5 leading-tight">
              {[
                "Выберите зелёное зерно",
                "Степень обжарки",
                "Тип упаковки",
                "Дизайн упаковки",
                "Объём партии",
              ][step]}
            </h3>
          </div>
          <div className="text-3xl opacity-40">
            {["🌿", "🔥", "📦", "🎨", "⚖️"][step]}
          </div>
        </div>

        {/* Контент шага */}
        <div className="p-6 min-h-[260px]">
          <StepContent stepKey={step}>

            {/* 0 — Зерно */}
            {step === 0 && (
              <div className="grid grid-cols-2 gap-3">
                {(dynamicOrigins ?? []).map((o, i) => (
                  <OptionCard key={o.id} label={o.label} desc={o.desc} selected={origin === i}
                    onClick={() => { setOrigin(i); }} />
                ))}
              </div>
            )}

            {/* 1 — Обжарка */}
            {step === 1 && (
              <div>
                <div className="relative mb-6">
                  <div className="h-10 rounded-2xl overflow-hidden"
                    style={{ background: "linear-gradient(to right, #fef9c3, #f59e0b, #92400e)" }} />
                  <input type="range" min={0} max={2} step={1} value={roast}
                    onChange={e => setRoast(Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-10" />
                  <div className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-lg border-2 border-primary transition-all pointer-events-none"
                    style={{ left: `calc(${(roast / 2) * 100}% - 14px)` }}>
                    <div className="w-full h-full rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {ROASTS.map((r, i) => (
                    <button key={r.label} onClick={() => setRoast(i)}
                      className={`p-3.5 rounded-2xl border text-center transition-all duration-200 ${
                        roast === i
                          ? "border-primary bg-primary/8 shadow-sm"
                          : "border-border hover:border-primary/40 hover:scale-[1.01]"
                      }`}>
                      <p className={`text-sm font-semibold ${roast === i ? "text-primary" : ""}`}>{r.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{r.desc}</p>
                      {r.extra > 0 && <p className="text-[10px] font-mono text-muted-foreground/70 mt-1">+{r.extra} ₽/кг</p>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2 — Упаковка */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {PACKAGINGS.map((p, i) => (
                  <OptionCard key={p.label} label={p.label} desc={p.desc} extra={p.extra}
                    selected={pkg === i} onClick={() => setPkg(i)} />
                ))}
              </div>
            )}

            {/* 3 — Дизайн */}
            {step === 3 && (
              <div className="space-y-3">
                {DESIGNS.map((d, i) => (
                  <OptionCard key={d.label} label={d.label} icon={d.icon} desc={d.desc}
                    extra={d.extra} soon={d.soon} selected={design === i}
                    onClick={() => !d.soon && setDesign(i)} />
                ))}
              </div>
            )}

            {/* 4 — Объём */}
            {step === 4 && (
              <div>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-sm text-muted-foreground">Количество</span>
                  <span className="font-serif text-3xl font-bold text-primary">{volume} кг</span>
                </div>
                <input type="range" min={50} max={1000} step={50} value={volume}
                  onChange={e => setVolume(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer mb-1 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md" />
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-6">
                  <span>50 кг</span><span>1 000 кг</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { vol: 100, label: "Старт",   desc: "Тест рынка" },
                    { vol: 300, label: "Бизнес",  desc: "Скидка 5%"  },
                    { vol: 600, label: "Партнёр", desc: "Скидка 10%" },
                  ].map(q => (
                    <button key={q.vol} onClick={() => setVolume(q.vol)}
                      className={`p-3 rounded-2xl border text-center transition-all duration-200 ${
                        volume === q.vol
                          ? "border-primary bg-primary/8 text-primary"
                          : "border-border hover:border-primary/30 hover:scale-[1.01]"
                      }`}>
                      <p className="font-semibold text-sm">{q.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{q.vol} кг · {q.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </StepContent>

          {/* AI-подсказки */}
          <CalculatorAiHint step={step} />

        </div>

        {/* Навигация */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-border/60 bg-secondary/20">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border border-border hover:bg-card transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <Icon name="ArrowLeft" size={14} /> Назад
          </button>

          {!isLast ? (
            <button onClick={goNext} disabled={!canNext}
              className="flex items-center gap-1.5 px-6 py-2 rounded-full text-sm bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:shadow-primary/20">
              Далее <Icon name="ArrowRight" size={14} />
            </button>
          ) : (
            <button onClick={onSubmit} className="flex items-center gap-1.5 px-6 py-2 rounded-full text-sm bg-accent text-accent-foreground font-bold hover:bg-accent/90 transition-all shadow-md shadow-accent/20">
              <Icon name="Send" size={14} /> Отправить бриф
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculatorStepPanel;