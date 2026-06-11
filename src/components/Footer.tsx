import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                <Icon name="Coffee" size={12} className="text-primary-foreground" />
              </div>
              <span className="font-serif">СТМ Кофе.</span>
            </Link>
            <p className="text-xs font-mono text-muted-foreground">
              ПРОИЗВОДСТВО КОФЕ
              <br />
              ПОД ВАШЕЙ МАРКОЙ
            </p>
            <p className="text-xs font-mono text-muted-foreground mt-4">ПОЛНЫЙ ЦИКЛ</p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-mono text-muted-foreground mb-4">НАВИГАЦИЯ</h4>
            <ul className="space-y-2">
              {["О продукте", "Тарифы", "Клиенты", "Калькулятор"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-mono text-muted-foreground mb-4">ДОКУМЕНТЫ</h4>
            <ul className="space-y-2">
              {["Политика конфиденциальности", "Условия сотрудничества", "Сертификаты", "Реквизиты"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-mono text-muted-foreground mb-4">ПРОИЗВОДСТВО</h4>
            <div className="bg-secondary/50 rounded-xl p-4 font-mono text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">СТАТУС ПРОИЗВОДСТВА</span>
              </div>
              <div className="space-y-1">
                <p className="text-primary">ЛИНИЯ_ОБЖАРКИ [АКТИВНА]</p>
                <p className="text-muted-foreground">Принимаем заявки. Срок — 14 дней</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between mt-12 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground">2026 СТМ КОФЕ. ВСЕ ПРАВА ЗАЩИЩЕНЫ.</p>
          <p className="text-xs text-muted-foreground">ТЕХНОЛОГИЧНОЕ ПРОИЗВОДСТВО · ПОЛНЫЙ ЦИКЛ · РОССИЯ</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
