import { useEffect, useState } from "react";
import { ABOUT_URL } from "@/lib/siteContent";

export interface CalcOrigin {
  id: number;
  label: string;
  price_1kg: number;
  price_250g: number;
  sort_order: number;
  recommended_roast?: string | null;
  passport?: Passport | null;
}

export interface Passport {
  subtitle?: string; photo_url?: string; taste?: string; flavor_profile?: string;
  screen?: string; process?: string; roast?: string;
  acidity?: number; density?: number; aroma?: number;
  methods?: string; for_whom?: string; pairing?: string; story?: string;
}

export const passportFilled = (p: Passport | null | undefined) =>
  !!p && Object.values(p).some(v => (typeof v === "number" ? v > 0 : !!String(v ?? "").trim()));

export interface LeadTimeTier { max_volume: number | null; days: number }

export type WeightFormat = "1kg" | "250g";
export type BagColor = string;
export type GrindLevel = "ultra" | "fine" | "medium" | "coarse";
export type Grind = "beans" | "ground" | `ground-${GrindLevel}`;

export interface Position {
  uid: string;
  origin_id: number;
  origin_label: string;
  roast: string;
  grind?: Grind;
  weight_format: WeightFormat;
  color: BagColor;
  volume: number;
  amount: number;
}

export const ROAST_OPTIONS = [
  { label: "Светлая", desc: "Specialty, fruity, кислотность" },
  { label: "Средняя", desc: "Универсальная, карамель, баланс" },
  { label: "Тёмная", desc: "Эспрессо, вендинг, насыщенность" },
];

export const GRIND_OPTIONS: { value: Grind; label: string; desc: string }[] = [
  { value: "beans", label: "Зерно", desc: "Целые обжаренные зёрна" },
  { value: "ground", label: "Молотый", desc: "Помол под ваш способ заваривания" },
];

export const GRIND_LEVELS: { value: GrindLevel; label: string; hint: string; methods: { name: string; icon: string }[] }[] = [
  { value: "ultra", label: "Ультра тонкий", hint: "Как пудра, для самого плотного вкуса", methods: [
    { name: "Турка", icon: "Flame" },
  ] },
  { value: "fine", label: "Мелкий", hint: "Насыщенный и крепкий вкус", methods: [
    { name: "Эспрессо", icon: "Gauge" },
    { name: "Чашка", icon: "Coffee" },
  ] },
  { value: "medium", label: "Средний", hint: "Универсальный, мягкий баланс", methods: [
    { name: "Гейзерная кофеварка", icon: "Flame" },
    { name: "Воронка (пуровер)", icon: "Droplets" },
    { name: "Аэропресс", icon: "Syringe" },
    { name: "Домашняя рожковая", icon: "Coffee" },
    { name: "Сифон", icon: "FlaskConical" },
  ] },
  { value: "coarse", label: "Крупный", hint: "Чистый и светлый вкус", methods: [
    { name: "Кемекс", icon: "FlaskConical" },
    { name: "Френчпресс", icon: "Beaker" },
    { name: "Фильтр (капельная кофеварка)", icon: "Filter" },
  ] },
];

export const normalizeGrind = (v: string | null | undefined): Grind => {
  if (v === "ground-ultra" || v === "ground-fine" || v === "ground-medium" || v === "ground-coarse" || v === "ground") return v;
  return "beans";
};

export const grindLabel = (v: string | null | undefined) => {
  if (!v || v === "beans") return "Зерно";
  if (v === "ground") return "Молотый";
  const lvl = GRIND_LEVELS.find(l => `ground-${l.value}` === v);
  return lvl ? `Молотый, ${lvl.label.toLowerCase()}` : "Молотый";
};

export const FORMAT_OPTIONS: { value: WeightFormat; label: string; desc: string }[] = [
  { value: "1kg", label: "1 кг", desc: "HoReCa, оптовые продажи" },
  { value: "250g", label: "250 г", desc: "Розница, полка" },
];

export type PackType = "stm" | "label" | "plain";
export type LabelSize = "classic" | "big" | "any";
export type BagTone = "black" | "white";
export interface Pack { type: PackType; size: LabelSize; tone: BagTone }

export const PACK_TYPES: { value: PackType; label: string; desc: string }[] = [
  { value: "stm", label: "СТМ — ваша марка", desc: "Ваш логотип и дизайн на всей упаковке" },
  { value: "label", label: "Приват лейбл", desc: "Готовый пакет и ваша наклейка с логотипом" },
  { value: "plain", label: "Без логотипа", desc: "Чистый пакет, чёрный или белый" },
];

export const LABEL_SIZES: { value: LabelSize; label: string; desc: string }[] = [
  { value: "classic", label: "Классическая", desc: "Аккуратная этикетка по центру" },
  { value: "big", label: "Большая", desc: "Крупный логотип на пол-пачки" },
  { value: "any", label: "Любая", desc: "Любой формы и размера" },
];

export const TONE_OPTIONS: { value: BagTone; label: string }[] = [
  { value: "black", label: "Чёрный" },
  { value: "white", label: "Белый" },
];

export const DEFAULT_PACK: Pack = { type: "plain", size: "classic", tone: "black" };

