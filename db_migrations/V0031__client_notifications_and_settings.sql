-- 9. Уведомления клиента (смена этапа партии, новые сообщения)
CREATE TABLE t_p21475602_quantum_innovation_l.client_notifications (
  id          SERIAL PRIMARY KEY,
  client_id   INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.clients(id),
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  deal_id     INTEGER NULL REFERENCES t_p21475602_quantum_innovation_l.deals(id),
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE t_p21475602_quantum_innovation_l.client_notifications
  ADD CONSTRAINT chk_notif_type CHECK (type IN ('stage_change', 'message'));
CREATE INDEX idx_client_notifications_client ON t_p21475602_quantum_innovation_l.client_notifications(client_id, is_read);

-- 10. Настройки email-отправителя и параметров калькулятора
INSERT INTO t_p21475602_quantum_innovation_l.site_settings (key, value) VALUES
  ('email_sender_name', 'КонтрактКофе'),
  ('email_sender_email', 'marketing1@aromateacoffee.ru'),
  ('calc_min_volume', '500'),
  ('calc_volume_step', '5')
ON CONFLICT (key) DO NOTHING;
