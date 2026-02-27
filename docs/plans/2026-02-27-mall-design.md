# 宠联宝分销商城设计方案

> 创建日期：2026-02-27
> 状态：设计中

## 一、业务模式

### 1.1 模式定义

**S2B2C 分销商城模式**

```
供应链（你） → 店主（B端） → 终端客户（C端）
```

### 1.2 核心决策

| 决策项 | 选择 |
|--------|------|
| 商城入口 | 店主独立店铺码 + 共享商城自动绑定 |
| 定价机制 | 供货价 + 建议零售价（店主可调） |
| 结算周期 | 订单完成后自动结算 |
| 收银整合 | 独立商城模块（后期可整合） |
| 商品来源 | 混合模式（自营核心品类 + 供应商补充） |
| 支付方式 | 微信支付（含分账） |
| 物流方案 | 对接快递API |
| 发货方式 | 直发客户为主，批量寄给店主为辅 |

### 1.3 业务流程

```
┌─────────────────────────────────────────────────────────────┐
│  你的供应链层        │  店主层            │  终端客户层      │
├─────────────────────────────────────────────────────────────┤
│  商品管理           │  选择上架商品       │  浏览购买        │
│  库存管理           │  设置零售价         │  下单支付        │
│  发货履约           │  推广获客           │  收货确认        │
│  售后处理           │  客户维护           │  评价反馈        │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                    结算：店主赚取差价
```

---

## 二、系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         你（平台方）                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ 商品管理后台 │  │ 供应链管理  │  │ 结算/财务   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
          │                    │
          ▼                    ▼
┌─────────────────┐   ┌─────────────────┐
│  商家端小程序    │   │   商城H5        │
│  ─────────────  │   │  ────────────  │
│  • 浏览商品库    │   │  • 独立店铺码   │
│  • 选品上架      │◄──│  • 共享商城入口 │
│  • 定价设置      │   │  • 客户下单支付 │
│  • 订单管理      │   │  • 订单追踪     │
│  • 收益提现      │   └─────────────────┘
└─────────────────┘            │
                               ▼
                      ┌─────────────────┐
                      │   终端客户       │
                      │  扫码→浏览→下单  │
                      └─────────────────┘
```

### 2.2 技术栈

| 模块 | 技术方案 |
|------|---------|
| 商城H5 | Vue3 + Vite（嵌入customer-h5） |
| 后端模块 | NestJS新模块 mall/supply/settlement |
| 支付 | 微信支付V3（服务商分账模式） |
| 物流 | 快递100/菜鸟API |
| 存储 | 复用现有PostgreSQL + OSS |

---

## 三、整合设计（嵌入customer-h5）

### 3.1 整合方案

```
┌─────────────────────────────────────────────────────────────┐
│                    customer-h5（整合版）                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  用户进入方式：                                              │
│  • 扫店主店铺码（带merchant_id）                            │
│  • 微信公众号菜单                                            │
│  • 店主分享链接                                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 首页                                                    ││
│  │ ┌─────────────┐  ┌─────────────┐                      ││
│  │ │ 预约服务     │  │ 商城购物    │   ← 两大入口并排    ││
│  │ │ • 洗护美容   │  │ • 宠物用品  │                      ││
│  │ │ • 寄养服务   │  │ • 保健品类  │                      ││
│  │ └─────────────┘  └─────────────┘                      ││
│  │                                                         ││
│  │ 推荐区域：近期预约 → 推荐相关商品                       ││
│  │ 例如：预约了洗澡 → 推荐洗发水、护毛素                   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Tab页：服务预约 | 商城 | 订单中心 | 我的                    │
│                                                             │
│  订单中心：                                                 │
│  • 服务订单（现有预约记录）                                  │
│  • 商品订单（商城购物订单）                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 页面结构

**现有结构 → 改造后：**

