-- Роли сотрудников: owner (владелец, есть уже is_owner), manager (обычный менеджер), support (поддержка 24/7 — первичная обработка чатов)
ALTER TABLE t_p21475602_quantum_innovation_l.staff_users
  ADD COLUMN role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('owner', 'manager', 'support'));

UPDATE t_p21475602_quantum_innovation_l.staff_users SET role = 'owner' WHERE is_owner = TRUE;

-- Закрепление сотрудника за сделкой (ответственный менеджер)
ALTER TABLE t_p21475602_quantum_innovation_l.deals
  ADD COLUMN assigned_to INTEGER REFERENCES t_p21475602_quantum_innovation_l.staff_users(id);

-- Сообщения чата между клиентом и сотрудниками.
-- Привязаны к клиенту (единый диалог), опционально к конкретной сделке.
-- channel зарезервирован под будущие каналы (telegram, whatsapp, vk и т.д.) — пока всегда 'cabinet'.
CREATE TABLE t_p21475602_quantum_innovation_l.messages (
  id          SERIAL PRIMARY KEY,
  client_id   INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.clients(id),
  deal_id     INTEGER REFERENCES t_p21475602_quantum_innovation_l.deals(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'staff')),
  staff_id    INTEGER REFERENCES t_p21475602_quantum_innovation_l.staff_users(id),
  body        TEXT NOT NULL,
  channel     TEXT NOT NULL DEFAULT 'cabinet',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at     TIMESTAMPTZ
);

CREATE INDEX idx_messages_client_created ON t_p21475602_quantum_innovation_l.messages (client_id, created_at);
