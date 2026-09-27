UPDATE t_p21475602_quantum_innovation_l.staff_sessions
SET expires_at = NOW() + INTERVAL '2 hours'
WHERE token = 'diag_e2e_screenshot_token_temp_12345';