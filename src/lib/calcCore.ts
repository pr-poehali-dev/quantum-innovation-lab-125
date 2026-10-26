import { useEffect, useState } from "react";
import { ABOUT_URL } from "@/lib/siteContent";

export interface CalcOrigin {
  id: number;
  label: string;
  price_1kg: number;
  price_250g: number;
  sort_order: number;
}

export interface LeadTimeTier { max_volume: number | null; days: number }

export type WeightFormat = "1kg" | "250g";
export type BagColor = "black" | "white" | "custom";
export type Grind = "beans" | "ground";

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

export const grindLabel = (v: string | null | undefined) => (v === "ground" ? "Молотый" : "Зерно");

export const FORMAT_OPTIONS: { value: WeightFormat; label: string; desc: string }[] = [
  { value: "1kg", label: "1 кг", desc: "HoReCa, оптовые продажи" },
  { value: "250g", label: "250 г", desc: "Розница, полка" },
];

export const COLOR_OPTIONS: { value: BagColor; label: string; desc: string }[] = [
  { value: "black", label: "Чёрный", desc: "Стандартный цвет" },
  { value: "white", label: "Белый", desc: "Стандартный цвет" },
  { value: "custom", label: "Своя упаковка", desc: "Детали — с менеджером" },
];

export const colorLabel = (v: string | null | undefined) => COLOR_OPTIONS.find(c => c.value === v)?.label ?? v ?? "—";
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
    origin_id: p.origin_id, roast: p.roast, grind: p.grind === "ground" ? "ground" : "beans", packaging: PACKAGING_LABEL, weight_format: p.weight_format,
    color: p.color, volume: p.volume, amount: p.amount,
    note: p.color === "custom" ? "Своя упаковка — детали обсуждаются с менеджером" : "",
  }));
