import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useLeadModal } from "@/context/LeadModalContext";

const NAV_ITEMS = [
  { label: "О производстве", href: "#features",  section: "features"  },
  { label: "Кофе под СТМ",  href: "#workflow",   section: "workflow"  },
  { label: "Калькулятор",   href: "#calculator", section: "calculator"},
  { label: "Контакты",      href: "#contacts",   section: "contacts"  },
];

const LOGO_URL = "https://cdn.poehali.dev/projects/9054c912-be91-4f90-8cab-0a91d0d7eafe/bucket/9db39a90-e361-4243-b645-550db60b6f4c.png";

const Header = () => {
  const [scrolled,       setScrolled]       = useState(false);
  const [activeSection,  setActiveSection]  = useState("");
  const { openModal } = useLeadModal();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      let current = "";
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.section);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 100) current = item.section;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div id="read-progress" />
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur shadow-sm border-b border-black/8"
          : "bg-white border-b border-black/6"
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">

          {/* Логотип */}
          <Link to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex-shrink-0 flex items-center group">
            <img
              src={LOGO_URL}
              alt="КОНТРАКТ КОФЕ"
              className="h-7 w-auto object-contain"
              style={{ filter: "brightness(0)" }}
            />
          </Link>

          {/* Навигация */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.section;
              return (
                <a key={item.href} href={item.href}
                  className={`relative px-3.5 py-1.5 text-[13px] rounded-full transition-all duration-200 font-medium ${
                    isActive
                      ? "text-foreground"
                      : "text-black/50 hover:text-black/80"
                  }`}>
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-black/6" />
                  )}
                  <span className="relative">{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Правая часть */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href="tel:+79042474302"
              className="hidden lg:flex items-center gap-1.5 text-[13px] font-medium text-black/60 hover:text-black transition-colors">
              <Icon name="Phone" size={13} className="text-black/40" />
              +7 904 247-43-02
            </a>
            <a href="https://t.me/kontraktkafe" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full hover:bg-black/6 text-black/50 hover:text-black transition-all">
              <Icon name="Send" size={14} />
            </a>
            <Link to="/cabinet"
              className="hidden sm:flex items-center gap-1.5 text-[13px] font-medium text-black/60 hover:text-black border border-black/15 hover:border-black/30 px-3 py-1.5 rounded-full transition-all">
              <Icon name="User" size={13} />
              ЛК
            </Link>
            <button onClick={openModal}
              className="bg-foreground text-white px-4 py-1.5 rounded-full text-[13px] font-medium hover:bg-black/80 transition-all active:scale-95">
              Получить предложение
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
