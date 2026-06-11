interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    id: "CLT-0088",
    quote:
      "Запустили свою марку кофе за 3 недели. СТМ Кофе взяли на себя всё: подбор зерна, дизайн, обжарку. Гости в наших кофейнях не верят, что мы не крупная сеть.",
    author: "Алексей Громов",
    role: "ВЛАДЕЛЕЦ, СЕТЬ КОФЕЕН «УТРО»",
  },
  {
    id: "CLT-2301",
    quote:
      "Вендинговый бизнес вырос на 40% после того как перешли на свою марку. Клиенты узнают наш кофе, лояльность выросла. Партнёрство с СТМ Кофе — лучшее решение.",
    author: "Марина Козлова",
    role: "ДИРЕКТОР, VENDEX GROUP",
  },
  {
    id: "CLT-7725",
    quote:
      "Для отеля важна подача. Кофе под нашим брендом — это часть сервиса. Качество стабильное, логистика без сбоев. Работаем уже 2 года.",
    author: "Дмитрий Нечаев",
    role: "F&B МЕНЕДЖЕР, ОТЕЛЬ «МЕРИДИАН»",
  },
  {
    id: "CLT-0030",
    quote:
      "Ресторан начал продавать кофе навынос под своим лейблом — это дополнительный доход без лишних усилий. СТМ Кофе всё настроили с нуля.",
    author: "Ирина Фёдорова",
    role: "УПРАВЛЯЮЩАЯ, РЕСТОРАН «БЕРЕГ»",
  },
  {
    id: "CLT-2134",
    quote: "Минимальная партия от 50 кг позволила нам протестировать формат без риска. Теперь берём по 500 кг ежемесячно.",
    author: "Павел Орлов",
    role: "CO-FOUNDER, COFFEEBAR CHAIN",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start justify-between mb-16">
          <div>
            <span className="text-xs font-mono text-muted-foreground tracking-wider">КЛИЕНТЫ</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-4 max-w-md leading-tight">
              Бизнес, который уже запустил свою марку
            </h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs hidden md:block">
            500+ партнёров по всей России.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((testimonial) => (
            <div key={testimonial.id} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-muted-foreground">REF</span>
                <span className="text-xs font-mono text-primary">{testimonial.id}</span>
                <div className="w-12 h-12 bg-secondary rounded-lg" />
              </div>
              <p className="text-sm leading-relaxed mb-6">{testimonial.quote}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{testimonial.author}</p>
                  <p className="text-xs font-mono text-muted-foreground">{testimonial.role}</p>
                </div>
                <div className="w-4 h-4 border border-border rounded flex items-center justify-center">
                  <span className="text-[8px]">-&gt;</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {testimonials.slice(3, 4).map((testimonial) => (
            <div key={testimonial.id} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-muted-foreground">REF</span>
                <span className="text-xs font-mono text-primary">{testimonial.id}</span>
                <div className="w-12 h-12 bg-secondary rounded-lg" />
              </div>
              <p className="text-sm leading-relaxed mb-6">{testimonial.quote}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{testimonial.author}</p>
                  <p className="text-xs font-mono text-muted-foreground">{testimonial.role}</p>
                </div>
                <div className="w-4 h-4 border border-border rounded flex items-center justify-center">
                  <span className="text-[8px]">-&gt;</span>
                </div>
              </div>
            </div>
          ))}

          {/* Join CTA */}
          <div className="bg-secondary/50 border border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center mb-3">
              <span className="text-lg">+</span>
            </div>
            <span className="text-sm font-mono text-muted-foreground">ВАША ИСТОРИЯ ЗДЕСЬ</span>
            <p className="text-sm text-muted-foreground mt-1">Станьте следующим партнёром.</p>
          </div>

          {testimonials.slice(4).map((testimonial) => (
            <div key={testimonial.id} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-muted-foreground">REF</span>
                <span className="text-xs font-mono text-primary">{testimonial.id}</span>
                <div className="w-12 h-12 bg-secondary rounded-lg" />
              </div>
              <p className="text-sm leading-relaxed mb-6">{testimonial.quote}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{testimonial.author}</p>
                  <p className="text-xs font-mono text-muted-foreground">{testimonial.role}</p>
                </div>
                <div className="w-4 h-4 border border-border rounded flex items-center justify-center">
                  <span className="text-[8px]">-&gt;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
