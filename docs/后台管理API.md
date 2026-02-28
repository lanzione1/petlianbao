# 后台管理 API 文档

## 概述

后台管理系统用于管理平台商家，包括审核、禁用、查看统计数据等。

---

## 认证

### 管理员登录

```
POST /api/v1/admin/login
```

**请求体:**
```json
{
  "username": "admin",
  "password": "admin123456"
}
```

**响应:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": {
    "id": "xxx",
    "username": "admin",
    "name": "超级管理员",
    "role": "super_admin"
  }
}
```

---

## 初始化

### 初始化超级管理员

```
POST /api/v1/admin/init
```

首次部署时调用，创建默认超级管理员账号。

---

## 商家管理

### 获取商家列表

```
GET /api/v1/admin/merchants?page=1&limit=20&status=active&search=店铺名
```

**参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认1 |
| limit | number | 每页数量，默认20 |
| status | string | 状态筛选: active/banned |
| search | string | 搜索店铺名或手机号 |

**响应:**
```json
{
  "list": [
    {
      "id": "uuid",
      "shopName": "我的宠物店",
      "phone": "13800138000",
      "planType": "free",
      "createdAt": "2026-02-22T00:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### 获取商家统计

```
GET /api/v1/admin/merchants/stats
```

**响应:**
```json
{
  "total": 100,
  "active": 20,
  "free": 80,
  "newThisWeek": 15
}
```

### 获取商家详情

```
GET /api/v1/admin/merchants/:id
```

### 审核通过商家

```
PUT /api/v1/admin/merchants/:id/approve
```

### 禁用商家

```
PUT /api/v1/admin/merchants/:id/ban
```

**请求体:**
```json
{
  "reason": "违规原因说明"
}
```

### 解禁商家

```
PUT /api/v1/admin/merchants/:id/unban
```

---

## 管理员管理

### 创建管理员

```
POST /api/v1/admin/admins
```

**请求体:**
```json
{
  "username": "operator1",
  "password": "password123",
  "name": "运营人员",
  "role": "operator"
}
```

**角色类型:**
- `super_admin` - 超级管理员（全部权限）
- `admin` - 管理员（大部分权限）
- `operator` - 运营人员（只读权限）

---

## 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123456 | super_admin |

⚠️ **生产环境请立即修改默认密码！**

---

## 使用示例

### 1. 登录获取Token

```bash
curl -X POST http://localhost:3000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}'
```

### 2. 获取商家列表

```bash
curl http://localhost:3000/api/v1/admin/merchants \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. 禁用商家

```bash
curl -X PUT http://localhost:3000/api/v1/admin/merchants/MERCHANT_ID/ban \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"违规操作"}'
```
