import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Main hero area */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground border border-border rounded-full px-3 py-1">
              <span>AI-АССИСТЕНТ ДЛЯ ПОЧТЫ V2.0</span>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.1] text-balance">
              Письма, которые
              <br />
              пишут себя сами.
            </h1>

            <p className="text-muted-foreground text-lg max-w-md">
              Одна краткая мысль от вас. Идеальные, профессиональные ответы каждый раз.
            </p>

            <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
              Попробовать бесплатно
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right visual */}
          <div className="relative">
            {/* Interface mockup container */}
            <div className="relative bg-secondary/50 rounded-3xl p-8 border border-border/50">
              {/* Top labels */}
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-4">
                <span>№01 — ИНТЕРФЕЙС_АССИСТЕНТА</span>
                <span>БЕЗОПАСНОЕ_СОЕДИНЕНИЕ</span>
              </div>

              {/* Sticky note */}
              <div className="absolute -left-4 top-20 bg-[#fffef0] p-3 rounded shadow-sm rotate-[-3deg] border border-amber-100 w-36">
                <p className="text-xs font-mono text-foreground/80">ЗАМЕТКА</p>
                <p className="text-sm font-serif italic mt-1">«Бюджета нет до Q2.»</p>
              </div>

              {/* Typewriter keyboard */}
              <div className="bg-[#4a5d52] rounded-2xl p-6 my-6 mx-auto max-w-sm">
                <div className="flex justify-between text-[8px] text-white/70 font-mono mb-2 px-2">
                  <span>АВТОМАТИЧЕСКИЙ ЧЕРНОВИК</span>
                  <span>ДАТА_ОТПРАВКИ</span>
                </div>
                <div className="text-[10px] text-white/80 font-mono mb-4 px-2">
                  <p>Кому: Совет директоров</p>
                  <p>Тема: Финансовое планирование Q2</p>
                </div>
                <div className="bg-[#3a4a42] rounded-xl p-3">
                  <div className="grid grid-cols-10 gap-1">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((key) => (
                      <div
                        key={key}
                        className="w-5 h-5 bg-[#2a3a32] rounded text-[8px] text-white/60 flex items-center justify-center font-mono"
                      >
                        {key}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-10 gap-1 mt-1">
                    {["Й", "Ц", "У", "К", "Е", "Н", "Г", "Ш", "Щ", "З"].map((key) => (
                      <div
                        key={key}
                        className="w-5 h-5 bg-[#2a3a32] rounded text-[8px] text-white/60 flex items-center justify-center font-mono"
                      >
                        {key}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-9 gap-1 mt-1 px-2">
                    {["Ф", "Ы", "В", "А", "П", "Р", "О", "Л", "Д"].map((key) => (
                      <div
                        key={key}
                        className="w-5 h-5 bg-[#2a3a32] rounded text-[8px] text-white/60 flex items-center justify-center font-mono"
                      >
                        {key}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat bubbles */}
              <div className="absolute -right-2 top-32 space-y-2">
                <div className="bg-card border border-border rounded-xl p-3 shadow-sm max-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-secondary rounded-full" />
                    <span className="text-xs font-medium">Иван Петров</span>
                    <span className="text-[10px] text-muted-foreground">ДИРЕКТОР</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Добрый день,</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-3 shadow-sm max-w-[200px]">
                  <p className="text-xs text-muted-foreground">
                    Спасибо за информацию. Мы понимаем ограничения по бюджету и вернёмся к этому...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
