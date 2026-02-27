# 宠联宝 (PetLianBao) - 技术设计文档

## 项目概述

**项目名称**: 宠联宝  
**定位**: 小微宠物服务数字化工具箱与产业赋能平台  
**目标用户**: 1-3人经营的社区宠物店、个人美容师/训犬师

## 技术选型

| 层级 | 技术栈 | 说明 |
|------|--------|------|
| 后端 | Node.js + NestJS | 模块化设计，快速迭代 |
| 数据库 | PostgreSQL | 关系型数据库，JSON支持好 |
| 缓存 | Redis | Session、队列、热点数据 |
| 商家端 | 原生微信小程序 | 原生性能，微信生态集成最佳 |
| 客户端 | H5 (Vue3) | 轻量预约页面，易分享 |
| 部署 | 腾讯云 | 国内主流，微信生态集成好 |
| 文件存储 | 腾讯云COS | 海报、优惠券模板 |

## 架构设计

### 整体架构

采用**单体分层架构**，适合5人团队MVP阶段快速迭代：

```
用户层: 商家小程序 + 客户H5
    ↓
接入层: Nginx (HTTPS/负载均衡)
    ↓
应用层: NestJS单体应用 (模块化)
    ├── auth模块 (微信登录)
    ├── appointment模块 (预约)
    ├── customer模块 (客户)
    ├── billing模块 (收银)
    ├── marketing模块 (营销)
    └── report模块 (报表)
    ↓
数据层: PostgreSQL + Redis + COS
```

### 项目结构

```
petlianbao/
├── apps/
│   ├── backend/                 # NestJS后端
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── merchant/
│   │   │   │   ├── appointment/
│   │   │   │   ├── customer/
│   │   │   │   ├── billing/
│   │   │   │   ├── marketing/
│   │   │   │   └── report/
│   │   │   ├── common/
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── merchant-miniapp/        # 商家端小程序
│   │   ├── pages/
│   │   │   ├── index/
│   │   │   ├── customer/
│   │   │   ├── billing/
│   │   │   ├── marketing/
│   │   │   └── report/
│   │   ├── components/
│   │   ├── utils/
│   │   └── app.json
│   │
│   └── customer-h5/             # 客户预约H5
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   └── main.ts
│       └── index.html
│
├── packages/
│   ├── types/                   # 共享类型定义
│   └── utils/                   # 共享工具函数
│
├── docs/
├── scripts/
├── docker-compose.yml
└── package.json
```

## 数据库设计

### ER图概览

```
merchants (商家)
    │
    ├── 1:N ── services (服务项目)
    │
    ├── 1:N ── customers (客户)
    │              │
    │              ├── 1:N ── appointments (预约)
    │              │
    │              └── 1:N ── transactions (交易)
    │
    └── 1:N ── campaigns (营销活动)
```

### 核心表结构

```sql
-- 商家表
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openid VARCHAR(100) UNIQUE NOT NULL,
  shop_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(200),
  business_hours JSONB DEFAULT '{"weekdays":["09:00-18:00"],"weekends":["09:00-20:00"]}',
  plan_type VARCHAR(20) DEFAULT 'free',
  plan_expired_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 服务项目表
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration INT DEFAULT 60,
  daily_limit INT DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 客户表
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  pet_name VARCHAR(50) NOT NULL,
  pet_breed VARCHAR(50),
  pet_birthday DATE,
  phone VARCHAR(20),
  notes TEXT,
  tags JSONB DEFAULT '[]',
  total_spent DECIMAL(10,2) DEFAULT 0,
  visit_count INT DEFAULT 0,
  last_visit_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 预约表
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id),
  customer_id UUID REFERENCES customers(id),
  service_id UUID REFERENCES services(id),
  appointment_time TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 交易表
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id),
  customer_id UUID REFERENCES customers(id),
  appointment_id UUID REFERENCES appointments(id),
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20),
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 营销活动表
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id),
  type VARCHAR(20) NOT NULL,
  title VARCHAR(100),
  content JSONB,
  target_tags JSONB,
  sent_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_appointments_merchant_time ON appointments(merchant_id, appointment_time);
CREATE INDEX idx_customers_merchant ON customers(merchant_id);
CREATE INDEX idx_transactions_merchant_date ON transactions(merchant_id, DATE(created_at));
```

## API设计

### 基础信息

- 基础路径: `/api/v1`
- 认证方式: Bearer Token (JWT)
- 响应格式: JSON

### API列表

