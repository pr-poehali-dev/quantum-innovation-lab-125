ALTER TABLE t_p21475602_quantum_innovation_l.staff_users DROP CONSTRAINT IF EXISTS staff_users_role_check;
ALTER TABLE t_p21475602_quantum_innovation_l.staff_users ADD CONSTRAINT staff_users_role_check CHECK (role IN ('owner', 'super_admin', 'manager', 'support'));

ALTER TABLE t_p21475602_quantum_innovation_l.staff_sessions DROP CONSTRAINT IF EXISTS staff_sessions_preview_role_check;
ALTER TABLE t_p21475602_quantum_innovation_l.staff_sessions ADD CONSTRAINT staff_sessions_preview_role_check CHECK (preview_role IN ('manager', 'support'));

ALTER TABLE t_p21475602_quantum_innovation_l.staff_invites DROP CONSTRAINT IF EXISTS staff_invites_role_check;
ALTER TABLE t_p21475602_quantum_innovation_l.staff_invites ADD CONSTRAINT staff_invites_role_check CHECK (role IN ('super_admin', 'manager', 'support'));