```
App.vue                          App.vue
pages/                           pages/
├── AuthPage.vue                 ├── AuthPage.vue
├── BookingPage.vue              ├── HomePage.vue          ← 改造
├── MyAppointmentsPage.vue       ├── BookingPage.vue
├── PetDetailPage.vue            ├── MallHomePage.vue      ← 新增
├── PetsPage.vue       ───────►  ├── ProductDetailPage.vue ← 新增
└── ...                          ├── CartPage.vue          ← 新增
                                 ├── CheckoutPage.vue      ← 新增
                                 ├── MallOrdersPage.vue    ← 新增
                                 ├── OrderCenterPage.vue   ← 新增
                                 ├── MyAppointmentsPage.vue
                                 └── ...
```

### 3.3 首页布局设计

```
┌─────────────────────────────────────────────────────────────┐
│                        首页                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  店铺信息（扫店铺码进入时显示）                        │  │
│  │  宠物小屋 · 专业洗护服务                              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │   🛁 服务预约    │    │   🛒 商城购物    │               │
│  │   ────────────  │    │   ────────────  │               │
│  │   洗护 · 美容    │    │   主粮 · 零食    │               │
│  │   寄养 · 医疗    │    │   玩具 · 用品    │               │
│  └─────────────────┘    └─────────────────┘               │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  为你推荐（基于最近预约）                              │  │
│  │  ─────────────────────────────────────────────────    │  │
│  │  • 刚预约了洗澡？推荐专业洗毛精 →                     │  │
│  │  • 您的猫咪该驱虫了，推荐驱虫药 →                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  热门商品                                             │  │
│  │  [商品卡片] [商品卡片] [商品卡片]                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│   [预约]      [商城]      [订单]      [我的]                │
│    服务        购物        统一        宠物                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 四、智能推荐设计

### 4.1 推荐场景

| 场景 | 触发条件 | 推荐商品 |
|------|---------|---------|
| 预约后 | 预约了洗护服务 | 洗毛精、护毛素 |
| 预约后 | 预约了美容 | 美容梳、造型用品 |
| 定时提醒 | 宠物驱虫到期 | 驱虫药 |
| 定时提醒 | 宠物疫苗到期 | 疫苗（提醒到店） |
| 购买后 | 购买了主粮 | 同品牌零食、营养品 |

### 4.2 推荐API

```
GET /api/v1/h5/recommendations

Response:
{
  "items": [
    {
      "type": "service_related",
      "title": "预约洗护后推荐",
      "products": [...]
    },
    {
      "type": "pet_reminder",
      "title": "驱虫提醒",
      "products": [...]
    }
  ]
}
```

---

## 五、店主店铺码设计

### 5.1 统一店铺码

```
店主后台生成店铺码
       │
       ▼
┌──────────────────────────────────────────┐
│                                          │
│    ┌────────────────────────────────┐   │
│    │     宠物小屋                    │   │
│    │     扫码预约服务 / 购物商城     │   │
│    │                                │   │
│    │     [二维码]                    │   │
│    │                                │   │
│    │     长按识别小程序/H5          │   │
│    └────────────────────────────────┘   │
│                                          │
└──────────────────────────────────────────┘
       │
       ▼
客户扫码进入customer-h5
       │
       ├── 自动绑定店主（bind_merchant_id）
       │
       └── 进入首页（服务+商城统一入口）
```

### 5.2 支持的推广方式

| 方式 | 入口 | 说明 |
|------|------|------|
| 店铺码（统一） | 首页 | 服务+商城统一入口 |
| 服务预约码 | 预约页 | 直达预约页（带商城入口） |
| 商品分享链接 | 商品详情页 | 带店主绑定 |
| 活动海报二维码 | 落地页 | 可自定义 |

---

## 六、数据库设计

### 6.1 商品相关

```sql
-- 商品分类
CREATE TABLE mall_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INT REFERENCES mall_categories(id),
  sort_order INT DEFAULT 0,
  icon VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商品表
