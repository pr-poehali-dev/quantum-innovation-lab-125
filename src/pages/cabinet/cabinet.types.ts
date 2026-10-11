export type Tab = "new-order" | "batches" | "drafts" | "docs" | "mockups" | "chat" | "profile";

export interface SidebarItem {
  id: Tab;
  label: string;
  icon: string;
  badge?: string | number;
}

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    title: "Заказы",
    items: [
      { id: "batches", label: "Мои партии", icon: "Package" },
      { id: "drafts", label: "Черновики заявок", icon: "FilePen" },
    ],
  },
  {
    title: "Мои данные",
    items: [
      { id: "docs", label: "Документы", icon: "FileText" },
      { id: "mockups", label: "Дизайн-макеты", icon: "Palette" },
    ],
  },
  {
    title: "Коммуникации",
    items: [{ id: "chat", label: "Чат с менеджером", icon: "MessageCircle" }],
  },
  {
    title: "Профиль",
    items: [{ id: "profile", label: "Личные данные", icon: "UserCog" }],
  },
];
