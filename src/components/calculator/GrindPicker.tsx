import { useState } from "react";
import Icon from "@/components/ui/icon";
import { GRIND_LEVELS, type Grind, type GrindLevel } from "@/lib/calcCore";

interface Props {
  value: Grind;
  onChange: (v: Grind) => void;
}

const DOTS: Record<GrindLevel, { r: number; n: number }> = {
  fine: { r: 1.1, n: 46 },
  medium: { r: 2, n: 22 },
  coarse: { r: 3.4, n: 9 },
};

const seeded = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const Particles = ({ level, active }: { level: GrindLevel; active: boolean }) => {
  const { r, n } = DOTS[level];
  const salt = level === "fine" ? 1 : level === "medium" ? 2 : 3;
  return (
    <svg viewBox="0 0 100 64" className="w-full h-full" aria-hidden>
      {Array.from({ length: n }).map((_, i) => {
        const cx = 6 + seeded(i, salt) * 88;
        const cy = 6 + seeded(i, salt + 10) * 52;
        const dur = 1.6 + seeded(i, salt + 20) * 1.6;
        const delay = seeded(i, salt + 30) * 1.5;
        return (
          <ellipse key={i} cx={cx} cy={cy} rx={r * 1.15} ry={r * 0.85}
            transform={`rotate(${Math.round(seeded(i, salt + 40) * 180)} ${cx} ${cy})`}
            fill="currentColor" opacity={active ? 0.85 : 0.5}
            style={{ transition: "opacity .3s", transformOrigin: `${cx}px ${cy}px`, animation: active ? `grind-pop ${dur}s ease-in-out ${delay}s infinite` : "none" }} />
        );
      })}
    </svg>
  );
};

const GrindPicker = ({ value, onChange }: Props) => {
  const current = value.startsWith("ground-") ? (value.slice(7) as GrindLevel) : null;
  const [hover, setHover] = useState<GrindLevel | null>(null);
  const shown = hover ?? current;
  const info = GRIND_LEVELS.find(l => l.value === shown);

  return (
    <div className="space-y-3">
      <style>{`@keyframes grind-pop{0%,100%{transform:scale(1) translateY(0)}50%{transform:scale(1.35) translateY(-1.5px)}}
@keyframes grind-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
      <div className="grid grid-cols-3 gap-3" onMouseLeave={() => setHover(null)}>
        {GRIND_LEVELS.map(l => {
          const sel = current === l.value;
          return (
            <button key={l.value} type="button" onClick={() => onChange(`ground-${l.value}`)}
              onMouseEnter={() => setHover(l.value)} onFocus={() => setHover(l.value)} onBlur={() => setHover(null)}
              className={`relative p-2.5 rounded-2xl border text-center transition-all duration-200 active:scale-[0.97] hover:-translate-y-0.5 ${
                sel ? "border-primary bg-primary/8 shadow-md shadow-primary/10" : "border-border hover:border-primary/50 hover:bg-secondary/60"
              }`}>
              <span className={`block h-14 rounded-xl bg-secondary/60 overflow-hidden p-1 ${sel ? "text-primary" : "text-[#6b4a32]"}`}>
                <Particles level={l.value} active={sel || hover === l.value} />
              </span>
              <span className={`block text-[13px] font-semibold mt-1.5 ${sel ? "text-primary" : ""}`}>{l.label}</span>
              {sel && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Icon name="Check" size={9} className="text-primary-foreground" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-secondary/40 border border-border/60 px-4 py-3 min-h-[92px]">
        {info ? (
          <div key={info.value} style={{ animation: "grind-in .3s ease-out" }}>
            <p className="text-[12px] font-semibold">
              {info.label} помол <span className="font-normal text-muted-foreground">— {info.hint}</span>
            </p>
            <p className="text-[10px] font-mono text-muted-foreground tracking-wider mt-2 mb-1.5">ПОДХОДИТ ДЛЯ</p>
            <div className="flex flex-wrap gap-1.5">
              {info.methods.map(m => (
                <span key={m.name} className="inline-flex items-center gap-1.5 bg-card border border-border rounded-full pl-2 pr-3 py-1 text-[12px]">
                  <Icon name={m.icon} fallback="Coffee" size={12} className="text-primary" /> {m.name}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-muted-foreground flex items-center gap-2 h-full py-3">
            <Icon name="MousePointerClick" size={14} className="text-primary" />
            Выберите помол — покажем, для какой кофеварки он подходит
          </p>
        )}
      </div>
    </div>
  );
};

export default GrindPicker;
