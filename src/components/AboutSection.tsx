import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";

const STATS = [
  { val: "500+",   label: "брендов под СТМ"  },
  { val: "7 лет",  label: "на рынке"          },
  { val: "50 кг",  label: "минимальный заказ" },
  { val: "14 дн.", label: "до первой партии"  },
];

interface Photo   { id: number; url: string; label: string; description: string; sort_order: number }
interface Content { title: string; subtitle: string; bottom_text: string }

const DEFAULT_CONTENT: Content = {
  title:       "Производство, которому доверяют",
  subtitle:    "Полный цикл — от подбора зелёного зерна до отгрузки готовой продукции с вашим логотипом.",
  bottom_text: "Работаем с кофейнями, ресторанами, отелями, вендинговыми сетями и ретейлом по всей России. Первая партия — за 14 дней. Повторные заказы — через личный кабинет в 1 клик.",
};

const DEFAULT_PHOTOS: Photo[] = [
  { id: 1, url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80", label: "Обжарочный цех",    description: "Профессиональные обжарочные барабаны", sort_order: 0 },
  { id: 2, url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80",    label: "Зелёное зерно",    description: "Контроль качества сырья на входе",    sort_order: 1 },
  { id: 3, url: "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=800&q=80", label: "Фасовка",          description: "Автоматическая линия упаковки",        sort_order: 2 },
  { id: 4, url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80", label: "Готовая продукция", description: "Упаковка под брендами клиентов",      sort_order: 3 },
  { id: 5, url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80", label: "Дегустация",       description: "Контроль вкусового профиля",          sort_order: 4 },
  { id: 6, url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80", label: "Разработка рецептур", description: "Подбор купажа под клиента",        sort_order: 5 },
];

const AboutSection = () => {
  const [activePhoto, setActivePhoto] = useState(0);
  const [content,     setContent]     = useState<Content>(DEFAULT_CONTENT);
  const [photos,      setPhotos]      = useState<Photo[]>(DEFAULT_PHOTOS);

  useEffect(() => {
    fetch(ABOUT_URL)
      .then(r => r.json())
      .then(data => {
        if (data.content?.title) setContent(data.content);
        if (data.photos?.length)  setPhotos(data.photos);
      })
      .catch(() => {/* используем defaults */});
  }, []);

  const photo = photos[activePhoto] ?? photos[0];

  return (
    <section id="about" className="py-24 bg-foreground text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">

        {/* Заголовок */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <span className="text-[11px] font-mono text-white/40 tracking-widest">О КОМПАНИИ</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mt-3 leading-tight">
              {content.title.split(",")[0]},<br />
              <span className="text-white/60">{content.title.split(",").slice(1).join(",").trim()}</span>
            </h2>
          </div>
          <p className="text-sm text-white/50 max-w-xs leading-relaxed md:text-right">
            {content.subtitle}
          </p>
        </div>

        {/* Асимметричная галерея */}
        <div className="grid lg:grid-cols-5 gap-4 mb-6">

          {/* Большое фото */}
          <div className="lg:col-span-3 relative rounded-2xl overflow-hidden" style={{ minHeight: 420 }}>
            <img
              key={photo.url}
              src={photo.url}
              alt={photo.label}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-[10px] font-mono text-white/50 tracking-widest mb-1">
                {String(activePhoto + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
              </p>
              <p className="font-semibold text-white text-lg">{photo.label}</p>
              <p className="text-sm text-white/60 mt-0.5">{photo.description}</p>
            </div>
          </div>

          {/* Правая колонка */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Миниатюры */}
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <button key={p.id} onClick={() => setActivePhoto(i)}
                  className={`relative rounded-xl overflow-hidden aspect-square transition-all duration-300 ${
                    activePhoto === i
                      ? "ring-2 ring-white ring-offset-2 ring-offset-foreground scale-95"
                      : "opacity-40 hover:opacity-70"
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
                  <p className="text-[11px] text-white/50 font-mono mt-1">{s.label.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Нижняя лента */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] font-mono text-white/50">ПРОИЗВОДСТВО РАБОТАЕТ</span>
          </div>
          <p className="text-sm text-white/50 leading-relaxed max-w-xl">{content.bottom_text}</p>
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
