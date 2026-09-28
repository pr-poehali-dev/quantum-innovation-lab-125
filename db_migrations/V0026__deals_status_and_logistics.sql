-- 4. Заказ (deal) теперь может быть черновиком до отправки на согласование
ALTER TABLE t_p21475602_quantum_innovation_l.deals
  ADD COLUMN status TEXT NOT NULL DEFAULT 'submitted',
  ADD COLUMN logistics_data JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE t_p21475602_quantum_innovation_l.deals
  ADD CONSTRAINT chk_deals_status CHECK (status IN ('draft', 'submitted'));
