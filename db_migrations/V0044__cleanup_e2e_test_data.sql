UPDATE t_p21475602_quantum_innovation_l.clients SET phone='79922191308' WHERE id=2;
UPDATE t_p21475602_quantum_innovation_l.deals SET trashed_at=NOW(), trashed_by='тест' WHERE id IN (58, 59) AND trashed_at IS NULL;
UPDATE t_p21475602_quantum_innovation_l.deal_documents SET status='removed' WHERE deal_id IN (58, 59);