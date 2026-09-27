INSERT INTO t_p21475602_quantum_innovation_l.client_sessions (email, token, expires_at)
VALUES ('test@test.ru', 'diag_client_e2e_token_temp_67890', NOW() + INTERVAL '1 hour')
ON CONFLICT DO NOTHING;