CREATE TABLE mall_products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category_id INT REFERENCES mall_categories(id),
  images TEXT[],
  description TEXT,
  supply_price DECIMAL(10,2) NOT NULL,    -- 供货价
  suggested_price DECIMAL(10,2) NOT NULL, -- 建议零售价
  stock INT DEFAULT 0,
  sku_specs JSONB,                         -- SKU规格
  supplier_id INT,                         -- 供应商ID（自营为空）
  status VARCHAR(20) DEFAULT 'active',     -- active/inactive
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 店主分销商品
CREATE TABLE merchant_mall_products (
  id SERIAL PRIMARY KEY,
  merchant_id INT NOT NULL,
  product_id INT REFERENCES mall_products(id),
  retail_price DECIMAL(10,2),              -- 店主定价
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(merchant_id, product_id)
);
```

### 6.2 订单相关

```sql
-- 商城客户（扩展h5_customer）
ALTER TABLE h5_customers ADD COLUMN IF NOT EXISTS bind_merchant_id INT;

-- 购物车
CREATE TABLE mall_carts (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL,
  product_id INT REFERENCES mall_products(id),
  quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, product_id)
);

-- 商城订单
CREATE TABLE mall_orders (
  id SERIAL PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  merchant_id INT NOT NULL,
  customer_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,    -- 客户支付
  supply_amount DECIMAL(10,2) NOT NULL,   -- 供货成本
  profit_amount DECIMAL(10,2) NOT NULL,   -- 店主利润
  platform_fee DECIMAL(10,2) DEFAULT 0,   -- 平台抽成
  status VARCHAR(20) DEFAULT 'pending',   -- pending/paid/shipped/completed/refunded
  shipping_info JSONB,
  shipping_no VARCHAR(100),               -- 物流单号
  shipping_company VARCHAR(50),           -- 快递公司
  settled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订单商品
CREATE TABLE mall_order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES mall_orders(id),
  product_id INT NOT NULL,
  product_name VARCHAR(200),
  quantity INT NOT NULL,
  supply_price DECIMAL(10,2),
  retail_price DECIMAL(10,2)
);
```

### 6.3 结算相关

```sql
-- 结算记录
CREATE TABLE mall_settlements (
  id SERIAL PRIMARY KEY,
  merchant_id INT NOT NULL,
  order_id INT REFERENCES mall_orders(id),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',   -- pending/settled
  settled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 店主余额（扩展merchant表或新建）
CREATE TABLE merchant_balances (
  id SERIAL PRIMARY KEY,
  merchant_id INT UNIQUE NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0,        -- 可提现余额
  frozen_balance DECIMAL(10,2) DEFAULT 0, -- 冻结金额
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 提现记录
CREATE TABLE mall_withdrawals (
  id SERIAL PRIMARY KEY,
  merchant_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',   -- pending/approved/rejected/paid
  bank_info JSONB,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);
```

---

## 七、API设计

### 7.1 商品管理（管理后台）

```
POST   /api/v1/admin/mall/products          创建商品
GET    /api/v1/admin/mall/products          商品列表
GET    /api/v1/admin/mall/products/:id      商品详情
PUT    /api/v1/admin/mall/products/:id      更新商品
DELETE /api/v1/admin/mall/products/:id      删除商品

POST   /api/v1/admin/mall/categories        创建分类
GET    /api/v1/admin/mall/categories        分类列表
PUT    /api/v1/admin/mall/categories/:id    更新分类
DELETE /api/v1/admin/mall/categories/:id    删除分类
```

### 7.2 店主选品（商家小程序）

```
GET    /api/v1/merchant/mall/products           商品库列表
POST   /api/v1/merchant/mall/products/:id/activate    上架商品
PUT    /api/v1/merchant/mall/products/:id/price       设置价格
DELETE /api/v1/merchant/mall/products/:id/deactivate  下架商品
GET    /api/v1/merchant/mall/my-products        我上架的商品
GET    /api/v1/merchant/mall/qrcode             获取店铺码
```

### 7.3 客户商城（H5）

```
GET    /api/v1/h5/mall/products              商品列表（按店主筛选）
GET    /api/v1/h5/mall/products/:id          商品详情
GET    /api/v1/h5/mall/categories            商品分类
GET    /api/v1/h5/mall/recommendations       为你推荐

POST   /api/v1/h5/mall/cart                  加入购物车
GET    /api/v1/h5/mall/cart                  购物车列表
PUT    /api/v1/h5/mall/cart/:id              更新数量
DELETE /api/v1/h5/mall/cart/:id              删除购物车项

POST   /api/v1/h5/mall/orders                创建订单
POST   /api/v1/h5/mall/orders/:id/pay        发起支付
GET    /api/v1/h5/mall/orders                我的商品订单
GET    /api/v1/h5/mall/orders/:id            订单详情
GET    /api/v1/h5/mall/orders/:id/logistics  物流信息

# 订单中心（统一）
GET    /api/v1/h5/orders                     统一订单列表（服务+商品）
```

### 7.4 发货管理（管理后台）

```
GET    /api/v1/admin/mall/orders             订单列表
PUT    /api/v1/admin/mall/orders/:id/ship    发货（填写物流信息）
GET    /api/v1/admin/mall/orders/:id         订单详情
```

---

## 八、路由设计

```typescript
// customer-h5 router/index.ts
const routes = [
  // 现有服务相关
  { path: '/', component: HomePage },           // 首页（改造）
  { path: '/auth', component: AuthPage },
  { path: '/booking', component: BookingPage },
  { path: '/appointments', component: MyAppointmentsPage },
  { path: '/pets', component: PetsPage },
  { path: '/pets/:id', component: PetDetailPage },
  { path: '/appointment/:id', component: AppointmentDetailPage },
  
  // 新增商城相关
  { path: '/mall', component: MallHomePage },        // 商城首页
  { path: '/mall/category/:id', component: CategoryPage },
  { path: '/mall/product/:id', component: ProductDetailPage },
  { path: '/mall/cart', component: CartPage },
  { path: '/mall/checkout', component: CheckoutPage },
  { path: '/mall/orders', component: MallOrdersPage },
  { path: '/mall/order/:id', component: MallOrderDetailPage },
  
  // 订单中心（统一）
  { path: '/orders', component: OrderCenterPage },
]
```

---

## 九、开发计划

### Phase 1: 商品管理基础（1周）

- [ ] 数据库表创建
- [ ] 后端 mall 模块搭建
- [ ] 商品CRUD API
- [ ] 分类管理API
- [ ] 管理后台商品管理页面

### Phase 2: 店主选品功能（1周）

- [ ] 商家小程序商品库页面
- [ ] 选品上架功能
- [ ] 定价设置
- [ ] 店主店铺码生成

### Phase 3: 客户商城H5（2周）

- [ ] customer-h5 首页改造
- [ ] 商城页面开发
- [ ] 购物车功能
- [ ] 下单流程
- [ ] 微信支付对接（含分账）
- [ ] 订单列表/详情

### Phase 4: 订单履约（1周）

- [ ] 管理后台发货管理
- [ ] 快递API对接
- [ ] 物流信息同步
- [ ] 店主端订单管理

### Phase 5: 结算系统（1周）

- [ ] 订单完成自动结算
- [ ] 店主收益余额
- [ ] 提现申请/审核
- [ ] 财务报表

---

## 十、待确认事项

- [ ] 微信支付分账比例
- [ ] 快递服务商选择（快递100/菜鸟）
- [ ] 供应商对接方式
- [ ] 售后流程设计
- [ ] 退款处理流程

---

## 十一、风险评估

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| 供应链不稳定 | 缺货、发货延迟 | 多供应商备份、库存预警 |
| 物流成本高 | 利润压缩 | 与快递谈批量价、满额包邮 |
| 售后纠纷 | 客户体验差 | 明确退换货规则、客服培训 |
| 店主定价过低 | 利润过低 | 设置最低零售价限制 |
| 库存积压 | 资金占用 | 小批量试销、数据分析选品 |

---

*文档结束*