export const parsePack = (code: string | null | undefined): Pack => {
  if (!code) return DEFAULT_PACK;
  if (code === "custom" || code === "stm") return { ...DEFAULT_PACK, type: "stm", tone: "white" };
  if (code.startsWith("label-")) {
    const [, size, tone] = code.split("-");
    return {
      type: "label",
      size: size === "big" || size === "any" ? size : "classic",
      tone: tone === "white" ? "white" : "black",
    };
  }
  return { ...DEFAULT_PACK, type: "plain", tone: code === "white" ? "white" : "black" };
};

export const packCode = (p: Pack): string =>
  p.type === "stm" ? "custom" : p.type === "label" ? `label-${p.size}-${p.tone}` : p.tone;

const toneWord = (t: BagTone) => (t === "white" ? "белый" : "чёрный");
const sizeWord = (v: LabelSize) => (v === "big" ? "большая наклейка" : v === "any" ? "наклейка любой формы" : "классическая наклейка");

export const packShort = (code: string | null | undefined): string => {
  if (!code) return "—";
  const p = parsePack(code);
  if (p.type === "stm") return "СТМ";
  if (p.type === "label") return `Приват лейбл · ${toneWord(p.tone)}`;
  return `Без логотипа · ${toneWord(p.tone)}`;
};

export const packLabel = (code: string | null | undefined): string => {
  if (!code) return "—";
  const p = parsePack(code);
  if (p.type === "stm") return "СТМ — ваш логотип и дизайн на упаковке";
  if (p.type === "label") return `Приват лейбл — ${sizeWord(p.size)}, ${toneWord(p.tone)} пакет`;
  return `Без логотипа — ${toneWord(p.tone)} пакет`;
};

export const colorLabel = packLabel;

export const formatLabel = (v: string | null | undefined) => FORMAT_OPTIONS.find(f => f.value === v)?.label ?? v ?? "—";

export const MAX_VOLUME = 5000;
export const PACKAGING_LABEL = "Квадропак, бесшовный пакет";

export const DEFAULT_TIERS: LeadTimeTier[] = [
  { max_volume: 1000, days: 14 },
  { max_volume: 2000, days: 18 },
  { max_volume: null, days: 25 },
];

export const calcPrice1kg = (origin: CalcOrigin) => origin.price_1kg;
export const calcPrice250g = (origin: CalcOrigin) => origin.price_250g;

export function calcAmount(origin: CalcOrigin | undefined, format: WeightFormat, volume: number): number {
  if (!origin) return 0;
  if (format === "250g") return Math.round(Math.round((volume * 1000) / 250) * origin.price_250g);
  return Math.round(volume * origin.price_1kg);
}

export function calcLeadTime(volume: number, tiers: LeadTimeTier[]): number {
  for (const t of tiers) {
    if (t.max_volume === null || volume <= t.max_volume) return t.days;
  }
  return tiers[tiers.length - 1]?.days ?? 14;
}

export const formatRub = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} ₽`;

export const newUid = () => Math.random().toString(36).slice(2, 10);

export interface CalcData {
  origins: CalcOrigin[];
  usdRate: number;
  minVolume: number;
  volumeStep: number;
  tiers: LeadTimeTier[];
  ready: boolean;
}

export function useCalcData(): CalcData {
  const [data, setData] = useState<CalcData>({
    origins: [], usdRate: 85, minVolume: 500, volumeStep: 5, tiers: DEFAULT_TIERS, ready: false,
  });

  useEffect(() => {
    fetch(ABOUT_URL, { headers: { "X-Action": "get-calc" } })
      .then(r => r.json())
      .then(d => setData({
        origins: d.origins || [],
        usdRate: d.usd_rate || 85,
        minVolume: d.min_volume || 500,
        volumeStep: d.volume_step || 5,
        tiers: d.lead_time_tiers || DEFAULT_TIERS,
        ready: true,
      }))
      .catch(() => setData(prev => ({ ...prev, ready: true })));
  }, []);

  return data;
}

export const maxLeadTime = (positions: Position[], tiers: LeadTimeTier[]) =>
  positions.reduce((m, p) => Math.max(m, calcLeadTime(p.volume, tiers)), 0);

// ── Корзина калькулятора: живёт в localStorage, чтобы переехать с сайта в личный кабинет ──

const CART_KEY = "kk_calc_cart";

export interface CalcCart {
  positions: Position[];
  batchName?: string;
}

export const loadCart = (): CalcCart => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return { positions: [] };
    const parsed = JSON.parse(raw) as CalcCart;
    return { positions: Array.isArray(parsed.positions) ? parsed.positions : [], batchName: parsed.batchName };
  } catch {
    return { positions: [] };
  }
};

export const saveCart = (cart: CalcCart) => {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* ignore */ }
};

export const clearCart = () => {
  try { localStorage.removeItem(CART_KEY); } catch { /* ignore */ }
};

export const positionsToApi = (positions: Position[]) =>
  positions.map(p => ({
    origin_id: p.origin_id, roast: p.roast, grind: normalizeGrind(p.grind), packaging: PACKAGING_LABEL, weight_format: p.weight_format,
    color: p.color, volume: p.volume, amount: p.amount,
    note: p.color === "custom" ? "СТМ — логотип и дизайн клиента, детали обсуждаются с менеджером" : parsePack(p.color).type === "label" ? "Приват лейбл — наклейка клиента, макет уточняется с менеджером" : "",
  }));
