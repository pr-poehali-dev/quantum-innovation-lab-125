interface WorkflowStep {
  number: string;
  title: string;
  description: string;
  visual: "note" | "scan" | "draft" | "send";
}

const steps: WorkflowStep[] = [
  {
    number: "01",
    title: "Задача",
    description: "Одно небрежное предложение. Или голосовое сообщение за рулем.",
    visual: "note",
  },
  {
    number: "02",
    title: "Анализ контекста",
    description: "ИИ анализирует предыдущие переписки и ваш тон.",
    visual: "scan",
  },
  {
    number: "03",
    title: "Мгновенный черновик",
    description: "Идеальный, соответствующий политике ответ появляется в почте.",
    visual: "draft",
  },
  {
    number: "04",
    title: "Отправка",
    description: "Одобрение в один клик. Или доработайте, если хотите.",
    visual: "send",
  },
];

const WorkflowSection = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start justify-between mb-16">
          <div>
            <span className="text-xs font-mono text-muted-foreground tracking-wider">АВТОМАТИЗАЦИЯ</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-4 max-w-md leading-tight">
              Четыре секунды от мысли до отправки.
            </h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs hidden md:block">
            Без промптов. Без редактирования. Просто вы, но лучше.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <div className="bg-card border border-border rounded-2xl p-6 h-full">
                {/* Visual placeholder */}
                <div className="aspect-square bg-secondary/50 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
                  {step.visual === "note" && (
                    <div className="bg-[#fffef0] p-4 rounded shadow-sm rotate-[-2deg] border border-amber-100">
                      <p className="text-xs font-mono text-muted-foreground">ЗАМЕТКА</p>
                      <p className="text-sm font-serif italic mt-1">"Бюджета нет до Q2."</p>
                    </div>
                  )}
                  {step.visual === "scan" && (
                    <div className="space-y-2 w-full px-4">
                      <div className="h-2 bg-border rounded w-3/4" />
                      <div className="h-2 bg-border rounded w-full" />
                      <div className="h-2 bg-border rounded w-2/3" />
                      <div className="flex gap-1 mt-4">
                        <div className="w-3 h-3 rounded-full bg-accent" />
                        <div className="flex-1 h-3 bg-border rounded" />
                      </div>
                    </div>
                  )}
                  {step.visual === "draft" && (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-sm w-4/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-muted-foreground">ЧЕРНОВИК</span>
                        <span className="text-[10px] font-mono text-green-600">ГОТОВ</span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 bg-border rounded w-full" />
                        <div className="h-1.5 bg-border rounded w-4/5" />
                        <div className="h-1.5 bg-border rounded w-3/4" />
                      </div>
                    </div>
                  )}
                  {step.visual === "send" && (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 bg-accent/50 rounded-full px-4 py-2">
                        <span className="text-xs font-mono">ОТПРАВИТЬ</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono text-muted-foreground">{step.number}</span>
                </div>
                <h3 className="font-medium text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 border-t border-dashed border-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
