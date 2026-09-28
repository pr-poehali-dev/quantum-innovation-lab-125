-- 8. Публичные редактируемые страницы (заменяют документы в футере)
CREATE TABLE t_p21475602_quantum_innovation_l.site_pages (
  id              SERIAL PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  content         TEXT NOT NULL DEFAULT '',
  icon            TEXT NOT NULL DEFAULT 'FileText',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  show_in_footer  BOOLEAN NOT NULL DEFAULT TRUE,
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p21475602_quantum_innovation_l.site_page_files (
  id          SERIAL PRIMARY KEY,
  page_id     INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.site_pages(id),
  file_url    TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

INSERT INTO t_p21475602_quantum_innovation_l.site_pages (slug, title, content, icon, sort_order) VALUES
  ('privacy-policy', 'Политика конфиденциальности', 'Текст политики конфиденциальности. Отредактируйте эту страницу в админке.', 'Scale', 1),
  ('terms', 'Условия сотрудничества', 'Стандартные условия договора на производство СТМ. Отредактируйте эту страницу в админке.', 'FileSignature', 2),
  ('certificates', 'Сертификаты', 'Сертификаты качества производства. Прикрепите файлы в админке.', 'Award', 3),
  ('requisites', 'Реквизиты', 'Банковские реквизиты компании. Отредактируйте эту страницу в админке.', 'Building2', 4);

INSERT INTO t_p21475602_quantum_innovation_l.site_page_files (page_id, file_url, file_name)
SELECT (SELECT id FROM t_p21475602_quantum_innovation_l.site_pages WHERE slug = 'certificates'), file_url, file_name
FROM t_p21475602_quantum_innovation_l.documents WHERE category = 'certificates' AND client_id IS NULL;
