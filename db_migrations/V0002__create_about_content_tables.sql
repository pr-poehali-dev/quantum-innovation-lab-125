CREATE TABLE t_p21475602_quantum_innovation_l.about_content (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Производство, которому доверяют',
  subtitle TEXT NOT NULL DEFAULT 'Полный цикл — от подбора зелёного зерна до отгрузки готовой продукции с вашим логотипом.',
  bottom_text TEXT NOT NULL DEFAULT 'Работаем с кофейнями, ресторанами, отелями, вендинговыми сетями и ретейлом по всей России. Первая партия — за 14 дней. Повторные заказы — через личный кабинет в 1 клик.',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p21475602_quantum_innovation_l.about_photos (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Дефолтный контент
INSERT INTO t_p21475602_quantum_innovation_l.about_content (title, subtitle, bottom_text)
VALUES (
  'Производство, которому доверяют',
  'Полный цикл — от подбора зелёного зерна до отгрузки готовой продукции с вашим логотипом.',
  'Работаем с кофейнями, ресторанами, отелями, вендинговыми сетями и ретейлом по всей России. Первая партия — за 14 дней. Повторные заказы — через личный кабинет в 1 клик.'
);

-- Дефолтные фото (стоковые, пока клиент не загрузит свои)
INSERT INTO t_p21475602_quantum_innovation_l.about_photos (url, label, description, sort_order) VALUES
('https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80', 'Обжарочный цех', 'Профессиональные обжарочные барабаны', 0),
('https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80', 'Зелёное зерно', 'Контроль качества сырья на входе', 1),
('https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=800&q=80', 'Фасовка', 'Автоматическая линия упаковки', 2),
('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80', 'Готовая продукция', 'Упаковка под брендами клиентов', 3),
('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80', 'Дегустация', 'Контроль вкусового профиля', 4),
('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80', 'Разработка рецептур', 'Подбор купажа под клиента', 5);
