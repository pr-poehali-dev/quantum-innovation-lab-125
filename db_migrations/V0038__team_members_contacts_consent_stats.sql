CREATE TABLE t_p21475602_quantum_innovation_l.team_members (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES t_p21475602_quantum_innovation_l.staff_users(id),
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  position TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  show_on_site BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_team_members_staff ON t_p21475602_quantum_innovation_l.team_members(staff_id) WHERE staff_id IS NOT NULL;

INSERT INTO t_p21475602_quantum_innovation_l.site_pages (slug, title, content, icon, sort_order, show_in_footer, is_published)
SELECT 'user-agreement', 'Пользовательское соглашение', 'Текст пользовательского соглашения. Отредактируйте эту страницу в админке.', 'FileText', 5, true, true
WHERE NOT EXISTS (SELECT 1 FROM t_p21475602_quantum_innovation_l.site_pages WHERE slug='user-agreement');

INSERT INTO t_p21475602_quantum_innovation_l.site_sections (section_key, data) VALUES
('contacts', '{"phone": "+7 904 247-43-02", "phone_note": "Звонки и Telegram", "email": "gid150@mail.ru", "telegram": "https://t.me/kontraktkafe", "whatsapp": "", "vk": "", "max": "", "address": "", "work_hours": "Пн–Пт, 9:00–18:00"}'::jsonb),
('consent', '{"enabled": true, "prefix": "Я принимаю", "links": [{"label": "пользовательское соглашение", "slug": "user-agreement"}, {"label": "политику конфиденциальности", "slug": "privacy-policy"}], "suffix": "и даю согласие на обработку персональных данных"}'::jsonb),
('about_stats', '{"eyebrow": "О КОМПАНИИ", "status_label": "ПРОИЗВОДСТВО РАБОТАЕТ", "button_label": "Рассчитать", "stats": [{"val": "500+", "label": "брендов под СТМ"}, {"val": "7 лет", "label": "на рынке"}, {"val": "500 кг", "label": "минимальный заказ"}, {"val": "7 дн.", "label": "до первой партии"}]}'::jsonb),
('team', '{"enabled": true, "eyebrow": "КОМАНДА", "title": "Люди, которые ведут ваш заказ", "subtitle": "Свяжитесь с нами удобным способом"}'::jsonb)
ON CONFLICT (section_key) DO NOTHING;

UPDATE t_p21475602_quantum_innovation_l.site_sections
SET data = data || '{"eyebrow": "О ПРОИЗВОДСТВЕ", "title_line1": "Почему выбирают", "title_line2": "КонтрактКофе", "segments_label": "РАБОТАЕМ С", "stats": [{"val": "500+", "label": "брендов создано", "icon": "Award"}, {"val": "7 дн", "label": "до первой партии", "icon": "Clock"}, {"val": "500 кг", "label": "минимальный заказ", "icon": "Package"}]}'::jsonb
WHERE section_key='features';