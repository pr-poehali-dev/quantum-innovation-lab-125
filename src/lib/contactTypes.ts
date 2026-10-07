export interface ContactItem {
  type: string;
  value: string;
  label?: string;
}

export interface ContactTypeDef {
  type: string;
  label: string;
  icon: string;
  letter?: string;
  color: string;
  placeholder: string;
  href: (v: string) => string;
}

const digits = (v: string) => v.replace(/[^\d]/g, "");
const url = (v: string) => (/^https?:\/\//i.test(v) ? v : `https://${v}`);

export const CONTACT_TYPES: ContactTypeDef[] = [
  { type: "phone", label: "Телефон", icon: "Phone", color: "#16a34a", placeholder: "+7 900 000-00-00", href: v => `tel:${v.replace(/[^+\d]/g, "")}` },
  { type: "telegram", label: "Telegram", icon: "Send", color: "#229ed9", placeholder: "https://t.me/username",
    href: v => (v.startsWith("@") ? `https://t.me/${v.slice(1)}` : /^[\w]+$/.test(v) ? `https://t.me/${v}` : url(v)) },
  { type: "whatsapp", label: "WhatsApp", icon: "MessageCircle", color: "#25d366", placeholder: "+7 900 000-00-00",
    href: v => (/^https?:/i.test(v) ? v : `https://wa.me/${digits(v)}`) },
  { type: "vk", label: "ВКонтакте", icon: "Share2", letter: "VK", color: "#0077ff", placeholder: "https://vk.com/username", href: url },
  { type: "max", label: "MAX", icon: "MessageSquare", letter: "MAX", color: "#7c3aed", placeholder: "Ссылка на профиль в MAX", href: url },
  { type: "email", label: "Email", icon: "Mail", color: "#ea580c", placeholder: "name@company.ru", href: v => `mailto:${v}` },
  { type: "site", label: "Сайт", icon: "Globe", color: "#475569", placeholder: "https://example.ru", href: url },
  { type: "custom", label: "Другое", icon: "Link", color: "#64748b", placeholder: "Ссылка", href: url },
];

export const getContactType = (type: string): ContactTypeDef =>
  CONTACT_TYPES.find(c => c.type === type) ?? CONTACT_TYPES[CONTACT_TYPES.length - 1];

export interface TeamMember {
  id: number;
  staff_id: number | null;
  first_name: string;
  last_name: string;
  position: string;
  description: string;
  photo_url: string;
  contacts: ContactItem[];
  show_on_site?: boolean;
  active?: boolean;
  sort_order?: number;
}

export const memberName = (m: Pick<TeamMember, "first_name" | "last_name">) =>
  `${m.first_name} ${m.last_name}`.trim();

export const initialsOf = (name: string) =>
  name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
