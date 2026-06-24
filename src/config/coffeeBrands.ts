// ─────────────────────────────────────────────────────────────
// КОНФИГ ВАРИАНТОВ ПАЧКИ — замените image на свой дизайн
// ─────────────────────────────────────────────────────────────

export interface CoffeeBrand {
  id: number;
  image: string;
  accent: string;
}

const BAG = "https://cdn.poehali.dev/projects/9054c912-be91-4f90-8cab-0a91d0d7eafe/bucket/f7011528-26d3-4692-9ea8-9e66df504338.png";

export const COFFEE_BRANDS: CoffeeBrand[] = [
  { id: 1, image: BAG, accent: "#a87c5a" },
  { id: 2, image: BAG, accent: "#6b8f71" },
  { id: 3, image: BAG, accent: "#c17c5a" },
];

export const CYCLE_MS = 3000;
