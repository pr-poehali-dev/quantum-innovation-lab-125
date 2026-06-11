import Icon from "@/components/ui/icon";

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start justify-between mb-16">
          <div>
            <span className="text-xs font-mono text-muted-foreground tracking-wider">ПРЕИМУЩЕСТВА</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-4 max-w-lg leading-tight">
              Почему бизнес выбирает СТМ Кофе
            </h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs hidden md:block">
            Технологичное производство полного цикла — от подбора зерна до доставки готовой продукции.
          </p>
        </div>

        {/* Top row features */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Roasting control */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <span className="text-xs font-mono text-muted-foreground">ФУНКЦИЯ</span>
              <span className="text-xs font-mono text-muted-foreground">ОБЖАРКА</span>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-card rounded-full px-3 py-1 border border-border">
                  <div className="w-4 h-4 rounded-full bg-amber-300" />
                  <div className="w-4 h-4 rounded-full bg-amber-700" />
                </div>
                <div className="flex-1 h-1 bg-border rounded-full">
                  <div className="w-1/2 h-full bg-amber-600 rounded-full" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">MEDIUM</span>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">Точная обжарка</h3>
            <p className="text-sm text-muted-foreground">
              Выбирайте степень обжарки под ваш сегмент: светлая для specialty, тёмная для эспрессо.
            </p>
          </div>

          {/* Segments */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <span className="text-xs font-mono text-muted-foreground">ФУНКЦИЯ</span>
              <span className="text-xs font-mono text-muted-foreground">СЕГМЕНТЫ</span>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: "Кофейни", icon: "Coffee" },
                  { name: "Рестораны", icon: "UtensilsCrossed" },
                  { name: "Отели", icon: "Hotel" },
                  { name: "Вендинг", icon: "Cpu" },
                  { name: "Офисы", icon: "Building2" },
                  { name: "Ещё", icon: "Plus" },
                ].map((item, i) => (
                  <div
                    key={item.name}
                    className={`text-center p-2 rounded-lg ${i < 5 ? "bg-card border border-border" : "border border-dashed border-border"}`}
                  >
                    <div className="w-6 h-6 mx-auto mb-1 rounded bg-secondary flex items-center justify-center">
                      <Icon name={item.icon} fallback="Circle" size={12} className="text-muted-foreground" />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">Для любого бизнеса</h3>
            <p className="text-sm text-muted-foreground">Адаптируем формат и объём под кофейни, HoReCa, вендинг и корпоративные офисы.</p>
          </div>

          {/* Full cycle */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <span className="text-xs font-mono text-muted-foreground">ФУНКЦИЯ</span>
              <span className="text-xs font-mono text-muted-foreground">ПОЛНЫЙ_ЦИКЛ</span>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 mb-6 flex items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-accent flex items-center justify-center">
                  <Icon name="RefreshCw" size={24} className="text-foreground" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Icon name="Check" size={12} className="text-primary-foreground" />
                </div>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">Полный цикл под ключ</h3>
            <p className="text-sm text-muted-foreground">
              Зерно → обжарка → брендированная упаковка → доставка. Вы только продаёте.
            </p>
          </div>
        </div>

        {/* Bottom row features */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex gap-6">
              <div className="bg-secondary/50 rounded-xl p-4 flex-shrink-0">
                <div className="relative w-20 h-20 rounded-full border-4 border-accent flex items-center justify-center">
                  <Icon name="Zap" size={32} className="text-foreground" />
                </div>
              </div>
              <div className="flex-1">
                <span className="text-xs font-mono text-muted-foreground">СКОРОСТЬ</span>
                <h3 className="font-semibold text-2xl mb-1 mt-1">14 дней до старта</h3>
                <p className="text-sm text-muted-foreground">
                  От заявки до первой партии с вашим логотипом — всего две недели. Минимальная бюрократия, максимум скорости.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex gap-6">
              <div className="flex-1">
                <span className="text-xs font-mono text-muted-foreground">МИНИМАЛЬНЫЙ ЗАКАЗ</span>
                <h3 className="font-semibold text-2xl mb-1 mt-1">от 50 кг / партия</h3>
                <p className="text-sm text-muted-foreground">
                  Низкий порог входа для старта. Масштабируйтесь по мере роста продаж без лишних рисков.
                </p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 flex-shrink-0 flex items-center">
                <div className="flex gap-1">
                  {["5", "0", "+"].map((num, i) => (
                    <div
                      key={i}
                      className="w-8 h-10 bg-card border border-border rounded flex items-center justify-center"
                    >
                      <span className="font-mono text-lg">{num}</span>
                    </div>
                  ))}
                  <div className="w-12 h-10 bg-card border border-border rounded flex items-center justify-center ml-1">
                    <span className="font-mono text-sm">кг</span>
                  </div>
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