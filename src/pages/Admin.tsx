import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";
import logo from "@/assets/logo.png";

const CHAT_URL = "https://functions.poehali.dev/f943216e-4ba2-4e31-9cff-fcfc562f339b";

const SECTIONS = [
  {
    href: "/admin/crm",
    icon: "Users",
    title: "Клиенты и сделки",
    desc: "Новые заявки, профили клиентов, этапы сделок",
    tag: "CRM",
  },
  {
    href: "/admin/chats",
    icon: "MessageCircle",
    title: "Чаты с клиентами",
    desc: "Переписка из личного кабинета — поддержка и менеджеры",
    tag: "Чат",
  },
  {
    href: "/admin/staff",
    icon: "UserPlus",
    title: "Сотрудники",
    desc: "Приглашения коллег в закрытую админку",
    tag: "Доступ",
  },
  {
    href: "/admin/about",
    icon: "Image",
    title: "Блок «О компании»",
    desc: "Фотографии производства, тексты, статистика",
    tag: "Контент",
  },
  {
    href: "/admin/documents",
    icon: "FileText",
    title: "Документы и сертификаты",
    desc: "Загрузка PDF, управление категориями, видимость",
    tag: "Файлы",
  },
  {
    href: "/admin/rate",
    icon: "DollarSign",
    title: "Курс доллара",
    desc: "Обновляйте раз в неделю — курс влияет на стоимость кофе",
    tag: "Шапка",
  },
  {
    href: "/admin/calc",
    icon: "Calculator",
    title: "Калькулятор кофе",
    desc: "Сорта, цены зерна, логистика — данные для расчёта",
    tag: "Калькулятор",
  },
];

const Admin = () => {
  const { staff, token, logout } = useStaffAuth();
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetch(CHAT_URL, { headers: { "X-Action": "list-conversations", "X-Staff-Token": token } })
      .then(r => r.json())
      .then(d => setUnreadChats((d.conversations || []).reduce((sum: number, c: { unread: number }) => sum + c.unread, 0)))
      .catch(() => {});
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/admin" className="flex-shrink-0">
            <img src={logo} alt="КОНТРАКТ КОФЕ" width={112} height={42} className="h-7 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            {staff && (
              <span className="text-[13px] text-muted-foreground">{staff.name || staff.email}</span>
            )}
            <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors" title="Выйти">
              <Icon name="LogOut" size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-serif text-3xl font-bold">Администрирование</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Управление контентом сайта КонтрактКофе
          </p>
        </div>

        <div className="grid gap-3">
          {SECTIONS.map(s => (
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
                  {s.href === "/admin/chats" && unreadChats > 0 && (
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