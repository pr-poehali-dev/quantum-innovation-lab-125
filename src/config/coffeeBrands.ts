// ─────────────────────────────────────────────────────────────
// КОНФИГ БРЕНДОВ — редактируйте здесь для смены дизайнов пачки
// В V2: вынести в админ-панель с редактором
// ─────────────────────────────────────────────────────────────

export interface CoffeeBrand {
  /** Название бренда на этикетке */
  name: string;
  /** Подпись (происхождение) */
  sub: string;
  /** Тип обжарки */
  roast: string;
  /** Основной цвет пачки (градиент верх) */
  colorTop: string;
  /** Основной цвет пачки (градиент низ) */
  colorBottom: string;
  /** Акцентный цвет (текст, иконки) */
  accent: string;
  /** Более светлый оттенок акцента */
  accentLight: string;
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
  },
  {
    name: "NORD ROAST",
    sub: "SPECIALTY · ETHIOPIA",
    roast: "LIGHT ROAST",
    colorTop: "#1e40af",
    colorBottom: "#0f172a",
    accent: "#60a5fa",
    accentLight: "#bfdbfe",
  },
  {
    name: "SOLEIL NOIR",
    sub: "DARK BLEND · COLOMBIA",
    roast: "DARK ROAST",
    colorTop: "#b45309",
    colorBottom: "#1c0a00",
    accent: "#fbbf24",
    accentLight: "#fde68a",
  },
  {
    name: "BLANC PEAK",
    sub: "FILTER · KENYA AA",
    roast: "LIGHT ROAST",
    colorTop: "#065f46",
    colorBottom: "#022c22",
    accent: "#34d399",
    accentLight: "#a7f3d0",
  },
];

export const CYCLE_MS = 8000;
