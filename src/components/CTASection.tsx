import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";

export interface CtaData {
  eyebrow: string;
  title_line1: string;
  title_line2: string;
  subtitle: string;
}

const DEFAULT_CTA: CtaData = {
  eyebrow: "ГОТОВЫ К СТАРТУ?",
  title_line1: "Запустите свой бренд кофе",
  title_line2: "уже через 14 дней.",
  subtitle: "Присоединяйтесь к 500+ компаниям, которые продают кофе под своей маркой.",
};

const CTASection = () => {
  const [cta, setCta] = useState<CtaData>(DEFAULT_CTA);

  useEffect(() => {
    fetch(ABOUT_URL, { headers: { "X-Action": "get-sections", "X-Section-Key": "cta" } })
      .then(r => r.json())
      .then(d => { if (d.data) setCta(d.data); })
      .catch(() => {});
  }, []);

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative bg-primary rounded-3xl p-12 md:p-16 overflow-hidden scroll-reveal">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          </div>

          {/* Decorative corner icons */}
          {[
            { icon: "Coffee", pos: "top-8 left-8" },
            { icon: "Zap", pos: "top-8 right-8" },
            { icon: "Package", pos: "bottom-8 left-8" },
            { icon: "Users", pos: "bottom-8 right-8" },
          ].map((d) => (
            <div
              key={d.icon}
              className={`absolute ${d.pos} w-10 h-10 border border-white/20 rounded-lg flex items-center justify-center`}
            >
              <Icon name={d.icon} fallback="Circle" size={16} className="text-white/40" />
            </div>
          ))}

          {/* Main content */}
          <div className="text-center max-w-2xl mx-auto relative z-10">
            <span className="inline-block text-xs font-mono text-white/60 tracking-wider mb-4">{cta.eyebrow}</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {cta.title_line1}
              <br />
              {cta.title_line2}
            </h2>
            <p className="text-white/70 mb-8 text-base">
              {cta.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="#calculator"
                className="inline-flex items-center gap-2 bg-white text-primary px-7 py-3.5 rounded-full text-sm font-semibold hover:bg-white/90 transition-all hover:shadow-xl active:scale-95"
              >
                Рассчитать стоимость
                <Icon name="ArrowRight" size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;