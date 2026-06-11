import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const navLinks = [
  { label: "Возможности", href: "#features" },
  { label: "Как работает", href: "#workflow" },
  { label: "Тарифы", href: "#pricing" },
  { label: "Калькулятор", href: "#calculator" },
];

const docLinks = [
  "Политика конфиденциальности",
  "Условия сотрудничества",
  "Сертификаты",
  "Реквизиты",
];

const Footer = () => {
  return (
    <footer className="pt-16 pb-8 border-t border-border bg-secondary/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <Icon name="Coffee" size={15} className="text-primary-foreground" />
              </div>
              <span className="font-serif text-base font-semibold">СТМ Кофе</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
              Производство кофе под вашей торговой маркой. Полный цикл — от подбора зерна до доставки.
            </p>
            <div className="flex gap-3">
              {[
                { icon: "Phone", label: "+7 (800) 000-00-00" },
                { icon: "Mail", label: "info@stmcoffee.ru" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon name={c.icon} fallback="Circle" size={12} className="text-primary" />
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-foreground mb-4 tracking-wider">НАВИГАЦИЯ</h4>
            <ul className="space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-foreground mb-4 tracking-wider">ДОКУМЕНТЫ</h4>
            <ul className="space-y-2.5">
              {docLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Status widget */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-foreground mb-4 tracking-wider">ПРОИЗВОДСТВО</h4>
            <div className="bg-card border border-border rounded-xl p-4 font-mono text-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-foreground font-semibold">ЛИНИЯ АКТИВНА</span>
              </div>
              <p className="text-muted-foreground">Принимаем заявки</p>
              <p className="text-muted-foreground">Срок — от 14 дней</p>
              <div className="pt-2 border-t border-border">
                <button className="text-primary hover:underline text-xs font-semibold">
                  Оставить заявку →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border gap-2">
          <p className="text-xs text-muted-foreground">© 2026 СТМ Кофе. Все права защищены.</p>
          <p className="text-xs text-muted-foreground">Технологичное производство · Полный цикл · Россия</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
