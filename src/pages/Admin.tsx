import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStaffAuth } from "@/context/StaffAuthContext";
import logo from "@/assets/logo.png";

const CHAT_URL = "https://functions.poehali.dev/f943216e-4ba2-4e31-9cff-fcfc562f339b";
const TEST_CLIENT_EMAIL = "test-client@kontraktkafe.ru";
const TEST_CLIENT_CODE = "000000";

type Role = "owner" | "manager" | "support";

interface Section {
  href: string;
  icon: string;
  title: string;
  desc: string;
  tag: string;
  roles: Role[];
}

const SECTIONS: Section[] = [
  {
    href: "/admin/crm",
    icon: "Users",
    title: "Клиенты, сделки и чаты",
    desc: "Канбан сделок, новые заявки, переписка с клиентами — единое рабочее пространство",
    tag: "CRM",
    roles: ["owner", "manager", "support"],
  },
  {
    href: "/admin/pages",
    icon: "FileStack",
    title: "Страницы сайта",
    desc: "Политика конфиденциальности, условия, реквизиты — редактируемые страницы в футере",
    tag: "Контент",
    roles: ["owner"],
  },
  {
    href: "/admin/rate",
    icon: "DollarSign",
    title: "Курс доллара",
    desc: "Обновляйте раз в неделю — курс влияет на стоимость кофе",
    tag: "Шапка",
    roles: ["owner", "manager"],
  },
  {
    href: "/admin/calc",
    icon: "Calculator",
    title: "Калькулятор кофе",
    desc: "Сорта, цены зерна, логистика — данные для расчёта",
    tag: "Калькулятор",
    roles: ["owner", "manager"],
  },
  {
    href: "/admin/staff",
    icon: "UserPlus",
    title: "Сотрудники",
    desc: "Приглашения коллег, роли и доступ",
    tag: "Доступ",
    roles: ["owner"],
  },
  {
    href: "/admin/about",
    icon: "Image",
    title: "Блок «О компании»",
    desc: "Фотографии производства, тексты, статистика",
    tag: "Контент",
    roles: ["owner"],
  },
  {
    href: "/admin/landing",
    icon: "LayoutTemplate",
    title: "Редактор лендинга",
    desc: "Главный экран, этапы работы, преимущества, футер, отзывы",
    tag: "Контент",
    roles: ["owner"],
  },
  {
    href: "/admin/settings",
    icon: "Settings",
    title: "Настройки",
    desc: "Email-отправитель для писем, поля логистики доставки",
    tag: "Система",
    roles: ["owner"],
  },
];

const ROLE_LABELS: Record<Role, string> = { owner: "Владелец", manager: "Менеджер", support: "Поддержка" };

const Admin = () => {
  const { staff, token, logout, startPreview } = useStaffAuth();
  const [unreadChats, setUnreadChats] = useState(0);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [clientBusy, setClientBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const role: Role = staff?.role || (staff?.is_owner ? "owner" : "manager");
  const isOwner = role === "owner" && !staff?.is_preview;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!token) return;
    fetch(CHAT_URL, { headers: { "X-Action": "list-conversations", "X-Staff-Token": token } })
      .then(r => r.json())
      .then(d => setUnreadChats((d.conversations || []).reduce((sum: number, c: { unread: number }) => sum + c.unread, 0)))
      .catch(() => {});
  }, [token]);

  const visibleSections = SECTIONS.filter(s => s.roles.includes(role));

  const openPreview = async (previewRole: "manager" | "support") => {
    setPreviewBusy(true);
    const res = await startPreview(previewRole);
    setPreviewBusy(false);
    if (res.ok && res.url) window.open(res.url, "_blank", "noopener");
    else showToast(res.error || "Не удалось открыть просмотр", false);
  };

  const openClientPreview = async () => {
    setClientBusy(true);
    try {
      const r = await fetch("https://functions.poehali.dev/6de59166-2dc1-44b2-831e-bc348d5c3c83", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "verify-code" },
        body: JSON.stringify({ email: TEST_CLIENT_EMAIL, code: TEST_CLIENT_CODE }),
      });
      const d = await r.json();
      if (!r.ok) { showToast(d.error || "Не удалось открыть кабинет клиента", false); return; }
      window.open(`${window.location.origin}/cabinet?client_token=${d.token}`, "_blank", "noopener");
    } catch {
      showToast("Ошибка сети", false);
    } finally {
      setClientBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {staff?.is_preview && (
        <div className="sticky top-0 z-50 bg-amber-500 text-white text-[13px] font-medium px-4 py-2 flex items-center justify-center gap-2">
          <Icon name="Eye" size={14} />
          Режим просмотра: вы видите админку глазами роли «{ROLE_LABELS[role]}» — редактирование части разделов ограничено
        </div>
      )}

      <header className="bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/admin" className="flex-shrink-0">
            <img src={logo} alt="КОНТРАКТ КОФЕ" width={112} height={42} className="h-7 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            {staff && (
              <span className="text-[13px] text-muted-foreground">
                {staff.name || staff.email}
                {!staff.is_preview && (
                  <span className="ml-1.5 text-[10px] font-mono bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full align-middle">
                    {ROLE_LABELS[role]}
                  </span>
                )}
              </span>
            )}
            <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors" title="Выйти">
              <Icon name="LogOut" size={16} />
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium ${
          toast.ok ? "bg-green-500 text-white" : "bg-destructive text-white"
        }`}>
          <Icon name={toast.ok ? "Check" : "X"} size={14} />
          {toast.msg}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl font-bold">Администрирование</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Управление контентом сайта КонтрактКофе
            </p>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <button onClick={openClientPreview} disabled={clientBusy}
                className="flex items-center gap-1.5 text-[13px] font-medium border border-border px-3 py-2 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-60">
                {clientBusy ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Icon name="User" size={14} />}
                Как клиент
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button disabled={previewBusy}
                    className="flex items-center gap-1.5 text-[13px] font-medium border border-border px-3 py-2 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-60">
                    {previewBusy ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Icon name="Eye" size={14} />}
                    Как менеджер
                    <Icon name="ChevronDown" size={12} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openPreview("manager")} className="gap-2">
                    <Icon name="UserCog" size={14} /> Как менеджер
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openPreview("support")} className="gap-2">
                    <Icon name="Headset" size={14} /> Как поддержка
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div className="grid gap-3">
          {visibleSections.map(s => (
            <Link key={s.href} to={s.href}
              className="flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4 hover:border-primary/40 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                <Icon name={s.icon} fallback="Settings" size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{s.title}</p>
                  <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {s.tag}
                  </span>
                  {s.href === "/admin/crm" && unreadChats > 0 && (
                    <span className="text-[10px] font-mono bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      {unreadChats}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
              <Icon name="ChevronRight" size={16} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>

        {/* Быстрые ссылки */}
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-[11px] font-mono text-muted-foreground mb-4 tracking-wider">БЫСТРЫЕ ССЫЛКИ</p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/",             label: "Главная страница",  icon: "Home"        },
              { href: "/cabinet",      label: "Личный кабинет",    icon: "User"        },
              { href: "/documents",    label: "Страница документов", icon: "FileText"  },
            ].map(l => (
              <Link key={l.href} to={l.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[13px] text-muted-foreground hover:text-foreground hover:border-foreground/25 transition-all">
                <Icon name={l.icon} fallback="Link" size={13} />
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;