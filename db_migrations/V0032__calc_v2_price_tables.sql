-- 11. Новые прайс-таблицы калькулятора на основе Google Sheets заказчика
-- Сорта кофе с ценами на зелёное зерно ($/кг) — таблица 1кг
CREATE TABLE t_p21475602_quantum_innovation_l.calc_origins_v2 (
  id                SERIAL PRIMARY KEY,
  label             TEXT NOT NULL,
  price_usd_per_kg  NUMERIC(10,4) NOT NULL,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  active            BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO t_p21475602_quantum_innovation_l.calc_origins_v2 (label, price_usd_per_kg, sort_order) VALUES
  ('Бразилия Сантос', 12.00, 1),
  ('Колумбия Сьюпремо', 10.50, 2),
  ('Лаос Боловен', 6.00, 3),
  ('Робуста Вьетнам', 9.50, 4),
  ('Лаос Паксон', 11.15, 5),
  ('Бленд Бразилия 50% Колумбия 50%', 11.25, 6),
  ('Бленд Лаос 50% Колумбия 50%', 9.44, 7),
  ('Бленд Бразилия 80% Робуста 20%', 8.15, 8),
  ('Бленд Бразилия 50% Робуста 50%', 7.75, 9);

-- Общие параметры калькулятора (общие для 1кг и 250г, в рублях)
CREATE TABLE t_p21475602_quantum_innovation_l.calc_params_v2 (
  key    TEXT PRIMARY KEY,
  value  NUMERIC(10,4) NOT NULL,
  label  TEXT NOT NULL DEFAULT ''
);

INSERT INTO t_p21475602_quantum_innovation_l.calc_params_v2 (key, value, label) VALUES
  ('roast_loss_percent', 15, 'Потеря веса при обжарке, %'),
  ('pkg_1kg', 50, 'Упаковка 1 кг, ₽'),
  ('transport_1kg', 15, 'Транспорт 1 кг, ₽'),
  ('production_1kg', 10, 'Производство 1 кг, ₽'),
  ('roasting_service_1kg', 100, 'Услуги обжарки и упаковки 1 кг, ₽'),
  ('pkg_250g', 40, 'Упаковка 250 г, ₽'),
  ('transport_250g', 3.15, 'Транспорт 250 г, ₽'),
  ('production_250g', 2.49, 'Производство 250 г, ₽'),
  ('roasting_service_250g', 30, 'Услуги обжарки и упаковки 250 г, ₽');
