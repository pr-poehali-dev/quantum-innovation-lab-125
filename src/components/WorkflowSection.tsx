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
    <section className="py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start justify-between mb-16">
          <div>
            <span className="text-xs font-mono text-muted-foreground tracking-wider">КАК ЭТО РАБОТАЕТ</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-4 max-w-md leading-tight">
              От заявки до полки — 14 дней.
            </h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs hidden md:block">
            Прозрачный процесс, никаких сюрпризов. Вы видите статус на каждом этапе.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <div className="bg-card border border-border rounded-2xl p-6 h-full">
                {/* Visual placeholder */}
                <div className="aspect-square bg-secondary/50 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
                  {step.visual === "request" && (
                    <div className="bg-[#fffef0] p-4 rounded shadow-sm rotate-[-2deg] border border-amber-100 text-center">
                      <p className="text-xs font-mono text-muted-foreground">БРИФ</p>
                      <p className="text-sm font-serif italic mt-1">"Эспрессо для сети кофеен"</p>
                    </div>
                  )}
                  {step.visual === "recipe" && (
                    <div className="space-y-2 w-full px-4">
                      <div className="h-2 bg-amber-200 rounded w-3/4" />
                      <div className="h-2 bg-amber-300 rounded w-full" />
                      <div className="h-2 bg-amber-200 rounded w-2/3" />
                      <div className="flex gap-1 mt-4 items-center">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <div className="flex-1 h-3 bg-border rounded" />
                        <span className="text-[9px] font-mono text-muted-foreground">ОБРАЗЕЦ</span>
                      </div>
                    </div>
                  )}
                  {step.visual === "roast" && (
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-[#3d2a1e] flex items-center justify-center mx-auto mb-2">
                        <Icon name="Flame" size={24} className="text-amber-400" />
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[10px] font-mono text-muted-foreground">ГОТОВ</span>
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                    </div>
                  )}
                  {step.visual === "deliver" && (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 border border-primary/20">
                        <Icon name="Truck" size={16} className="text-primary" />
                        <span className="text-xs font-mono text-primary">ОТГРУЖЕН</span>
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
