import Icon from "@/components/ui/icon";

const CTASection = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative bg-card border border-border rounded-3xl p-12 md:p-16 overflow-hidden">
          {/* Decorative corner icons */}
          <div className="absolute top-8 left-8 w-10 h-10 border border-border rounded-lg flex items-center justify-center">
            <Icon name="Coffee" size={16} className="text-muted-foreground" />
          </div>
          <div className="absolute top-8 right-8 w-10 h-10 border border-border rounded-lg flex items-center justify-center">
            <Icon name="Zap" size={16} className="text-muted-foreground" />
          </div>
          <div className="absolute bottom-8 left-8 w-10 h-10 border border-border rounded-lg flex items-center justify-center">
            <Icon name="Package" size={16} className="text-muted-foreground" />
          </div>
          <div className="absolute bottom-8 right-8 w-10 h-10 border border-border rounded-lg flex items-center justify-center">
            <Icon name="Users" size={16} className="text-muted-foreground" />
          </div>
          <div className="absolute top-1/2 right-16 -translate-y-1/2 w-10 h-10 border border-border rounded-lg hidden md:flex items-center justify-center">
            <Icon name="Truck" size={16} className="text-muted-foreground" />
          </div>
          <div className="absolute bottom-1/3 left-16 w-10 h-10 border border-border rounded-lg hidden md:flex items-center justify-center">
            <span className="text-muted-foreground text-lg">+</span>
          </div>

          {/* Main content */}
          <div className="text-center max-w-2xl mx-auto relative z-10">
            <h2 className="font-serif text-4xl md:text-5xl mb-4 leading-tight">
              Запустите свой бренд кофе
              <br />
              уже через 14 дней.
            </h2>
            <p className="text-muted-foreground mb-8">
              Присоединяйтесь к 500+ компаниям, которые продают кофе под своей маркой. Получите бесплатный образец и расчёт стоимости.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors">
                Получить образец бесплатно
                <Icon name="ArrowRight" size={16} />
              </button>
              <button className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-full text-sm font-medium hover:bg-secondary transition-colors">
                Рассчитать стоимость
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
