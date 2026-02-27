-- Appointments (today's appointments)
-- Services: xizao=27fcebad-a709-4f5a-a331-68fa942cce8c, jingjian=9e6c0adb-d0fc-4fa3-a54e-377be6e979ce, SPA=2d87fe22-9718-4e29-a5e1-4a5be148b561
-- Customers: Doudou=3fc76618-115d-4ab3-b4da-148b29c8cb26, Meiqiu=f45a2fee-ecc1-4b8c-b2df-672aee11a0cd, Dahuang=f4ec6b4b-2a48-476e-914f-03ec9af1aff8, Xiaobai=52186728-c5d6-4806-a017-cddde60ef756

INSERT INTO appointments (id, merchant_id, customer_id, service_id, appointment_time, status, notes, reminder_sent) VALUES
-- Pending (3)
(gen_random_uuid(), 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', '3fc76618-115d-4ab3-b4da-148b29c8cb26', '27fcebad-a709-4f5a-a331-68fa942cce8c', NOW() + INTERVAL '1 hour', 'pending', 'scared of dryer', false),
(gen_random_uuid(), 'b5fbfec-0d4c-4bd3-ac43-01cf9205e56c', 'f45a2fee-ecc1-4b8c-b2df-672aee11a0cd', '9e6c0adb-d0fc-4fa3-a54e-377be6e979ce', NOW() + INTERVAL '3 hours', 'pending', '', false),
(gen_random_uuid(), 'b5fbfec-0d4c-4bd3-ac43-01cf9205e56c', 'f4ec6b4b-2a48-476e-914f-03ec9af1aff8', '2d87fe22-9718-4e29-a5e1-4a5be148b561', NOW() + INTERVAL '5 hours', 'pending', 'premium shampoo', false),
-- Confirmed (1)
(gen_random_uuid(), 'b5fbfec-0d4c-4bd3-ac43-01cf9205e56c', '52186728-c5d6-4806-a017-cddde60ef756', '27fcebad-a709-4f5a-a331-68fa942cce8c', NOW() + INTERVAL '2 hours', 'confirmed', '', false),
-- Completed (1)
(gen_random_uuid(), 'b5fbfec-0d4c-4bd3-ac43-01cf9205e56c', 'd849f962-d94d-4d1a-816f-41bff46e250c', 'c42e8e66-bc43-4d84-ac3c-7d2e26c6eedd', NOW() - INTERVAL '2 hours', 'completed', '', true);

-- Transactions
INSERT INTO transactions (id, merchant_id, customer_id, items, total_amount, payment_method, status) VALUES
(gen_random_uuid(), 'b5fbfec-0d4c-4bd3-ac43-01cf9205e56c', '3fc76618-115d-4ab3-b4da-148b29c8cb26', '[{"name":"xizao","price":68,"quantity":1}]', 68.00, 'wechat', 'completed'),
(gen_random_uuid(), 'b5fbfec-0d4c-4bd3-ac43-01cf9205e56c', 'f45a2fee-ecc1-4b8c-b2df-672aee11a0cd', '[{"name":"xizao","price":68,"quantity":1},{"name":"quchong","price":80,"quantity":1}]', 148.00, 'cash', 'completed'),
(gen_random_uuid(), 'b5fbfec-0d4c-4bd3-ac43-01cf9205e56c', 'f4ec6b4b-2a48-476e-914f-03ec9af1aff8', '[{"name":"SPA meirong","price":198,"quantity":1}]', 198.00, 'wechat', 'completed');
