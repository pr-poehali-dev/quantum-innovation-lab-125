import { Check, Lock, Mail, Zap } from "lucide-react";

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start justify-between mb-16">
          <div>
            <span className="text-xs font-mono text-muted-foreground tracking-wider">МОДУЛИ_СИСТЕМЫ</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-4 max-w-lg leading-tight">
              Почему профессионалы выбирают InboxPilot
            </h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs hidden md:block">
            Точность человеческого письма встречает бесконечные возможности ИИ.
          </p>
        </div>

        {/* Top row features */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Tone Control */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <span className="text-xs font-mono text-muted-foreground">ФУНКЦИЯ</span>
              <span className="text-xs font-mono text-muted-foreground">МОДУЛЯЦИЯ_ТОНА</span>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-card rounded-full px-3 py-1 border border-border">
                  <div className="w-4 h-4 rounded-full bg-foreground" />
                  <div className="w-4 h-4 rounded-full border-2 border-border" />
                </div>
                <div className="flex-1 h-1 bg-border rounded-full">
                  <div className="w-2/3 h-full bg-foreground rounded-full" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">ФОРМАЛЬНО</span>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">Контроль тона</h3>
            <p className="text-sm text-muted-foreground">
              Мгновенное переключение режимов: от неформального Slack до делового стиля.
            </p>
          </div>

          {/* Works Everywhere */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <span className="text-xs font-mono text-muted-foreground">ФУНКЦИЯ</span>
              <span className="text-xs font-mono text-muted-foreground">КАНАЛЫ_ВВОДА</span>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-3 gap-2">
                {["Gmail", "Outlook", "Slack", "Teams", "Discord", "Ещё"].map((app, i) => (
                  <div
                    key={app}
                    className={`text-center p-2 rounded-lg ${i < 5 ? "bg-card border border-border" : "border border-dashed border-border"}`}
                  >
                    <div className="w-6 h-6 mx-auto mb-1 rounded bg-secondary flex items-center justify-center">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{app}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-2">
                <span className="text-[10px] font-mono text-accent-foreground bg-accent px-2 py-0.5 rounded">
                  + ЕЩЁ
                </span>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">Работает везде</h3>
            <p className="text-sm text-muted-foreground">Нативные интеграции для Gmail, Outlook и Superhuman.</p>
          </div>

          {/* Private By Design */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <span className="text-xs font-mono text-muted-foreground">ФУНКЦИЯ</span>
              <span className="text-xs font-mono text-muted-foreground">УРОВЕНЬ_БЕЗОПАСНОСТИ</span>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 mb-6 flex items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-accent flex items-center justify-center">
                  <Lock className="w-6 h-6 text-foreground" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">Приватность по умолчанию</h3>
            <p className="text-sm text-muted-foreground">
              Шифрование корпоративного уровня. Ваши данные никогда не обучают наши модели.
            </p>
          </div>
        </div>

        {/* Bottom row features */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Saves Time */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex gap-6">
              <div className="bg-secondary/50 rounded-xl p-4 flex-shrink-0">
                <div className="relative w-20 h-20 rounded-full border-4 border-accent flex items-center justify-center">
                  <Zap className="w-8 h-8 text-foreground" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono text-muted-foreground">МЕТРИКА</span>
                </div>
                <h3 className="font-semibold text-2xl mb-1">Экономит 12ч / неделю</h3>
                <p className="text-sm text-muted-foreground">
                  Верните свои утра. InboxPilot берет на себя рутину, чтобы вы могли сосредоточиться на важном.
                </p>
              </div>
            </div>
          </div>

          {/* Volume */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex gap-6">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono text-muted-foreground">ОБЪЁМ</span>
                </div>
                <h3 className="font-semibold text-2xl mb-1">500+ писем / месяц</h3>
                <p className="text-sm text-muted-foreground">
                  Создан для больших объёмов. Будь то тикеты поддержки, рассылки или внутренняя переписка.
                </p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 flex-shrink-0">
                <div className="flex gap-1">
                  {["5", "0", "0", "+"].map((num, i) => (
                    <div
                      key={i}
                      className="w-8 h-10 bg-card border border-border rounded flex items-center justify-center"
                    >
                      <span className="font-mono text-lg">{num}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
