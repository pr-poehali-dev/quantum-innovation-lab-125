-- 2. Лоты внутри заказа (позиции с зерном/весом/объёмом)
CREATE TABLE t_p21475602_quantum_innovation_l.deal_lots (
  id            SERIAL PRIMARY KEY,
  deal_id       INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.deals(id),
  lot_number    INTEGER NOT NULL,
  origin_id     INTEGER NULL REFERENCES t_p21475602_quantum_innovation_l.calc_origins(id),
  roast         TEXT NULL,
  packaging     TEXT NULL,
  weight_format TEXT NULL,
  color         TEXT NULL,
  volume        NUMERIC NULL,
  amount        NUMERIC NULL,
  note          TEXT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_deal_lots_deal ON t_p21475602_quantum_innovation_l.deal_lots(deal_id);

-- 3. Перенос существующих заказов в лоты (лот №1), чтобы не потерять данные
INSERT INTO t_p21475602_quantum_innovation_l.deal_lots
  (deal_id, lot_number, origin_id, roast, packaging, weight_format, volume, amount, note)
SELECT id, 1, origin_id, roast, packaging, weight_format,
       volume, amount,
       TRIM(BOTH ' ' FROM CONCAT(COALESCE(note, ''), CASE WHEN design IS NOT NULL AND design != '' THEN ' (дизайн: ' || design || ')' ELSE '' END))
FROM t_p21475602_quantum_innovation_l.deals
WHERE origin_id IS NOT NULL OR volume IS NOT NULL OR amount IS NOT NULL;
