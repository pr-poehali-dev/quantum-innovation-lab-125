import Icon from "@/components/ui/icon";

interface WorkflowStep {
  number: string;
  title: string;
  description: string;
  visual: "request" | "recipe" | "roast" | "deliver";
}

const steps: WorkflowStep[] = [
  {
    number: "01",
    title: "Заявка",
    description: "Заполняете бриф: объём, вкусовой профиль, сегмент аудитории, пожелания по упаковке.",
    visual: "request",
  },
  {
    number: "02",
    title: "Рецептура и образец",
    description: "Подбираем зерно, разрабатываем смесь, высылаем пробную партию на дегустацию.",
    visual: "recipe",
  },
  {
    number: "03",
    title: "Обжарка и упаковка",
    description: "Обжариваем промышленную партию и упаковываем в вашу фирменную упаковку с логотипом.",
    visual: "roast",
  },
  {
    number: "04",
    title: "Доставка",
    description: "Отгружаем в срок по России. Повторные заказы — в 2 клика через личный кабинет.",
    visual: "deliver",
  },
];

const WorkflowSection = () => {
  return (
    <section id="workflow" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start justify-between mb-16 scroll-reveal">
          <div>
            <span className="text-xs font-mono text-primary tracking-wider">КАК ЭТО РАБОТАЕТ</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3 font-bold max-w-md leading-tight">
              От заявки до полки —<br />
              <span className="text-primary">14 дней.</span>
            </h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs hidden md:block mt-2">
            Прозрачный процесс, никаких сюрпризов. Вы видите статус на каждом этапе.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative scroll-reveal card-hover"
              data-delay={String(index * 100)}
            >
              <div className="bg-card border border-border rounded-2xl p-6 h-full">
                <div className="aspect-square bg-secondary/50 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
                  {step.visual === "request" && (
                    <div className="bg-white p-4 rounded-xl shadow-sm rotate-[-2deg] border border-border text-center">
                      <p className="text-[10px] font-mono text-primary mb-1">БРИФ</p>
                      <p className="text-sm font-semibold">"Эспрессо для сети"</p>
                    </div>
                  )}
                  {step.visual === "recipe" && (
                    <div className="space-y-2 w-full px-4">
                      <div className="h-2 bg-primary/20 rounded w-3/4" />
                      <div className="h-2 bg-primary/30 rounded w-full" />
                      <div className="h-2 bg-primary/20 rounded w-2/3" />
                      <div className="flex gap-1 mt-4 items-center">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <div className="flex-1 h-2 bg-border rounded" />
                        <span className="text-[9px] font-mono text-primary">ОБРАЗЕЦ</span>
                      </div>
                    </div>
                  )}
                  {step.visual === "roast" && (
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-2">
                        <Icon name="Flame" size={24} className="text-primary" />
                      </div>
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[10px] font-mono text-muted-foreground">ГОТОВО</span>
                      </div>
                    </div>
                  )}
                  {step.visual === "deliver" && (
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-2">
                        <Icon name="Truck" size={22} className="text-accent" />
                      </div>
                      <span className="text-[10px] font-mono text-accent font-semibold">ОТГРУЖЕН</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-[42%] -right-3 w-6 border-t-2 border-dashed border-primary/30 z-10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
