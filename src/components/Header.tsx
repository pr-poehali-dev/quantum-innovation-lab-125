import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useLeadModal } from "@/context/LeadModalContext";

const NAV_ITEMS = [
  { label: "Возможности", href: "#features", section: "features" },
  { label: "Как работает", href: "#workflow", section: "workflow" },
  { label: "Калькулятор", href: "#calculator", section: "calculator" },
  { label: "Клиенты", href: "#testimonials", section: "testimonials" },
];

const FULL_TEXT = "КонтрактКофе";
const TYPING_SPEED = 90;

const TypewriterLogo = () => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (displayed.length < FULL_TEXT.length) {
      const t = setTimeout(() => {
        setDisplayed(FULL_TEXT.slice(0, displayed.length + 1));
      }, TYPING_SPEED);
      return () => clearTimeout(t);
    } else {
      setDone(true);
    }
  }, [displayed]);

  return (
    <div className="flex flex-col leading-none">
      <span className="font-serif text-[15px] font-bold tracking-tight text-foreground flex items-center">
        {displayed}
        <span
          className={`inline-block w-[2px] h-[15px] bg-primary ml-[2px] align-middle ${
            done ? "animate-blink" : "opacity-100"
          }`}
        />
      </span>
      <span className="text-[10px] font-mono text-muted-foreground tracking-widest mt-0.5 uppercase">
        от зерна до пачки
      </span>
    </div>
  );
};

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
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
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>

      <div id="read-progress" />
      <header
        className={`sticky top-0 z-50 transition-all duration-300 border-b border-border/40 ${
          scrolled ? "glass shadow-sm" : "bg-background/95 backdrop-blur"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

          {/* Логотип — динамический текст */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                {/* Чашка */}
                <path d="M3 7h8v3.5A3 3 0 0 1 8 13.5 3 3 0 0 1 3 10.5Z" fill="white" opacity="0.95"/>
                {/* Ручка */}
                <path d="M11 8.5h1a1.5 1.5 0 0 1 0 3h-1" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                {/* Пар — три волнистые линии */}
                <path d="M5 5 C5 4.2 5.8 3.8 5.8 3 C5.8 2.2 5 1.8 5 1" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.8"/>
                <path d="M7.5 5 C7.5 4.2 8.3 3.8 8.3 3 C8.3 2.2 7.5 1.8 7.5 1" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.8"/>
                <path d="M10 5 C10 4.2 10.8 3.8 10.8 3 C10.8 2.2 10 1.8 10 1" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.8"/>
              </svg>
            </div>
            <TypewriterLogo />
          </Link>

          {/* Навигация */}
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
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Кнопка личного кабинета */}
            <Link to="/cabinet" className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium border border-border hover:bg-secondary hover:border-primary/30 transition-all">
              <Icon name="User" size={14} />
              <span className="hidden sm:inline">Личный кабинет</span>
            </Link>
            <button onClick={openModal} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all hover:shadow-md hover:shadow-primary/25 active:scale-95">
              Получить предложение
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;