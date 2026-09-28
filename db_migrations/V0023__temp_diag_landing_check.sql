INSERT INTO t_p21475602_quantum_innovation_l.staff_sessions (staff_id, token, expires_at)
VALUES (1, 'diag_landing_check_token', NOW() + INTERVAL '1 hour')
ON CONFLICT DO NOTHING;