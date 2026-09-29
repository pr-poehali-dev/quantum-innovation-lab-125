INSERT INTO t_p21475602_quantum_innovation_l.site_sections (section_key, data, updated_at)
VALUES ('cta', '{"eyebrow": "ГОТОВЫ К СТАРТУ?", "title_line1": "Запустите свой бренд кофе", "title_line2": "уже через 14 дней.", "subtitle": "Присоединяйтесь к 500+ компаниям, которые продают кофе под своей маркой."}', NOW())
ON CONFLICT (section_key) DO NOTHING;