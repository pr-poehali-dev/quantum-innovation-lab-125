import { useEffect, useState } from "react";
import { ABOUT_URL } from "@/lib/siteContent";

export interface PriceRow {
  row: number;
  label: string;
  hint: string;
  values: (number | null)[];
  is_total: boolean;
}

export interface PriceFormat {
  key: "1kg" | "250g";
  title: string;
  rows: PriceRow[];
}

export interface PriceTableData {
  products: { col: string; label: string }[];
  formats: PriceFormat[];
  rate: number | null;
  updated_at: string | null;
}

let cache: Promise<PriceTableData | null> | null = null;

export const fetchPriceTable = (fresh = false): Promise<PriceTableData | null> => {
  if (!cache || fresh) {
    cache = fetch(ABOUT_URL, { headers: { "X-Action": "get-price-table" } })
      .then(r => r.json())
      .then(d => (d.products?.length ? (d as PriceTableData) : null))
      .catch(() => { cache = null; return null; });
  }
  return cache;
};

export const usePriceTable = (enabled: boolean) => {
  const [data, setData] = useState<PriceTableData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    setLoading(true);
    fetchPriceTable(true).then(d => { if (alive) { setData(d); setLoading(false); } });
    return () => { alive = false; };
  }, [enabled]);

  return { data, loading };
};

export const PRICE_MODAL_EVENT = "kk-open-price-table";
export const openPriceTable = () => window.dispatchEvent(new Event(PRICE_MODAL_EVENT));

export const fmtPrice = (v: number | null, digits = 0) =>
  v === null ? "—" : v.toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const isMoneyRow = (label: string) => !label.includes("$/кг");
