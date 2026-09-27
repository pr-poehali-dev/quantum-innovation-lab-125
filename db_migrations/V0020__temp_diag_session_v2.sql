INSERT INTO t_p21475602_quantum_innovation_l.staff_sessions (staff_id, token, expires_at)
VALUES (1, 'diag_e2e_v2_owner_token', NOW() + INTERVAL '2 hours')
ON CONFLICT DO NOTHING;