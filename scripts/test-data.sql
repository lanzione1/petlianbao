-- 宠联宝测试数据

-- 1. 商家数据 (已存在，通过登录创建)
-- 查看商家
SELECT * FROM merchants;

-- 2. 服务项目
INSERT INTO services (id, merchant_id, name, price, duration, daily_limit, is_active, sort_order, created_at) VALUES
('svc001', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', '洗澡', 68.00, 60, 10, true, 1, NOW()),
('svc002', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', '精剪', 128.00, 90, 5, true, 2, NOW()),
('svc003', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', '驱虫', 80.00, 30, 20, true, 3, NOW()),
('svc004', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'SPA美容', 198.00, 120, 3, true, 4, NOW()),
('svc005', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', '寄养(天)', 88.00, 0, 10, true, 5, NOW());

-- 3. 客户数据
INSERT INTO customers (id, merchant_id, pet_name, pet_breed, pet_birthday, phone, notes, tags, total_spent, visit_count, last_visit_at, created_at) VALUES
('cust001', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', '豆豆', '泰迪', '2022-05-15', '13800138001', '狗狗怕吹风机', '["活跃", "高价值"]', 580.00, 3, NOW() - INTERVAL '3 days', NOW() - INTERVAL '30 days'),
('cust002', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', '煤球', '英短蓝猫', '2023-02-20', '13800138002', '胆子小', '["活跃"]', 320.00, 2, NOW() - INTERVAL '7 days', NOW() - INTERVAL '20 days'),
('cust003', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', '大黄', '金毛', '2021-08-10', '13800138003', '很乖', '["高价值", "大客户"]', 1280.00, 8, NOW() - INTERVAL '1 day', NOW() - INTERVAL '60 days'),
('cust004', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', '小白', '比熊', '2023-11-05', '13800138004', '皮肤敏感', '["新客户"]', 0, 0, NULL, NOW()),
('cust005', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', '皮皮', '柯基', '2022-12-25', '13800138005', '需要减肥', '["流失风险"]', 150.00, 1, NOW() - INTERVAL '45 days', NOW() - INTERVAL '90 days');

-- 4. 预约数据 (今天的预约)
INSERT INTO appointments (id, merchant_id, customer_id, service_id, appointment_time, status, notes, reminder_sent, created_at) VALUES
-- 待服务
('apt001', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'cust001', 'svc001', NOW() + INTERVAL '1 hour', 'pending', '上次说狗狗耳朵有点红', false, NOW()),
('apt002', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'cust002', 'svc002', NOW() + INTERVAL '3 hours', 'pending', '', false, NOW()),
('apt003', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'cust003', 'svc004', NOW() + INTERVAL '5 hours', 'pending', '要求用进口香波', false, NOW()),
-- 已确认
('apt004', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'cust004', 'svc001', NOW() + INTERVAL '2 hours', 'confirmed', '', false, NOW()),
-- 已完成
('apt005', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'cust005', 'svc003', NOW() - INTERVAL '2 hours', 'completed', '', true, NOW() - INTERVAL '1 day'),
-- 昨天的预约
('apt006', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'cust001', 'svc001', NOW() - INTERVAL '1 day', 'completed', '', true, NOW() - INTERVAL '2 days'),
('apt007', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'cust003', 'svc002', NOW() - INTERVAL '1 day', 'completed', '主人很满意', true, NOW() - INTERVAL '2 days');

-- 5. 交易数据
INSERT INTO transactions (id, merchant_id, customer_id, appointment_id, items, total_amount, payment_method, status, created_at) VALUES
('txn001', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'cust005', 'apt005', '[{"name":"驱虫","price":80,"quantity":1}]', 80.00, 'wechat', 'completed', NOW() - INTERVAL '2 hours'),
('txn002', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'cust001', 'apt006', '[{"name":"洗澡","price":68,"quantity":1}]', 68.00, 'wechat', 'completed', NOW() - INTERVAL '1 day'),
('txn003', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'cust003', 'apt007', '[{"name":"精剪","price":128,"quantity":1}]', 128.00, 'alipay', 'completed', NOW() - INTERVAL '1 day'),
('txn004', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'cust002', NULL, '[{"name":"洗澡","price":68,"quantity":1},{"name":"驱虫","price":80,"quantity":1}]', 148.00, 'cash', 'completed', NOW() - INTERVAL '2 days'),
('txn005', 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c', 'cust003', NULL, '[{"name":"SPA美容","price":198,"quantity":1}]', 198.00, 'wechat', 'completed', NOW() - INTERVAL '3 days');

-- 查看数据
SELECT '商家' as type, COUNT(*) as count FROM merchants
UNION ALL
SELECT '服务项目', COUNT(*) FROM services
UNION ALL  
SELECT '客户', COUNT(*) FROM customers
UNION ALL
SELECT '预约', COUNT(*) FROM appointments
UNION ALL
SELECT '交易', COUNT(*) FROM transactions;
