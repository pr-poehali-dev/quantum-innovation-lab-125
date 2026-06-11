import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-sm flex items-center justify-center">
            <Icon name="Coffee" size={14} className="text-primary-foreground" />
          </div>
          <span className="font-serif text-lg tracking-tight">СТМ Кофе</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Возможности
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Тарифы
          </a>
          <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Клиенты
          </a>
          <a href="#calculator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Калькулятор
          </a>
        </nav>

        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
          Получить предложение
        </button>
      </div>
    </header>
  );
};

export default Header;
