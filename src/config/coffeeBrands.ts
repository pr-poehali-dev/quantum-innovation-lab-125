// ─────────────────────────────────────────────────────────────
// КОНФИГ БРЕНДОВ — редактируйте здесь для смены дизайнов пачки
// ─────────────────────────────────────────────────────────────

export interface CoffeeBrand {
  name: string;
  sub: string;
  roast: string;
  colorTop: string;
  colorBottom: string;
  accent: string;
  accentLight: string;
  /** CSS-фильтр для тонирования серой пачки в нужный цвет */
  cssFilter: string;
}

export const COFFEE_BRANDS: CoffeeBrand[] = [
  {
    name: "TERRA VERDE",
    sub: "ORGANIC · BRAZIL",
    roast: "MEDIUM ROAST",
    colorTop: "#6b3fa0",
    colorBottom: "#1a0a2e",
    accent: "#c084fc",
    accentLight: "#e9d5ff",
    cssFilter: "sepia(1) saturate(3) hue-rotate(220deg) brightness(0.75)",
  },
  {
    name: "NORD ROAST",
    sub: "SPECIALTY · ETHIOPIA",
    roast: "LIGHT ROAST",
    colorTop: "#1e40af",
    colorBottom: "#0f172a",
    accent: "#60a5fa",
    accentLight: "#bfdbfe",
    cssFilter: "sepia(1) saturate(4) hue-rotate(180deg) brightness(0.7)",
  },
  {
    name: "SOLEIL NOIR",
    sub: "DARK BLEND · COLOMBIA",
    roast: "DARK ROAST",
    colorTop: "#b45309",
    colorBottom: "#1c0a00",
    accent: "#fbbf24",
    accentLight: "#fde68a",
    cssFilter: "sepia(1) saturate(3) hue-rotate(10deg) brightness(0.65)",
  },
  {
    name: "BLANC PEAK",
    sub: "FILTER · KENYA AA",
    roast: "LIGHT ROAST",
    colorTop: "#065f46",
    colorBottom: "#022c22",
    accent: "#34d399",
    accentLight: "#a7f3d0",
    cssFilter: "sepia(1) saturate(4) hue-rotate(110deg) brightness(0.6)",
  },
];

export const CYCLE_MS = 8000;
