-- Тестовый клиент для проверки личного кабинета
INSERT INTO t_p21475602_quantum_innovation_l.clients (name, phone, email, city, company)
VALUES ('Иван Тестов', '+79991234567', 'test-client@kontraktkafe.ru', 'Москва', 'ООО Тестовая кофейня')
RETURNING id;
