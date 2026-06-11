import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div id="read-progress" />
      <header
        className={`sticky top-0 z-50 transition-all duration-300 border-b border-border/40 ${
          scrolled ? "glass shadow-sm" : "bg-background/95 backdrop-blur"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Icon name="Coffee" size={15} className="text-primary-foreground" />
            </div>
            <span className="font-serif text-base font-semibold tracking-tight">СТМ Кофе</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Возможности", href: "#features" },
              { label: "Как работает", href: "#workflow" },
              { label: "Тарифы", href: "#pricing" },
              { label: "Клиенты", href: "#testimonials" },
              { label: "Калькулятор", href: "#calculator" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full rounded-full" />
              </a>
            ))}
          </nav>

          <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all hover:shadow-md hover:shadow-primary/25 active:scale-95">
            Получить предложение
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;
