ALTER TABLE t_p21475602_quantum_innovation_l.staff_invites
  ADD COLUMN role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('owner', 'manager', 'support'));