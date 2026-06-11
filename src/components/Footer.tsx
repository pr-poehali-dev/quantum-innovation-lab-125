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
            <Link to="/" className="flex items-center mb-4 group w-fit">
              <img
                src="https://cdn.poehali.dev/projects/9054c912-be91-4f90-8cab-0a91d0d7eafe/bucket/1fea491b-de88-4f80-b66b-333fd9211c44.png"
                alt="КонтрактКофе"
                className="h-8 w-auto object-contain group-hover:opacity-70 transition-opacity"
              />
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
              Производство кофе под вашей торговой маркой. Полный цикл — от подбора зерна до доставки.
            </p>
            <div className="flex gap-3">
              {[
                { icon: "Phone", label: "+7 (800) 000-00-00" },
                { icon: "Mail", label: "info@kontraktkafe.ru" },
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
          <p className="text-xs text-muted-foreground">© 2026 КонтрактКофе. Все права защищены.</p>
          <p className="text-xs text-muted-foreground">Технологичное производство · Полный цикл · Россия</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;