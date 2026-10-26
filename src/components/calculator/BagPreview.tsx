import type { BagTone, LabelSize, PackType } from "@/lib/calcCore";

interface Props {
  type: PackType;
  tone?: BagTone;
  size?: LabelSize;
  className?: string;
  mini?: boolean;
}

const SHAPES = [
  { x: 46, y: 80, w: 28, h: 20, r: 4 },
  { x: 24, y: 79, w: 72, h: 22, r: 4 },
  { x: 36, y: 66, w: 48, h: 48, r: 5 },
  { x: 43, y: 50, w: 34, h: 80, r: 5 },
  { x: 24, y: 54, w: 72, h: 72, r: 6 },
  { x: 40, y: 72, w: 40, h: 36, r: 18 },
];
const DUR = "9s";
const seq = (k: "x" | "y" | "w" | "h" | "r") => [...SHAPES, SHAPES[0]].map(s => s[k]).join(";");

const BagPreview = ({ type, tone = "black", size = "classic", className = "", mini = false }: Props) => {
  const body = type === "stm" ? "#f4f1ea" : tone === "white" ? "#f7f7f5" : "#1c1c1e";
  const seal = type === "stm" ? "#e4dfd3" : tone === "white" ? "#e2e2de" : "#2e2e31";
  const line = type === "stm" ? "#cfc8b8" : tone === "white" ? "#d4d4cf" : "#3a3a3e";
  const accent = "hsl(var(--primary))";

  return (
    <svg viewBox="0 0 120 160" className={className} role="img" aria-label="Макет упаковки">
      <ellipse cx="60" cy="155" rx="42" ry="3.5" fill="currentColor" opacity="0.08" />
      <rect x="14" y="8" width="92" height="144" rx="7" fill={body} stroke={line} strokeWidth="1" style={{ transition: "fill .35s" }} />
      <rect x="14" y="8" width="92" height="14" rx="7" fill={seal} style={{ transition: "fill .35s" }} />
      <rect x="14" y="15" width="92" height="7" fill={seal} style={{ transition: "fill .35s" }} />
      {[22, 30, 38, 46, 54, 62, 70, 78, 86, 94].map(x => (
        <line key={x} x1={x} y1="10" x2={x} y2="21" stroke={line} strokeWidth="0.8" />
      ))}
      <line x1="22" y1="24" x2="22" y2="150" stroke={line} strokeWidth="0.7" />
      <line x1="98" y1="24" x2="98" y2="150" stroke={line} strokeWidth="0.7" />
      <circle cx="60" cy="30" r="3.2" fill={seal} stroke={line} strokeWidth="0.8" />

      {type === "stm" && (
        <g>
          <rect x="26" y="40" width="68" height="102" rx="4" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.2" strokeDasharray="3 2.5" />
          <circle cx="60" cy="72" r="13" fill={accent} fillOpacity="0.9" />
          <path d="M54 72h12M60 66v12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          {!mini && (
            <>
              <text x="60" y="100" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={accent}>ВАШ ЛОГОТИП</text>
              <text x="60" y="110" textAnchor="middle" fontSize="6" fill={accent} opacity="0.85">и дизайн</text>
              <rect x="36" y="119" width="48" height="3" rx="1.5" fill={accent} opacity="0.35" />
              <rect x="42" y="126" width="36" height="3" rx="1.5" fill={accent} opacity="0.25" />
            </>
          )}
        </g>
      )}

      {type === "label" && size !== "any" && (() => {
        const sh = size === "big" ? { x: 24, y: 54, w: 72, h: 72, r: 6 } : { x: 32, y: 76, w: 56, h: 28, r: 5 };
        const cx = sh.x + sh.w / 2;
        const cy = sh.y + sh.h / 2;
        const big = size === "big";
        return (
          <g>
            <rect x={sh.x} y={sh.y} width={sh.w} height={sh.h} rx={sh.r} fill="#fff" stroke={accent} strokeWidth="1.4" strokeDasharray="3 2.5" />
            <rect x={sh.x} y={sh.y} width={sh.w} height={sh.h} rx={sh.r} fill={accent} fillOpacity="0.1" />
            <circle cx={big ? cx : sh.x + 12} cy={big ? cy - 8 : cy} r={big ? 11 : 6} fill={accent} />
            {big ? (
              <>
                <rect x={cx - 20} y={cy + 8} width="40" height="3.5" rx="1.75" fill={accent} opacity="0.4" />
                <rect x={cx - 14} y={cy + 15} width="28" height="3.5" rx="1.75" fill={accent} opacity="0.25" />
              </>
            ) : (
              <>
                <rect x={sh.x + 22} y={cy - 5} width="26" height="3.5" rx="1.75" fill={accent} opacity="0.45" />
                <rect x={sh.x + 22} y={cy + 2} width="18" height="3.5" rx="1.75" fill={accent} opacity="0.25" />
              </>
            )}
          </g>
        );
      })()}

      {type === "label" && size === "any" && (
        <g>
          <rect x={SHAPES[0].x} y={SHAPES[0].y} width={SHAPES[0].w} height={SHAPES[0].h} rx={SHAPES[0].r} fill="#fff" stroke={accent} strokeWidth="1.4" strokeDasharray="3 2.5">
            <animate attributeName="x" values={seq("x")} dur={DUR} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.2;0.4;0.6;0.8;0.9;1" keySplines={Array(6).fill("0.4 0 0.2 1").join(";")} />
            <animate attributeName="y" values={seq("y")} dur={DUR} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.2;0.4;0.6;0.8;0.9;1" keySplines={Array(6).fill("0.4 0 0.2 1").join(";")} />
            <animate attributeName="width" values={seq("w")} dur={DUR} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.2;0.4;0.6;0.8;0.9;1" keySplines={Array(6).fill("0.4 0 0.2 1").join(";")} />
            <animate attributeName="height" values={seq("h")} dur={DUR} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.2;0.4;0.6;0.8;0.9;1" keySplines={Array(6).fill("0.4 0 0.2 1").join(";")} />
            <animate attributeName="rx" values={seq("r")} dur={DUR} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.2;0.4;0.6;0.8;0.9;1" keySplines={Array(6).fill("0.4 0 0.2 1").join(";")} />
          </rect>
          <rect x={SHAPES[0].x} y={SHAPES[0].y} width={SHAPES[0].w} height={SHAPES[0].h} rx={SHAPES[0].r} fill={accent} fillOpacity="0.1">
            <animate attributeName="x" values={seq("x")} dur={DUR} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.2;0.4;0.6;0.8;0.9;1" keySplines={Array(6).fill("0.4 0 0.2 1").join(";")} />
            <animate attributeName="y" values={seq("y")} dur={DUR} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.2;0.4;0.6;0.8;0.9;1" keySplines={Array(6).fill("0.4 0 0.2 1").join(";")} />
            <animate attributeName="width" values={seq("w")} dur={DUR} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.2;0.4;0.6;0.8;0.9;1" keySplines={Array(6).fill("0.4 0 0.2 1").join(";")} />
            <animate attributeName="height" values={seq("h")} dur={DUR} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.2;0.4;0.6;0.8;0.9;1" keySplines={Array(6).fill("0.4 0 0.2 1").join(";")} />
            <animate attributeName="rx" values={seq("r")} dur={DUR} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.2;0.4;0.6;0.8;0.9;1" keySplines={Array(6).fill("0.4 0 0.2 1").join(";")} />
          </rect>
          <circle cx="60" cy="90" r="5" fill={accent} />
        </g>
      )}
    </svg>
  );
};

export default BagPreview;
