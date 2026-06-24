-- Сорта зерна для калькулятора
CREATE TABLE t_p21475602_quantum_innovation_l.calc_origins (
  id         SERIAL PRIMARY KEY,
  label      TEXT    NOT NULL,
  desc_text  TEXT    NOT NULL DEFAULT '',
  price_usd  NUMERIC(10,4) NOT NULL,
  sort_order INT     NOT NULL DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO t_p21475602_quantum_innovation_l.calc_origins (label, desc_text, price_usd, sort_order) VALUES
  ('Бразилия',                    'классика, карамель',  11.46,  1),
  ('Колумбия',                    'карамель, цитрус',    13.47,  2),
  ('Лаос',                        'мягкий, орех',        12.00,  3),
  ('Робуста',                     'крепкий, горький, крема', 7.42, 4),
  ('Бленд Бразилия50/Колумбия50', '',                    12.465, 5),
  ('Бленд Лаос50/Колумбия50',     '',                    12.735, 6),
  ('Бленд Бразилия80/Робуста20',  '',                    10.652, 7),
  ('Бленд Бразилия50/Робуста50',  '',                    9.44,   8);

-- Параметры расчёта (фасовки 1кг и 250г)
CREATE TABLE t_p21475602_quantum_innovation_l.calc_params (
  key        TEXT PRIMARY KEY,
  value      NUMERIC(10,4) NOT NULL,
  label      TEXT NOT NULL DEFAULT ''
);

INSERT INTO t_p21475602_quantum_innovation_l.calc_params (key, value, label) VALUES
  ('pkg_1kg',      58.5,  'Упаковка 1 кг, ₽'),
  ('transport_1kg', 12.61, 'Транспорт 1 кг, ₽'),
  ('production_1kg', 9.95, 'Производство 1 кг, ₽'),
  ('roasting_1kg', 120.0, 'Обжарка 1 кг, ₽'),
  ('weight_loss',   0.15,  'Потеря веса при обжарке, доли'),
  ('pkg_250g',      47.0,  'Упаковка 250 г, ₽'),
  ('transport_250g', 3.15, 'Транспорт 250 г, ₽'),
  ('production_250g', 2.49, 'Производство 250 г, ₽'),
  ('roasting_250g', 40.0, 'Обжарка 250 г, ₽');
