UPDATE t_p21475602_quantum_innovation_l.site_settings
SET value = (value::jsonb || '{"2": "Светлая"}'::jsonb)::text, updated_at = NOW()
WHERE key = 'calc_recommended_roast';