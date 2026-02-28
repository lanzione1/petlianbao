# H5客户端预约全流程功能设计

> 创建日期：2026-02-26
> 状态：设计完成，待实施

---

## 一、项目概述

### 1.1 目标

完善H5客户端预约功能，实现完整的协商式预约流程，支持微信授权登录和通知推送。

### 1.2 核心功能

| 模块 | 功能 |
|------|------|
| 授权登录 | 微信测试号授权（后续升级开放平台） |
| 预约管理 | 创建/查看/修改/取消预约 |
| 宠物管理 | 宠物档案CRUD |
| 通知系统 | 微信模板消息 + 模拟短信 |

### 1.3 预约模式

**协商式预约**：客户和店主可多次协商时间，直到达成一致或取消。

---

## 二、技术选型

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 + TypeScript + Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| HTTP客户端 | Axios |
| UI风格 | 参考现有小程序 |
| 后端框架 | NestJS + TypeORM |
| 数据库 | PostgreSQL（复用现有） |
| 微信授权 | 测试号（后续升级开放平台） |

---

## 三、整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                          H5客户端架构                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│  │   页面层     │    │   状态层     │    │   服务层     │            │
│  ├─────────────┤    ├─────────────┤    ├─────────────┤            │
│  │ 首页(授权)  │    │ 用户状态     │    │ 微信授权API  │            │
│  │ 预约表单    │    │ 预约状态     │    │ 预约API      │            │
│  │ 我的预约    │    │ 宠物状态     │    │ 宠物API      │            │
│  │ 预约详情    │    │ 通知状态     │    │ 通知API      │            │
│  │ 宠物管理    │    │             │    │             │            │
│  └─────────────┘    └─────────────┘    └─────────────┘            │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │                      后端API                              │      │
│  ├─────────────────────────────────────────────────────────┤      │
│  │ /auth/wechat/*    - 微信授权相关                          │      │
│  │ /public/*         - 公开接口（商家信息、服务列表）            │      │
│  │ /customer/*       - 客户接口（预约CRUD、宠物管理）           │      │
│  │ /notifications/*  - 通知相关                              │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 四、预约状态流转

### 4.1 状态流转图

```
                           ┌──────────┐
                           │  pending │ ◄─────────────────────┐
                           │ (待确认) │                        │
                           └────┬─────┘                        │
                                │                              │
              ┌─────────────────┼─────────────────┐            │
              │                 │                 │            │
              ▼                 ▼                 ▼            │
       ┌────────────┐    ┌────────────┐    ┌────────────┐     │
       │ confirmed │    │ reschedule │    │ cancelled  │     │
       │ (已确认)   │    │ (待改期)   │    │ (已取消)   │     │
       └─────┬──────┘    └─────┬──────┘    └────────────┘     │
             │                 │                                │
             │                 │ 客户/店主修改时间              │
             │                 └───────────────────────────────┘
             │                                                                │
             ▼                                                                │
       ┌────────────┐                                                         │
       │ in_service │                                                         │
       │ (服务中)   │                                                         │
       └─────┬──────┘                                                         │
             │                                                                │
             ▼                                                                │
       ┌────────────┐                                                         │
       │ completed  │                                                         │
       │ (已完成)   │                                                         │
       └────────────┘                                                         │
```

### 4.2 状态说明

| 状态 | 含义 | 可执行操作 |
|------|------|-----------|
| `pending` | 客户/店主新建，待对方确认 | 确认、改期、取消 |
| `confirmed` | 双方已确认时间 | 开始服务、改期、取消 |
| `reschedule` | 一方提出改期，待对方确认 | 确认改期、拒绝改期 |
| `in_service` | 服务进行中 | 完成服务 |
| `completed` | 服务已完成 | 查看详情、评价 |
| `cancelled` | 已取消 | - |

### 4.3 协商规则

- 客户发起 → 店主确认/改期/取消
- 店主发起 → 客户确认/改期/取消
- 改期后状态回到 `pending` 或 `reschedule`
- 无限次协商，直到确认或取消

---

## 五、页面结构

### 5.1 路由规划

| 路由 | 页面 | 功能 |
|------|------|------|
| `/` | 首页 | 授权入口、商家选择 |
| `/auth` | 授权页 | 微信授权中转 |
| `/booking` | 预约表单 | 创建/修改预约 |
| `/appointments` | 预约列表 | 查看所有预约 |
| `/appointment/:id` | 预约详情 | 预约详情、操作 |
| `/pets` | 宠物列表 | 管理宠物档案 |
| `/pet/:id` | 宠物详情 | 编辑宠物信息 |
| `/profile` | 个人中心 | 用户设置 |

### 5.2 页面流程

```
首次访问：
/ → 检测授权 → 未授权 → /auth → 微信授权 → /booking
                 ↓
             已授权 → /appointments

已登录用户：
/ → 直接跳转 /appointments（或上次访问的商家预约页）
```

### 5.3 底部导航

```
┌────────────────────────────────────────────┐
│   🏠首页    📅预约    🐾宠物    👤我的      │
└────────────────────────────────────────────┘
```

---

## 六、API设计

### 6.1 认证相关 `/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/auth/wechat/url` | 获取微信授权URL |
| GET | `/auth/wechat/callback` | 微信授权回调 |
| POST | `/auth/phone/bind` | 绑定手机号 |
| GET | `/auth/me` | 获取当前用户信息 |
| POST | `/auth/logout` | 退出登录 |

### 6.2 预约相关 `/appointments`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/appointments` | 获取预约列表 |
| GET | `/appointments/:id` | 获取预约详情 |
| POST | `/appointments` | 创建预约 |
| PUT | `/appointments/:id` | 修改预约（改期） |
| PUT | `/appointments/:id/confirm` | 确认预约 |
| PUT | `/appointments/:id/reject` | 拒绝预约 |
| PUT | `/appointments/:id/cancel` | 取消预约 |
| PUT | `/appointments/:id/complete` | 完成预约（店主） |

### 6.3 宠物相关 `/pets`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/pets` | 获取宠物列表 |
| GET | `/pets/:id` | 获取宠物详情 |
| POST | `/pets` | 添加宠物 |
| PUT | `/pets/:id` | 更新宠物信息 |
| DELETE | `/pets/:id` | 删除宠物 |

### 6.4 公开接口 `/public`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/public/merchants/:id` | 获取商家信息 |
| GET | `/public/services/:merchantId` | 获取商家服务列表 |
| GET | `/public/slots` | 获取可预约时段 |

### 6.5 数据结构

```typescript
// 预约
interface Appointment {
  id: string;
  merchantId: string;
  customerId: string;
  petId?: string;
  serviceId: string;
  appointmentTime: Date;
  proposedTime?: Date;
  status: 'pending' | 'confirmed' | 'reschedule' | 'in_service' | 'completed' | 'cancelled';
  proposedBy?: 'customer' | 'merchant';
  notes?: string;
  cancelReason?: string;
  createdBy: 'customer' | 'merchant';
  history: AppointmentHistory[];
  createdAt: Date;
  updatedAt: Date;
}

// 协商记录
interface AppointmentHistory {
  action: 'create' | 'confirm' | 'reschedule' | 'accept' | 'reject' | 'cancel' | 'complete';
  operator: 'customer' | 'merchant';
  operatorName: string;
  oldTime?: Date;
  newTime?: Date;
  notes?: string;
  createdAt: Date;
}

// 宠物
interface Pet {
  id: string;
  customerId: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed?: string;
  gender?: 'male' | 'female';
  birthday?: Date;
  weight?: number;
  avatar?: string;
  notes?: string;
  createdAt: Date;
}

// 客户
interface Customer {
  id: string;
  openid?: string;
  unionid?: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  pets: Pet[];
  createdAt: Date;
}
```

---

## 七、数据库设计

### 7.1 新增表

#### h5_customers（H5客户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| merchant_id | UUID | 所属商家ID |
| openid | VARCHAR(64) | 微信openid |
| unionid | VARCHAR(64) | 微信unionid（预留） |
| phone | VARCHAR(20) | 手机号 |
| nickname | VARCHAR(50) | 微信昵称 |
| avatar | VARCHAR(255) | 头像URL |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### h5_pets（H5宠物表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| customer_id | UUID | 所属客户ID |
| name | VARCHAR(50) | 宠物名称 |
| species | VARCHAR(20) | 种类（dog/cat/other） |
| breed | VARCHAR(50) | 品种 |
| gender | VARCHAR(10) | 性别 |
| birthday | DATE | 生日 |
| weight | DECIMAL(5,2) | 体重（kg） |
| avatar | VARCHAR(255) | 头像URL |
| notes | TEXT | 备注 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### appointment_histories（预约记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| appointment_id | UUID | 预约ID |
| action | VARCHAR(20) | 操作类型 |
| operator_type | VARCHAR(20) | 操作方类型 |
| operator_id | UUID | 操作方ID |
| operator_name | VARCHAR(50) | 操作方名称 |
| old_time | TIMESTAMP | 原时间 |
| new_time | TIMESTAMP | 新时间 |
| notes | TEXT | 备注 |
| created_at | TIMESTAMP | 创建时间 |

#### notification_logs（通知记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 接收用户ID |
| user_type | VARCHAR(20) | 用户类型 |
| type | VARCHAR(20) | 通知类型 |
| template_id | VARCHAR(100) | 模板ID |
| content | JSONB | 通知内容 |
| status | VARCHAR(20) | 状态 |
| error_message | TEXT | 错误信息 |
| sent_at | TIMESTAMP | 发送时间 |
| created_at | TIMESTAMP | 创建时间 |

### 7.2 修改表

#### appointments（预约表）

新增字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| h5_customer_id | UUID | H5客户ID |
| h5_pet_id | UUID | H5宠物ID |
| proposed_time | TIMESTAMP | 改期提议时间 |
| proposed_by | VARCHAR(20) | 提议方 |
| created_by | VARCHAR(20) | 创建方 |

---

## 八、微信测试号集成

### 8.1 配置步骤

1. **获取测试号**
   - 访问 https://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=sandbox/login
   - 扫码登录获取 appID 和 appsecret

2. **配置授权域名**
   - 使用内网穿透工具获取公网域名
   - 测试号管理页面配置网页授权域名

3. **授权流程**
   ```
   H5页面 → 微信授权页 → 回调页 → 预约页
   ```

### 8.2 环境变量

```env
# 后端
WECHAT_TEST_APP_ID=wx...
WECHAT_TEST_APP_SECRET=...
WECHAT_OAUTH_REDIRECT=https://abc.cpolar.cn/auth/callback

# 前端
VITE_WECHAT_APP_ID=wx...
VITE_WECHAT_REDIRECT_URI=https://abc.cpolar.cn/auth/callback
```

### 8.3 模板消息

| 模板 | 标题 | 用途 |
|------|------|------|
| 模板1 | 预约确认通知 | 新预约通知店主 |
| 模板2 | 预约状态变更 | 状态变更通知 |

---

## 九、通知系统设计

### 9.1 通知场景

| 场景 | 通知对象 | 通知方式 |
|------|---------|---------|
| 客户创建预约 | 店主 | 模板消息 |
| 店主创建预约 | 客户 | 模板消息+短信 |
| 店主确认预约 | 客户 | 模板消息+短信 |
| 客户确认预约 | 店主 | 模板消息 |
| 店主改期提议 | 客户 | 模板消息+短信 |
| 客户改期提议 | 店主 | 模板消息 |
| 确认改期 | 双方 | 模板消息 |
| 取消预约 | 对方 | 模板消息+短信 |
| 预约提醒 | 客户 | 模板消息 |
| 服务完成 | 客户 | 模板消息 |

### 9.2 模拟短信

开发阶段使用控制台输出代替真实短信：

```typescript
async sendSms(phone: string, content: string) {
  console.log('════════════════════════════════════════');
  console.log('【模拟短信】');
  console.log(`接收号码: ${phone}`);
  console.log(`发送时间: ${new Date().toLocaleString()}`);
  console.log(`短信内容: ${content}`);
  console.log('════════════════════════════════════════');
}
```

---

## 十、实施计划

详见 `2026-02-26-h5-appointment-implementation.md`

---

## 十一、风险与对策

| 风险 | 对策 |
|------|------|
| 测试号100人限制 | 预留清理机制，升级时迁移数据 |
| 内网穿透不稳定 | 准备多个穿透工具备选 |
| 微信授权域名变更 | 配置化域名，便于切换 |
| 模板消息审核 | 提前准备多个模板备选 |

---

## 十二、升级路径

从测试号升级到正式方案的路径：

```
测试号（当前）
    │
    ├── 注册公司/个体户
    │
    ├── 申请微信公众号（服务号）
    │
    ├── ICP备案域名
    │
    ├── 配置正式公众号
    │
    └── 正式上线
         │
         ├── 申请微信开放平台
         │
         ├── 绑定小程序+公众号
         │
         └── 实现用户统一（unionid）
```

数据迁移策略：
- H5客户表预留 `unionid` 字段
- 升级时通过 `openid` 关联 `unionid`
- 手机号作为备用关联字段

---

## 附录

### A. 相关文档

- [微信测试号申请](https://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=sandbox/login)
- [微信网页授权文档](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html)
- [微信模板消息文档](https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Template_Message_Interface.html)

### B. 参考项目

- 商家小程序：`apps/merchant-miniapp`
- 后端API：`apps/backend`
- 客户H5：`apps/customer-h5`