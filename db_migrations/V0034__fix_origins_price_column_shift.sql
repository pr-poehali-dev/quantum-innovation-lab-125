-- Исправление: цены сортов были сдвинуты на одну колонку при первом переносе из Google Sheets.
-- Проверено перекрёстно по обжаренным ценам (лист 250г): значение*4 = обжаренная цена 1кг из листа 1.
UPDATE t_p21475602_quantum_innovation_l.calc_origins_v2 SET price_usd_per_kg = 10.30 WHERE label = 'Бразилия Сантос';
UPDATE t_p21475602_quantum_innovation_l.calc_origins_v2 SET price_usd_per_kg = 12.00 WHERE label = 'Колумбия Сьюпремо';
UPDATE t_p21475602_quantum_innovation_l.calc_origins_v2 SET price_usd_per_kg = 10.50 WHERE label = 'Лаос Боловен';
UPDATE t_p21475602_quantum_innovation_l.calc_origins_v2 SET price_usd_per_kg = 6.00  WHERE label = 'Робуста Вьетнам';
UPDATE t_p21475602_quantum_innovation_l.calc_origins_v2 SET price_usd_per_kg = 9.50  WHERE label = 'Лаос Паксон';
UPDATE t_p21475602_quantum_innovation_l.calc_origins_v2 SET price_usd_per_kg = 11.15 WHERE label = 'Бленд Бразилия 50% Колумбия 50%';
UPDATE t_p21475602_quantum_innovation_l.calc_origins_v2 SET price_usd_per_kg = 11.25 WHERE label = 'Бленд Лаос 50% Колумбия 50%';
UPDATE t_p21475602_quantum_innovation_l.calc_origins_v2 SET price_usd_per_kg = 9.44  WHERE label = 'Бленд Бразилия 80% Робуста 20%';
UPDATE t_p21475602_quantum_innovation_l.calc_origins_v2 SET price_usd_per_kg = 8.15  WHERE label = 'Бленд Бразилия 50% Робуста 50%';
UPDATE t_p21475602_quantum_innovation_l.calc_origins_v2 SET price_usd_per_kg = 7.75  WHERE label = 'Бленд Лаос 50% Робуста 50%';
