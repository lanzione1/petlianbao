-- 更新预约取消状态字段

-- 扩展 status 字段长度
ALTER TABLE appointments 
ALTER COLUMN status TYPE VARCHAR(30);

-- 添加新字段
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS need_follow_up BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS followed_up_at TIMESTAMP;

-- 添加字段注释
COMMENT ON COLUMN appointments.cancel_reason IS '取消原因';
COMMENT ON COLUMN appointments.cancelled_at IS '取消时间';
COMMENT ON COLUMN appointments.need_follow_up IS '是否需要回访';
COMMENT ON COLUMN appointments.followed_up_at IS '回访时间';

-- 先迁移旧数据：将 'cancelled' 和 'confirmed' 状态改为新状态
UPDATE appointments 
SET status = 'cancelled_by_merchant' 
WHERE status = 'cancelled';

UPDATE appointments 
SET status = 'completed' 
WHERE status = 'confirmed';

-- 更新状态约束，支持新的取消状态
DO $$ 
BEGIN
    -- 删除旧的check约束
    ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
    
    -- 添加新的check约束
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_status_check 
    CHECK (status IN ('pending', 'completed', 'paid', 'cancelled_by_merchant', 'cancelled_by_customer'));
END $$;
