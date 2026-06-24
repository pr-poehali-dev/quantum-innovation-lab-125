// ─────────────────────────────────────────────────────────────
// КОНФИГ ВАРИАНТОВ ПАЧКИ — замените image на свой дизайн
// ─────────────────────────────────────────────────────────────

export interface CoffeeBrand {
  id: number;
  image: string;
  accent: string;
}

export const COFFEE_BRANDS: CoffeeBrand[] = [
  { id: 1, image: "https://cdn.poehali.dev/projects/9054c912-be91-4f90-8cab-0a91d0d7eafe/bucket/cb53cb92-7579-46a7-8ea9-a2d6c945ce52.png", accent: "#c4a494" },
  { id: 2, image: "https://cdn.poehali.dev/projects/9054c912-be91-4f90-8cab-0a91d0d7eafe/bucket/b48634dc-d892-4fca-a300-bb132d57dabe.png", accent: "#7a8c72" },
  { id: 3, image: "https://cdn.poehali.dev/projects/9054c912-be91-4f90-8cab-0a91d0d7eafe/bucket/a43b898c-ab4b-4e8e-b5f4-7aa856c60fed.png", accent: "#c96f47" },
];

export const CYCLE_MS = 3000;