import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const FALLBACK_LOGO = "https://cdn.poehali.dev/projects/9054c912-be91-4f90-8cab-0a91d0d7eafe/bucket/9db39a90-e361-4243-b645-550db60b6f4c.png";
const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";

const navLinks = [
  { label: "О производстве", href: "#features"  },
  { label: "Кофе под СТМ",  href: "#workflow"   },
  { label: "Калькулятор",   href: "#calculator" },
  { label: "Контакты",      href: "#contacts"   },
];

const docLinks = [
  { label: "Все документы",               href: "/documents"  },
  { label: "Политика конфиденциальности", href: "/documents"  },
  { label: "Условия сотрудничества",      href: "/documents"  },
  { label: "Сертификаты",                 href: "/documents"  },
  { label: "Реквизиты",                   href: "/documents"  },
];

const Footer = () => {
  const [logoUrl, setLogoUrl] = useState(FALLBACK_LOGO);

  useEffect(() => {
    fetch(ABOUT_URL, { headers: { "X-Action": "get-content" } })
      .then(r => r.json())
      .then(d => { if (d.content?.logo_url) setLogoUrl(d.content.logo_url); })
      .catch(() => {});
  }, []);

  return (
    <footer id="contacts" className="pt-16 pb-8 border-t border-border bg-foreground text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-block mb-5 group">
              <img
                src={logoUrl}
                alt="КОНТРАКТ КОФЕ"
                className="h-10 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </Link>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed mb-6">
              Производство кофе под вашей торговой маркой. Полный цикл — от подбора зерна до доставки.
            </p>

            {/* Контакты */}
            <div className="space-y-3">
              <a href="tel:+79042474302" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="Phone" size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">+7 904 247-43-02</p>
                  <p className="text-[11px] text-white/40 font-mono">ЗВОНКИ И TELEGRAM</p>
                </div>
              </a>
              <a href="https://t.me/kontraktkafe" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="Send" size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Telegram</p>
                  <p className="text-[11px] text-white/40 font-mono">БЫСТРЫЙ ОТВЕТ</p>
                </div>
              </a>
              <a href="mailto:gid150@mail.ru" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="Mail" size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">gid150@mail.ru</p>
                  <p className="text-[11px] text-white/40 font-mono">EMAIL</p>
                </div>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[11px] font-mono font-semibold text-white/40 mb-4 tracking-wider">НАВИГАЦИЯ</h4>
            <ul className="space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-mono font-semibold text-white/40 tracking-wider">ДОКУМЕНТЫ</h4>
              <Link to="/documents" className="text-[10px] font-mono text-primary hover:text-primary/80 transition-colors">
                все →
              </Link>
            </div>
            <ul className="space-y-2.5">
              {docLinks.slice(1).map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Status */}
          <div>
            <h4 className="text-[11px] font-mono font-semibold text-white/40 mb-4 tracking-wider">ПРОИЗВОДСТВО</h4>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white font-semibold">ЛИНИЯ АКТИВНА</span>
              </div>
              <p className="text-white/50">Принимаем заявки</p>
              <p className="text-white/50">Срок — от 14 дней</p>
              <div className="pt-2 border-t border-white/10">
                <a href="#calculator" className="text-primary hover:text-primary/80 transition-colors font-semibold">
                  Рассчитать стоимость →
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 gap-2">
          <p className="text-xs text-white/30">© 2026 КонтрактКофе. Все права защищены.</p>
          <p className="text-xs text-white/30">Технологичное производство · Полный цикл · Россия</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;