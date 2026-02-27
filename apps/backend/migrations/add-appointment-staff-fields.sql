-- 添加预约完成店员字段
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS completed_by_staff_id UUID,
ADD COLUMN IF NOT EXISTS completed_by_staff_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- 更新注释
COMMENT ON COLUMN appointments.completed_by_staff_id IS '完成服务的店员ID';
COMMENT ON COLUMN appointments.completed_by_staff_name IS '完成服务的店员姓名';
COMMENT ON COLUMN appointments.completed_at IS '完成服务的时间';

-- 更新预约状态约束（移除 confirmed，添加 paid）
-- 注意：PostgreSQL 需要先删除旧约束，再添加新约束
DO $$ 
BEGIN
    -- 检查并删除旧的check约束
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'appointments' AND constraint_name LIKE '%status%check%'
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
    END IF;
    
    -- 添加新的check约束
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_status_check 
    CHECK (status IN ('pending', 'completed', 'paid', 'cancelled'));
END $$;
