import Icon from "@/components/ui/icon";

interface PricingTier {
  name: string;
  price: string;
  unit: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: "СТАРТ",
    price: "от 50 кг",
    unit: "минимальная партия",
    description: "Для старта своей марки кофе без больших вложений.",
    features: [
      "От 50 кг за партию",
      "1 смесь на выбор",
      "Базовая упаковка с логотипом",
      "Срок производства 14 дней",
      "Доставка по России",
    ],
  },
  {
    name: "БИЗНЕС",
    price: "от 200 кг",
    unit: "минимальная партия",
    description: "Для растущих сетей и стабильных поставок.",
    features: [
      "От 200 кг за партию",
      "До 3 смесей в линейке",
      "Дизайн упаковки под ключ",
      "Срок производства 10 дней",
      "Приоритетная отгрузка",
    ],
    popular: true,
  },
  {
    name: "ПАРТНЁР",
    price: "от 1 000 кг",
    unit: "минимальная партия",
    description: "Для крупных сетей, вендинга и оптовых дистрибьюторов.",
    features: [
      "Объём без ограничений",
      "Неограниченная линейка",
      "Персональный менеджер",
      "Индивидуальные условия",
      "Аналитика продаж",
    ],
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-mono text-muted-foreground tracking-wider">ТАРИФЫ</span>
          <h2 className="font-serif text-4xl md:text-5xl mt-4 mb-4">
            Выберите формат
            <br />
            сотрудничества
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="bg-[#fffef0] px-3 py-1 rounded shadow-sm rotate-[-2deg] border border-amber-100">
              <span className="text-xs font-mono">ОБРАЗЕЦ_БЕСПЛАТНО</span>
            </div>
            <p className="text-muted-foreground text-sm">Без скрытых платежей. Получите образец до оплаты.</p>
            <div className="bg-[#fffef0] px-3 py-1 rounded shadow-sm rotate-[2deg] border border-amber-100">
              <span className="text-xs font-mono">ПОЛНЫЙ ЦИКЛ</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`bg-card border rounded-2xl p-6 relative flex flex-col ${
                tier.popular ? "border-primary shadow-lg" : "border-border"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-mono px-3 py-1 rounded-full">
                  ПОПУЛЯРНЫЙ
                </div>
              )}

              <div className="mb-6">
                <span className="text-xs font-mono text-muted-foreground">{tier.name}</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-serif">{tier.price}</span>
                </div>
                <span className="text-xs text-muted-foreground">{tier.unit}</span>
                <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>
              </div>

              <div className="space-y-3 flex-1">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <Icon name="Check" size={10} className="text-accent-foreground" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-3 rounded-full text-sm font-medium transition-colors mt-6 ${
                  tier.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border hover:bg-secondary"
                }`}
              >
                ПОЛУЧИТЬ ПРЕДЛОЖЕНИЕ
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
