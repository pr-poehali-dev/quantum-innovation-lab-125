-- 1. Редактируемые секции лендинга (Hero, Workflow, Features, Footer) — гибкое хранилище JSON
CREATE TABLE t_p21475602_quantum_innovation_l.site_sections (
  section_key TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Отзывы клиентов (редактируемые вместо hardcoded массива)
CREATE TABLE t_p21475602_quantum_innovation_l.testimonials (
  id         SERIAL PRIMARY KEY,
  quote      TEXT NOT NULL,
  author     TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Категории документов (владелец создаёт свои)
CREATE TABLE t_p21475602_quantum_innovation_l.document_categories (
  id         SERIAL PRIMARY KEY,
  key        TEXT NOT NULL UNIQUE,
  label      TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT 'Folder',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO t_p21475602_quantum_innovation_l.document_categories (key, label, icon, sort_order) VALUES
  ('legal', 'Юридические', 'Scale', 1),
  ('certificates', 'Сертификаты', 'Award', 2),
  ('company', 'О компании', 'Building2', 3),
  ('other', 'Прочее', 'File', 4);

-- 4. Партии продукта клиента (клиент даёт название, партия объединяет заказы)
CREATE TABLE t_p21475602_quantum_innovation_l.product_batches (
  id         SERIAL PRIMARY KEY,
  client_id  INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.clients(id),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Расширяем deals: привязка к партии + полные параметры заказа (зерно/обжарка/упаковка/вес/дизайн)
ALTER TABLE t_p21475602_quantum_innovation_l.deals
  ADD COLUMN batch_id    INTEGER REFERENCES t_p21475602_quantum_innovation_l.product_batches(id),
  ADD COLUMN origin_id   INTEGER REFERENCES t_p21475602_quantum_innovation_l.calc_origins(id),
  ADD COLUMN roast       TEXT,
  ADD COLUMN packaging   TEXT,
  ADD COLUMN weight_format TEXT,
  ADD COLUMN design      TEXT,
  ADD COLUMN note        TEXT;

-- 6. Макеты дизайна — отдельно от документов, привязаны к партии, клиент/менеджер могут загружать
CREATE TABLE t_p21475602_quantum_innovation_l.batch_mockups (
  id          SERIAL PRIMARY KEY,
  batch_id    INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.product_batches(id),
  file_url    TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  uploaded_by TEXT NOT NULL CHECK (uploaded_by IN ('client', 'staff')),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'archived')),
  comment     TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_batch_mockups_batch ON t_p21475602_quantum_innovation_l.batch_mockups(batch_id);
CREATE INDEX idx_deals_batch ON t_p21475602_quantum_innovation_l.deals(batch_id);
