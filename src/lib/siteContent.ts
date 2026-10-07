import { useEffect, useState } from "react";

export const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";

const cache = new Map<string, Promise<unknown>>();

export function fetchSection<T>(key: string): Promise<T | null> {
  if (!cache.has(key)) {
    cache.set(
      key,
      fetch(ABOUT_URL, { headers: { "X-Action": "get-sections", "X-Section-Key": key } })
        .then(r => r.json())
        .then(d => d.data ?? null)
        .catch(() => { cache.delete(key); return null; }),
    );
  }
  return cache.get(key) as Promise<T | null>;
}

export function useSection<T extends object>(key: string, fallback: T): T {
  const [data, setData] = useState<T>(fallback);
  useEffect(() => {
    let alive = true;
    fetchSection<T>(key).then(d => { if (alive && d) setData({ ...fallback, ...d }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return data;
}

export interface SiteContacts {
  phone: string;
  phone_note: string;
  email: string;
  telegram: string;
  whatsapp: string;
  vk: string;
  max: string;
  address: string;
  work_hours: string;
}

export const DEFAULT_CONTACTS: SiteContacts = {
  phone: "+7 904 247-43-02",
  phone_note: "Звонки и Telegram",
  email: "gid150@mail.ru",
  telegram: "https://t.me/kontraktkafe",
  whatsapp: "",
  vk: "",
  max: "",
  address: "",
  work_hours: "Пн–Пт, 9:00–18:00",
};

export const useContacts = () => useSection<SiteContacts>("contacts", DEFAULT_CONTACTS);

export const phoneHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;
