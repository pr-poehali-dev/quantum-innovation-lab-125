CREATE TABLE t_p21475602_quantum_innovation_l.documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_kb INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Дефолтные документы
INSERT INTO t_p21475602_quantum_innovation_l.documents
  (title, description, category, file_url, file_name, file_size_kb, sort_order)
VALUES
  ('Политика конфиденциальности', 'Правила обработки персональных данных', 'legal', '#', 'privacy_policy.pdf', 0, 0),
  ('Условия сотрудничества', 'Стандартный договор на производство СТМ', 'legal', '#', 'terms.pdf', 0, 1),
  ('Сертификат качества ISO', 'Сертификат соответствия производства', 'certificates', '#', 'iso_certificate.pdf', 0, 2),
  ('Декларация соответствия', 'Декларация соответствия продукции', 'certificates', '#', 'declaration.pdf', 0, 3),
  ('Реквизиты компании', 'Банковские реквизиты для договора', 'company', '#', 'requisites.pdf', 0, 4);