#### 认证模块
```
POST   /auth/wechat/login      # 微信登录
GET    /auth/profile           # 获取当前用户
PUT    /auth/profile           # 更新商家信息
```

#### 预约模块
```
GET    /appointments           # 预约列表
GET    /appointments/today     # 今日看板
POST   /appointments           # 创建预约
PUT    /appointments/:id       # 更新状态
DELETE /appointments/:id       # 取消预约
```

#### 服务模块
```
GET    /services               # 服务列表
POST   /services               # 创建服务
PUT    /services/:id           # 更新服务
DELETE /services/:id           # 删除服务
```

#### 客户模块
```
GET    /customers              # 客户列表
GET    /customers/:id          # 客户详情
POST   /customers              # 创建客户
PUT    /customers/:id          # 更新客户
GET    /customers/:id/history  # 消费历史
GET    /customers/inactive     # 流失客户
```

#### 收银模块
```
POST   /billing/checkout       # 创建交易
GET    /billing/today          # 今日交易
GET    /billing/daily-summary  # 日结汇总
POST   /billing/close-day      # 关店日结
```

#### 营销模块
```
GET    /marketing/templates    # 模板列表
POST   /marketing/poster       # 生成海报
POST   /marketing/coupon       # 发优惠券
POST   /marketing/broadcast    # 群发消息
GET    /marketing/campaigns    # 活动记录
```

#### 报表模块
```
GET    /reports/daily          # 日报
GET    /reports/monthly        # 月报
GET    /reports/customers      # 客户分析
GET    /reports/services       # 服务排行
```

## 小程序页面设计

### 商家端页面

| 页面 | 路径 | 功能 |
|------|------|------|
| 首页/预约看板 | /pages/index/index | 今日预约、快速操作 |
| 客户列表 | /pages/customer/list | 搜索、筛选客户 |
| 客户详情 | /pages/customer/detail | 档案、消费记录 |
| 收银台 | /pages/billing/index | 3步收银 |
| 日结 | /pages/billing/daily | 对账报表 |
| 营销 | /pages/marketing/index | 海报、优惠券 |
| 我的 | /pages/mine/index | 设置、会员 |

### 客户H5页面

| 页面 | 路径 | 功能 |
|------|------|------|
| 预约 | /booking | 选择服务、时间、提交 |
| 成功 | /success | 预约成功提示 |

## 开发里程碑

### Phase 1: 基础搭建 (Week 1-2)
- [ ] 项目初始化 (Monorepo)
- [ ] NestJS后端框架搭建
- [ ] 数据库设计与迁移
- [ ] 微信登录接入
- [ ] 基础API框架

### Phase 2: 预约模块 (Week 3-4)
- [ ] 服务项目管理
- [ ] 客户预约H5页面
- [ ] 预约看板(商家端)
- [ ] 微信模板消息提醒
- [ ] 预约状态管理

### Phase 3: 客户+收银 (Week 5-6)
- [ ] 客户CRUD
- [ ] 智能标签系统
- [ ] 极速收银台
- [ ] 多支付方式集成
- [ ] 日结报表

### Phase 4: 营销+报表 (Week 7-8)
- [ ] 海报模板生成
- [ ] 优惠券系统
- [ ] 自动化营销规则
- [ ] 数据报表(日/周/月)
- [ ] 客户分析

### Phase 5: 测试上线 (Week 9-10)
- [ ] 功能测试
- [ ] 性能优化
- [ ] 安全审计
- [ ] 小程序审核
- [ ] 正式上线

## 部署方案

### 开发环境
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: petlianbao
      POSTGRES_PASSWORD: dev123

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./apps/backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
```

### 生产环境 (腾讯云)
- CVM: 2核4G (初期)
- PostgreSQL: 自建或云数据库
- Redis: 自建或云托管
- COS: 对象存储
- 域名 + SSL证书

## 扩展性设计

### 垂直扩展路径
```
2核4G (5000商家) → 4核8G (2万商家) → 8核16G (5万商家)
```

### 水平扩展路径
```
单机 → 主从复制 → 读写分离 → 微服务拆分
```

NestJS模块化设计使得后期拆分微服务成本较低，约2-4周可完成。

## 风险与应对

| 风险 | 应对策略 |
|------|----------|
| 微信模板消息审核 | 准备多个模板备选，合理设置类目 |
| 支付接入延迟 | 初期支持现金记录，后续补接入 |
| 小程序审核被拒 | 提前了解审核规则，准备申诉材料 |
| 性能瓶颈 | 监控关键指标，及时扩容 |
