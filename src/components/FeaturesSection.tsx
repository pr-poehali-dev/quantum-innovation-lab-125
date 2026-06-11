import Icon from "@/components/ui/icon";

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start justify-between mb-16 scroll-reveal">
          <div>
            <span className="text-xs font-mono text-primary tracking-wider">ПРЕИМУЩЕСТВА</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3 font-bold max-w-lg leading-tight">
              Почему бизнес выбирает<br />
              <span className="text-primary">СТМ Кофе</span>
            </h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs hidden md:block mt-2">
            Технологичное производство полного цикла — от подбора зерна до доставки готовой продукции.
          </p>
        </div>

        {/* Top row */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-card border border-border rounded-2xl p-6 card-hover scroll-reveal" data-delay="0">
            <div className="flex items-start justify-between mb-6">
              <span className="text-xs font-mono text-muted-foreground">ФУНКЦИЯ</span>
              <span className="text-xs font-mono text-primary">ОБЖАРКА</span>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-card rounded-full px-3 py-1 border border-border">
                  <div className="w-4 h-4 rounded-full bg-amber-300" />
                  <div className="w-4 h-4 rounded-full bg-amber-700" />
                </div>
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-primary rounded-full" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">MEDIUM</span>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">Точная обжарка</h3>
            <p className="text-sm text-muted-foreground">
              Выбирайте степень обжарки под ваш сегмент: светлая для specialty, тёмная для эспрессо.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 card-hover scroll-reveal" data-delay="100">
            <div className="flex items-start justify-between mb-6">
              <span className="text-xs font-mono text-muted-foreground">ФУНКЦИЯ</span>
              <span className="text-xs font-mono text-primary">СЕГМЕНТЫ</span>
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
                    className={`text-center p-2 rounded-lg transition-colors hover:bg-primary/5 ${i < 5 ? "bg-card border border-border" : "border border-dashed border-border"}`}
                  >
                    <div className="w-6 h-6 mx-auto mb-1 rounded bg-secondary flex items-center justify-center">
                      <Icon name={item.icon} fallback="Circle" size={12} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">Для любого бизнеса</h3>
            <p className="text-sm text-muted-foreground">Кофейни, HoReCa, вендинг и корпоративные офисы.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 card-hover scroll-reveal" data-delay="200">
            <div className="flex items-start justify-between mb-6">
              <span className="text-xs font-mono text-muted-foreground">ФУНКЦИЯ</span>
              <span className="text-xs font-mono text-primary">ПОЛНЫЙ_ЦИКЛ</span>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4 mb-6 flex items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/30 flex items-center justify-center">
                  <Icon name="RefreshCw" size={24} className="text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                  <Icon name="Check" size={12} className="text-accent-foreground" />
                </div>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">Полный цикл под ключ</h3>
            <p className="text-sm text-muted-foreground">
              Зерно → обжарка → упаковка → доставка. Вы только продаёте.
            </p>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 card-hover scroll-reveal" data-delay="100">
            <div className="flex gap-6">
              <div className="bg-primary/10 rounded-xl p-4 flex-shrink-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center">
                  <Icon name="Zap" size={28} className="text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <span className="text-xs font-mono text-muted-foreground">СКОРОСТЬ</span>
                <h3 className="font-semibold text-2xl mb-1 mt-1">14 дней до старта</h3>
                <p className="text-sm text-muted-foreground">
                  От заявки до первой партии с вашим логотипом — всего две недели.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 card-hover scroll-reveal" data-delay="200">
            <div className="flex gap-6">
              <div className="flex-1">
                <span className="text-xs font-mono text-muted-foreground">МИНИМАЛЬНЫЙ ЗАКАЗ</span>
                <h3 className="font-semibold text-2xl mb-1 mt-1">от 50 кг / партия</h3>
                <p className="text-sm text-muted-foreground">
                  Низкий порог входа. Масштабируйтесь без рисков.
                </p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 flex-shrink-0 flex items-center">
                <div className="flex gap-1">
                  {["5", "0", "+"].map((num, i) => (
                    <div key={i} className="w-8 h-10 bg-card border border-border rounded flex items-center justify-center">
                      <span className="font-mono text-lg font-bold text-primary">{num}</span>
                    </div>
                  ))}
                  <div className="w-12 h-10 bg-primary/10 border border-primary/20 rounded flex items-center justify-center ml-1">
                    <span className="font-mono text-sm text-primary font-semibold">кг</span>
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
