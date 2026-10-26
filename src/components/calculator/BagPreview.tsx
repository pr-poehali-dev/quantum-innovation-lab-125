import type { BagTone, LabelPos, PackType } from "@/lib/calcCore";

interface Props {
  type: PackType;
  tone?: BagTone;
  pos?: LabelPos;
  className?: string;
  mini?: boolean;
}

const STICKER_DY: Record<LabelPos, number> = { top: 0, center: 28, bottom: 58 };

const BagPreview = ({ type, tone = "black", pos = "center", className = "", mini = false }: Props) => {
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

      {type === "label" && (
        <g style={{ transform: `translateY(${STICKER_DY[pos]}px)`, transition: "transform .45s cubic-bezier(.3,.8,.3,1)" }}>
          <rect x="30" y="46" width="60" height="30" rx="5" fill="#fff" stroke={accent} strokeWidth="1.4" strokeDasharray="3 2.5" />
          <rect x="30" y="46" width="60" height="30" rx="5" fill={accent} fillOpacity="0.1" />
          <circle cx="45" cy="61" r="6" fill={accent} />
          {!mini && (
            <>
              <text x="55" y="59" fontSize="5.5" fontWeight="700" fill={accent}>ВАШ ЛОГО</text>
              <text x="55" y="67" fontSize="4.5" fill={accent} opacity="0.8">наклейка</text>
            </>
          )}
        </g>
      )}
    </svg>
  );
};

export default BagPreview;
