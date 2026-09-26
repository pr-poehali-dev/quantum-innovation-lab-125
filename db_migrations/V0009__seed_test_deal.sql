-- Тестовая сделка для проверки личного кабинета клиента
INSERT INTO t_p21475602_quantum_innovation_l.deals (client_id, brand, volume, amount, stage_id)
VALUES (2, 'NORD ROAST', 200, 97400, 4)
RETURNING id;
