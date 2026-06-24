CREATE TABLE t_p21475602_quantum_innovation_l.site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p21475602_quantum_innovation_l.site_settings (key, value)
VALUES ('usd_rate', '85.00')
ON CONFLICT (key) DO NOTHING;
