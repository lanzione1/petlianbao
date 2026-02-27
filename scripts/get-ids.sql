-- Get IDs
-- Services: 27fcebad-a709-4f5a-a331-68fa942cce8c (xizao)
-- Customers: 3fc76618-115d-4ab3-b4da-148b29c8cb26 (Doudou)

-- Get all service and customer IDs
SELECT s.id as service_id, s.name, c.id as customer_id, c.pet_name
FROM services s
CROSS JOIN customers c
WHERE s.merchant_id = 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c'
AND c.merchant_id = 'b5bfbfec-0d4c-4bd3-ac43-01cf9205e56c';
