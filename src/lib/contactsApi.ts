export const CONTACTS_URL = "https://functions.poehali.dev/414b7cf7-665c-4630-aa5a-d006b0e34a51";

export interface Tag { id: number; name: string; color: string; count?: number }

export interface Contact {
  id: number;
  code: string | null;
  company: string;
  segment: string | null;
  city: string | null;
  call_window: string | null;
  priority: number | null;
  phone: string | null;
  email: string | null;
  call_status: string;
  need: string | null;
  volume_note: string | null;
  important: string | null;
  mailing_consent: boolean;
  client_id: number | null;
  last_call_at: string | null;
  next_call_at: string | null;
  archived: boolean;
  created_at: string;
  tag_ids: number[];
}

export interface ContactComment { id: number; staff_name: string | null; text: string; created_at: string }
export interface ContactCall { id: number; staff_name: string | null; result: string; comment: string | null; created_at: string }
export interface ContactDeal { id: number; brand: string | null; volume: number | null; amount: number | null; stage: string; created_at: string }
export interface ContactFull extends Contact { comments: ContactComment[]; calls: ContactCall[]; deals: ContactDeal[] }

export const STATUS_LABELS: Record<string, string> = {
  new: "Не звонили",
  no_answer: "Не дозвонились",
  talked: "Поговорили",
  callback: "Перезвонить",
  interested: "Интерес",
  refused: "Отказ",
};

export const CALL_RESULTS = ["no_answer", "talked", "callback", "interested", "refused"];

export const STATUS_STYLES: Record<string, string> = {
  new: "bg-secondary text-muted-foreground",
  no_answer: "bg-amber-100 text-amber-800",
  talked: "bg-blue-100 text-blue-800",
  callback: "bg-purple-100 text-purple-800",
  interested: "bg-green-100 text-green-800",
  refused: "bg-red-100 text-red-800",
};

export const TAG_COLORS: Record<string, string> = {
  gray: "bg-gray-100 text-gray-700",
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-800",
  green: "bg-green-100 text-green-700",
  teal: "bg-teal-100 text-teal-700",
  blue: "bg-blue-100 text-blue-700",
  indigo: "bg-indigo-100 text-indigo-700",
  purple: "bg-purple-100 text-purple-700",
  rose: "bg-rose-100 text-rose-700",
  orange: "bg-orange-100 text-orange-700",
  slate: "bg-slate-100 text-slate-600",
};

export const firstPhone = (p: string | null) => (p ? p.split(/[;,]/)[0].split(/вн\./i)[0].trim() : "");
export const telHref = (p: string | null) => `tel:${firstPhone(p).replace(/[^\d+]/g, "")}`;

export const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

export const statusFromText = (t: string | null | undefined): string => {
  const s = (t || "").toLowerCase().trim();
  if (!s || s === "не звонил") return "new";
  if (/не рассматр|не интерес|ликвид|не заинтерес|не наш клиент/.test(s)) return "refused";
  if (/не дозвон|не довзон|недозвон|не берут|не берёт|не берет|трубк|не стал звонить|номер недоступен/.test(s)) return "no_answer";
  if (/звонил|позвонил|дозвонил|связал|общени|пообщал/.test(s)) return "talked";
  return "new";
};
