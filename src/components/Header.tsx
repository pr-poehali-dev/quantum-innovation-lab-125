import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Возможности", href: "#features", section: "features" },
  { label: "Как работает", href: "#workflow", section: "workflow" },
  { label: "Тарифы", href: "#pricing", section: "pricing" },
  { label: "Клиенты", href: "#testimonials", section: "testimonials" },
  { label: "Калькулятор", href: "#calculator", section: "calculator" },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);

      // определяем активную секцию
      const sections = NAV_ITEMS.map((item) => ({
        id: item.section,
        el: document.getElementById(item.section),
      }));

      let current = "";
      for (const { id, el } of sections) {
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 100) current = id;
      }
      setActiveSection(current);
    };

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
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          {/* Логотип */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <img
              src="https://cdn.poehali.dev/projects/9054c912-be91-4f90-8cab-0a91d0d7eafe/bucket/1fea491b-de88-4f80-b66b-333fd9211c44.png"
              alt="КонтрактКофе"
              className="h-9 w-auto object-contain group-hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* Навигация с подсветкой активной секции */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.section;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-primary/8 border border-primary/20" />
                  )}
                  <span className="relative">{item.label}</span>
                  {/* подчёркивание при hover (только если не активный) */}
                  {!isActive && (
                    <span className="absolute bottom-0.5 left-3 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-[calc(100%-24px)] rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>

          <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all hover:shadow-md hover:shadow-primary/25 active:scale-95 flex-shrink-0">
            Получить предложение
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;
