export const PASSPORT = {
  id: "PP-0042",
  brand: "NORD ROAST",
  sub: "SPECIALTY · ETHIOPIA",
  accent: "#60a5fa",
  colorTop: "#1e40af",
  colorBottom: "#0f172a",
  versions: [
    {
      v: "v3", date: "05.06.2026", active: true,
      note: "Обжарка переведена на более тёмный профиль (по запросу клиента)",
      params: [
        { label: "Зерно",    val: "Эфиопия Иргачеффе"   },
        { label: "Смесь",    val: "100% моносорт"        },
        { label: "Обжарка",  val: "Тёмная · 220°C"       },
        { label: "Формат",   val: "Зерно · 250г"         },
        { label: "Упаковка", val: "Фольга с логотипом"   },
        { label: "Дизайн",   val: "Макет v3 (финал)"     },
      ],
    },
    { v: "v2", date: "12.04.2026", active: false, note: "Изменена фасовка с 1кг на 250г", params: [] },
    { v: "v1", date: "18.02.2026", active: false, note: "Первый согласованный рецепт",    params: [] },
  ],
};

export const TIMELINE = [
  { id: 1, label: "Зерно на складе",   icon: "Leaf",        done: true,  date: "01.06", desc: "200 кг · Эфиопия"  },
  { id: 2, label: "Обжарка",           icon: "Flame",        done: true,  date: "04.06", desc: "Тёмный профиль"    },
  { id: 3, label: "Фасовка",           icon: "Package",      done: true,  date: "07.06", desc: "800 пакетов 250г"  },
  { id: 4, label: "Контроль качества", icon: "ShieldCheck",  done: false, date: "09.06", desc: "В процессе"        },
  { id: 5, label: "Отгрузка",          icon: "Truck",        done: false, date: "11.06", desc: "СДЭК · ожидание"  },
];

export const ORDERS_HISTORY = [
  { id: "ORD-2847", date: "05.06.2026", brand: "NORD ROAST",  volume: 200, total: "97 400 ₽",  status: "production" },
  { id: "ORD-2601", date: "12.04.2026", brand: "TERRA VERDE", volume: 300, total: "138 600 ₽", status: "done"       },
  { id: "ORD-2390", date: "18.02.2026", brand: "NORD ROAST",  volume: 150, total: "63 000 ₽",  status: "done"       },
];

export const DOCS = [
  { name: "Счёт №847 от 05.06.2026",    type: "Счёт",      order: "ORD-2847", size: "84 КБ"  },
  { name: "УПД №601 от 12.04.2026",     type: "Накладная", order: "ORD-2601", size: "112 КБ" },
  { name: "Акт выполненных работ №601", type: "Акт",       order: "ORD-2601", size: "96 КБ"  },
  { name: "Декларация соответствия",    type: "Документ",  order: "ORD-2601", size: "210 КБ" },
  { name: "Счёт №390 от 18.02.2026",    type: "Счёт",      order: "ORD-2390", size: "78 КБ"  },
];

export const MOCKUPS = [
  { name: "nord_label_v3_ФИНАЛ.pdf", date: "05.06.2026", status: "approved", comment: ""                     },
  { name: "nord_label_v2.pdf",       date: "12.04.2026", status: "archived", comment: "Устарел — заменён v3" },
  { name: "brand_guide_nord.ai",     date: "18.02.2026", status: "approved", comment: ""                     },
];

export type Tab = "passport" | "live" | "reorder" | "docs";

export const TABS: { id: Tab; label: string; icon: string; badge?: string }[] = [
  { id: "passport", label: "Паспорт продукта", icon: "BookOpen"              },
  { id: "live",     label: "Партия в эфире",   icon: "Radio",  badge: "LIVE" },
  { id: "reorder",  label: "Повторить партию", icon: "RefreshCw"             },
  { id: "docs",     label: "Документы",        icon: "FileText"              },
];

