UPDATE t_p21475602_quantum_innovation_l.client_sessions
SET expires_at = NOW() + INTERVAL '2 hours'
WHERE token = 'diag_client_e2e_token_temp_67890';