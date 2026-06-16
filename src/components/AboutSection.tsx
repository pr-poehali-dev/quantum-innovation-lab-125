import { useState } from "react";
import Icon from "@/components/ui/icon";

// Реальные фото производства (используем доступные URL проекта)
const PHOTOS = [
  {
    url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80",
    label: "Обжарочный цех",
    desc: "Профессиональные обжарочные барабаны",
  },
  {
    url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80",
    label: "Зелёное зерно",
    desc: "Контроль качества сырья на входе",
  },
  {
    url: "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=800&q=80",
    label: "Фасовка",
    desc: "Автоматическая линия упаковки",
  },
  {
    url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    label: "Готовая продукция",
    desc: "Упаковка под брендами клиентов",
  },
  {
    url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
    label: "Дегустация",
    desc: "Контроль вкусового профиля",
  },
  {
    url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80",
    label: "Разработка рецептур",
    desc: "Подбор купажа под клиента",
  },
];

const STATS = [
  { val: "500+",   label: "брендов под СТМ" },
  { val: "7 лет",  label: "на рынке"         },
  { val: "50 кг",  label: "минимальный заказ" },
  { val: "14 дн.", label: "срок первой партии"},
];

const AboutSection = () => {
  const [activePhoto, setActivePhoto] = useState(0);

  return (
    <section id="about" className="py-24 bg-foreground text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">

        {/* Заголовок */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <span className="text-[11px] font-mono text-white/40 tracking-widest">О КОМПАНИИ</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mt-3 leading-tight">
              Производство,<br />
              <span className="text-white/60">которому доверяют</span>
            </h2>
          </div>
          <p className="text-sm text-white/50 max-w-xs leading-relaxed md:text-right">
            Полный цикл — от подбора зелёного зерна до отгрузки готовой продукции с вашим логотипом.
          </p>
        </div>

        {/* Основной блок — асимметричная верстка */}
        <div className="grid lg:grid-cols-5 gap-4 mb-6">

          {/* Большое фото */}
          <div className="lg:col-span-3 relative rounded-2xl overflow-hidden"
            style={{ minHeight: 420 }}>
            <img
              src={PHOTOS[activePhoto].url}
              alt={PHOTOS[activePhoto].label}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-[10px] font-mono text-white/50 tracking-widest mb-1">
                {String(activePhoto + 1).padStart(2, "0")} / {String(PHOTOS.length).padStart(2, "0")}
              </p>
              <p className="font-semibold text-white text-lg">{PHOTOS[activePhoto].label}</p>
              <p className="text-sm text-white/60 mt-0.5">{PHOTOS[activePhoto].desc}</p>
            </div>
          </div>

          {/* Правая колонка — мини-фото + статистика */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Сетка миниатюр */}
            <div className="grid grid-cols-3 gap-2">
              {PHOTOS.map((p, i) => (
                <button key={i} onClick={() => setActivePhoto(i)}
                  className={`relative rounded-xl overflow-hidden aspect-square transition-all duration-300 ${
                    activePhoto === i
                      ? "ring-2 ring-white ring-offset-2 ring-offset-foreground scale-95"
                      : "opacity-50 hover:opacity-80"
                  }`}>
                  <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 gap-3 flex-1">
              {STATS.map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                  <p className="font-serif text-3xl font-bold text-white">{s.val}</p>
                  <p className="text-[11px] text-white/50 font-mono mt-1 leading-relaxed">{s.label.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Нижняя лента — текст */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] font-mono text-white/50">ПРОИЗВОДСТВО РАБОТАЕТ</span>
          </div>
          <p className="text-sm text-white/50 leading-relaxed max-w-xl">
            Работаем с кофейнями, ресторанами, отелями, вендинговыми сетями и ретейлом по всей России.
            Первая партия — за 14 дней. Повторные заказы — через личный кабинет в 1 клик.
          </p>
          <a href="#calculator"
            className="ml-auto flex-shrink-0 inline-flex items-center gap-2 bg-white text-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-white/90 transition-all">
            <Icon name="Calculator" size={14} />
            Рассчитать
          </a>
        </div>

      </div>
    </section>
  );
};

export default AboutSection;
