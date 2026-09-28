-- 1. Проценты готовности на этапах канбана (админ настраивает сам)
ALTER TABLE t_p21475602_quantum_innovation_l.deal_stages
  ADD COLUMN progress_percent INTEGER NULL;

-- Разумные дефолты по порядку этапов (первый = NULL, "не начато")
UPDATE t_p21475602_quantum_innovation_l.deal_stages ds
SET progress_percent = CASE
  WHEN ds.sort_order = (SELECT MIN(sort_order) FROM t_p21475602_quantum_innovation_l.deal_stages) THEN NULL
  ELSE LEAST(100, ROUND(
    (ds.sort_order - 1)::numeric /
    NULLIF((SELECT MAX(sort_order) FROM t_p21475602_quantum_innovation_l.deal_stages) - 1, 0) * 100
  ))
END;
