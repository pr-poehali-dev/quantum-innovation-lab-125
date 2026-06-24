import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useLeadModal } from "@/context/LeadModalContext";

// Порядок совпадает с порядком блоков на странице
const NAV_ITEMS = [
  { label: "Кофе под СТМ",  href: "#workflow",      section: "workflow"      },
  { label: "О производстве", href: "#features",     section: "features"      },
  { label: "Калькулятор",   href: "#calculator",    section: "calculator"    },
  { label: "Клиенты",       href: "#testimonials",  section: "testimonials"  },
  { label: "Контакты",      href: "#contacts",      section: "contacts"      },
];

const FALLBACK_LOGO =
  "https://cdn.poehali.dev/projects/9054c912-be91-4f90-8cab-0a91d0d7eafe/bucket/9db39a90-e361-4243-b645-550db60b6f4c.png";
const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";

const Header = () => {
  const [scrolled,      setScrolled]      = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [logoUrl,       setLogoUrl]       = useState(FALLBACK_LOGO);
  const [usdRate,       setUsdRate]       = useState<number | null>(null);
  const { openModal } = useLeadModal();

  useEffect(() => {
    fetch(ABOUT_URL, { headers: { "X-Action": "get-content" } })
      .then(r => r.json())
      .then(d => { if (d.content?.logo_url) setLogoUrl(d.content.logo_url); })
      .catch(() => {});
    fetch(ABOUT_URL, { headers: { "X-Action": "get-rate" } })
      .then(r => r.json())
      .then(d => { if (d.rate) setUsdRate(d.rate); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      let current = "";
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.section);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 120) current = item.section;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        #read-progress {
          position: fixed; top: 0; left: 0; height: 2px;
          background: hsl(var(--primary)); z-index: 100;
          transition: width 0.1s linear;
        }
      `}</style>
      <div id="read-progress" />

      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/96 backdrop-blur-md shadow-sm border-b border-black/8"
          : "bg-white border-b border-black/6"
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">

          {/* Логотип */}
          <Link to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex-shrink-0 group">
            <img
              src={logoUrl}
              alt="КОНТРАКТ КОФЕ"
              className="h-10 w-auto object-contain group-hover:opacity-80 transition-opacity"
              style={{ filter: "brightness(0)" }}
            />
          </Link>

          {/* Навигация */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.section;
              const isCalc   = item.section === "calculator";
              return (
                <a key={item.href} href={item.href}
                  className={`relative px-3 py-1.5 text-[13px] rounded-full transition-all duration-200 font-medium flex items-center gap-1.5 ${
                    isActive
                      ? "text-primary"
                      : "text-black/50 hover:text-black/80"
                  }`}>
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-primary/8 border border-primary/20" />
                  )}
                  {isCalc && (
                    <Icon name="Calculator" size={13} className={`relative ${isActive ? "text-primary" : "text-black/40"}`} />
                  )}
                  <span className="relative">{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Курс доллара */}
          {usdRate !== null && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full border border-black/10 bg-black/3 flex-shrink-0">
              <span className="text-[11px] font-mono text-black/35">USD</span>
              <span className="text-[12px] font-mono font-semibold text-black/70">{usdRate.toFixed(2)} ₽</span>
            </div>
          )}

          {/* Правая часть */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href="tel:+79042474302"
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full hover:bg-primary/8 text-black/40 hover:text-primary transition-all"
              title="+7 904 247-43-02">
              <Icon name="Phone" size={14} />
            </a>

            <a href="https://t.me/kontraktkafe" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full hover:bg-primary/8 text-black/40 hover:text-primary transition-all"
              title="Написать в Telegram">
              <Icon name="Send" size={14} />
            </a>

            <Link to="/cabinet"
              className="hidden sm:flex items-center gap-1.5 text-[13px] font-medium text-black/55 hover:text-foreground border border-black/12 hover:border-black/25 px-3 py-1.5 rounded-full transition-all">
              <Icon name="User" size={13} />
              ЛК
            </Link>

            <button onClick={openModal}
              className="bg-primary text-white px-4 py-1.5 rounded-full text-[13px] font-semibold hover:bg-primary/90 transition-all active:scale-95 shadow-sm shadow-primary/20">
              Получить предложение
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;