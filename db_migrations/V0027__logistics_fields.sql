-- 5. Настраиваемые поля логистики (админ добавляет/редактирует)
CREATE TABLE t_p21475602_quantum_innovation_l.logistics_fields (
  id          SERIAL PRIMARY KEY,
  key         TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  field_type  TEXT NOT NULL DEFAULT 'text',
  required    BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE t_p21475602_quantum_innovation_l.logistics_fields
  ADD CONSTRAINT chk_logistics_field_type CHECK (field_type IN ('text', 'textarea', 'phone', 'date'));

INSERT INTO t_p21475602_quantum_innovation_l.logistics_fields (key, label, field_type, required, sort_order) VALUES
  ('city', 'Город доставки', 'text', TRUE, 1),
  ('address', 'Адрес доставки', 'textarea', TRUE, 2),
  ('recipient_name', 'Получатель (ФИО)', 'text', FALSE, 3),
  ('recipient_phone', 'Телефон получателя', 'phone', TRUE, 4),
  ('ship_date', 'Желаемая дата отгрузки', 'date', FALSE, 5),
  ('comment', 'Комментарий к доставке', 'textarea', FALSE, 6);
