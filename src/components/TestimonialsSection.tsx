interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    id: "ANC-0088",
    quote:
      "Раньше я боялся открывать почту. Теперь я смотрю, как курсор движется, и чувствую, будто нанял личного помощника. Он так точно копирует мой тон, что это даже немного пугает.",
    author: "Алексей Чен",
    role: "ОСНОВАТЕЛЬ, VESSEL",
  },
  {
    id: "ANC-2301",
    quote:
      "Первый ИИ-инструмент, который не звучит как ИИ. Кратко, вежливо и беспощадно эффективно. Именно так, как я люблю. За неделю сэкономил 14 часов.",
    author: "Маркус Отеро",
    role: "ПАРТНЁР, SEQUOIA",
  },
  {
    id: "ANC-7725",
    quote:
      "InboxPilot обрабатывает 80% моей почты до того, как я выпью кофе. Это не просто инструмент продуктивности — это изменение образа жизни.",
    author: "Сара Дженкинс",
    role: "CEO, LINEAR",
  },
  {
    id: "ANC-0030",
    quote:
      "Он знает, когда быть формальным, а когда использовать эмодзи. Как будто читает мои мысли до того, как я напишу запрос.",
    author: "Елена Фишер",
    role: "ПРОДУКТОВЫЙ ДИРЕКТОР, NOTION",
  },
  {
    id: "ANC-2134",
    quote: "Минималистичный интерфейс — это глоток свежего воздуха. Наконец-то софт, который уважает моё внимание.",
    author: "Дмитрий Парк",
    role: "ДИЗАЙН-ДИРЕКТОР, FIGMA",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start justify-between mb-16">
          <div>
            <span className="text-xs font-mono text-muted-foreground tracking-wider">ЗАЛ СЛАВЫ</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-4 max-w-md leading-tight">
              Профессионалы, которые больше не пишут одни
            </h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs hidden md:block">
            Реальные отзывы от нашей сети.
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
            <p className="text-sm text-muted-foreground mt-1">Присоединяйтесь к архиву.</p>
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
