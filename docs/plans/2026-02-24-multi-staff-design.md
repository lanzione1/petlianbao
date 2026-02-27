# 多店员管理功能设计

## 概述

支持商家添加多个店员账号，区分管理员和店员角色，并记录操作日志。

## 角色设计

| 角色 | 说明 | 数量限制 |
|------|------|----------|
| 管理员 | 店主，拥有全部权限 | 1人 |
| 店员 | 员工，权限受限 | 根据套餐 |

## 登录方式

- 微信登录：一个微信小程序账号 = 一个店员账号
- 管理员和店员都通过微信登录

## 权限划分

| 功能 | 管理员 | 店员 |
|------|--------|------|
| 添加/删除店员 | ✅ | ❌ |
| 查看店员列表 | ✅ | ❌ |
| 预约管理（增删改查） | ✅ | ✅ |
| 客户管理（增删改查） | ✅ | ✅ |
| 服务项目管理 | ✅ | ❌（只能查看） |
| 结账收费 | ✅ | ✅ |
| 数据报表 | ✅ | ❌ |
| 店铺设置 | ✅ | ❌ |
| 素材库管理 | ✅ | ❌ |

## 数据模型

### Staff Entity

```typescript
@Entity('staffs')
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'openid', unique: true })
  openid: string;  // 微信openid

  @Column({ name: 'nickname', length: 50 })
  nickname: string;  // 店员昵称（微信昵称）

  @Column({ name: 'role', default: 'staff' })
  role: 'admin' | 'staff';

  @Column({ name: 'status', default: 'active' })
  status: 'active' | 'disabled';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### OperationLog Entity

```typescript
@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'staff_id' })
  staffId: string;

  @Column({ name: 'staff_name' })
  staffName: string;

  @Column({ name: 'action', length: 50 })
  action: string;  // 操作类型

  @Column({ name: 'target_type', length: 50 })
  targetType: string;  // 目标类型（customer, appointment, order等）

  @Column({ name: 'target_id' })
  targetId: string;  // 目标ID

  @Column({ name: 'details', type: 'jsonb' })
  details: Record<string, any>;  // 详细信息

  @CreateDateColumn()
  createdAt: Date;
}
```

## API 设计

### 店员管理

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /staffs | 管理员 | 获取店员列表 |
| POST | /staffs | 管理员 | 绑定新店员（微信code+昵称） |
| DELETE | /staffs/:id | 管理员 | 删除店员 |
| PUT | /staffs/:id/status | 管理员 | 启用/禁用店员 |
| GET | /staffs/me | 店员 | 获取自己的信息 |

### 操作日志

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | /logs | 管理员 | 获取操作日志列表 |
| GET | /logs/stats | 管理员 | 获取操作统计 |

## 操作日志记录场景

| 场景 | action | targetType | details |
|------|--------|------------|---------|
| 添加客户 | create | customer | { name, phone } |
| 修改客户 | update | customer | { before, after } |
| 删除客户 | delete | customer | { name } |
| 创建预约 | create | appointment | { customerName, serviceName, time } |
| 完成预约 | complete | appointment | { customerName, serviceName } |
| 结账 | checkout | order | { customerName, amount, items } |
| 添加服务项目 | create | service | { name, price } |

## 小程序页面

### 1. 店员管理页面（mine/index 添加）

- 管理员可见"店员管理"入口
- 列表显示：昵称、状态、添加时间
- 操作：添加店员、删除店员

### 2. 添加店员流程

```
管理员点击"添加店员" 
→ 展示二维码（包含 merchantId）
→ 店员扫码 → 微信登录 → 自动绑定到店铺
```

### 3. 操作日志页面

- 管理员可见"操作日志"入口
- 列表按时间倒序
- 显示：谁、什么时候、做了什么
- 支持按日期筛选

## 实现步骤

1. 创建 Staff 和 OperationLog 实体
2. 开发店员管理 API
3. 开发操作日志 API 和写入逻辑
4. 在现有 API 中集成日志记录
5. 开发小程序店员管理页面
6. 开发小程序操作日志页面
7. 添加权限守卫

## 待确认问题

- [ ] 是否需要限制免费版店员的数量？（建议：免费版1人，专业版5人）
