-- Services
INSERT INTO services (id, merchant_id, name, price, duration, daily_limit, is_active, sort_order) VALUES
(gen_random_uuid(), 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'xizao', 68.00, 60, 10, true, 1),
(gen_random_uuid(), 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'jingjian', 128.00, 90, 5, true, 2),
(gen_random_uuid(), 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'quchong', 80.00, 30, 20, true, 3),
(gen_random_uuid(), 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'SPA meirong', 198.00, 120, 3, true, 4),
(gen_random_uuid(), 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'jiyang', 88.00, 0, 10, true, 5)
ON CONFLICT DO NOTHING;

-- Customers
INSERT INTO customers (id, merchant_id, pet_name, pet_breed, pet_birthday, phone, notes, tags, total_spent, visit_count, last_visit_at) VALUES
(gen_random_uuid(), 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'Doudou', 'Taidi', '2022-05-15', '13800138001', 'scared of dryer', '["active", "vip"]', 580.00, 3, NOW() - INTERVAL '3 days'),
(gen_random_uuid(), 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'Meiqiu', 'British Shorthair', '2023-02-20', '13800138002', 'shy cat', '["active"]', 320.00, 2, NOW() - INTERVAL '7 days'),
(gen_random_uuid(), 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'Dahuang', 'Golden Retriever', '2021-08-10', '13800138003', 'very good boy', '["vip", "big"]', 1280.00, 8, NOW() - INTERVAL '1 day'),
(gen_random_uuid(), 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'Xiaobai', 'Bichon', '2023-11-05', '13800138004', 'sensitive skin', '["new"]', 0, 0, NULL),
(gen_random_uuid(), 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'Pipi', 'Corgi', '2022-12-25', '13800138005', 'needs diet', '["risk"]', 150.00, 1, NOW() - INTERVAL '45 days')
ON CONFLICT DO NOTHING;
