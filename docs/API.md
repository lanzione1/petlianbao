# 宠联宝 API 文档

基础URL: `https://api.petlianbao.com/api/v1`

## 认证

所有需要认证的接口需在请求头中携带 JWT Token：

```
Authorization: Bearer <token>
```

## 目录

- [认证接口](#认证接口)
- [服务管理](#服务管理)
- [预约管理](#预约管理)
- [客户管理](#客户管理)
- [收银管理](#收银管理)
- [营销管理](#营销管理)
- [数据报表](#数据报表)
- [公开接口](#公开接口)

---

## 认证接口

### 微信登录

```
POST /auth/wechat/login
```

**请求体:**
```json
{
  "code": "微信登录code"
}
```

**响应:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "merchant": {
    "id": "uuid",
    "shopName": "店铺名称",
    "phone": "13800138000",
    "planType": "free"
  }
}
```

### 获取用户信息

```
GET /auth/profile
```

**响应:**
```json
{
  "id": "uuid",
  "shopName": "店铺名称",
  "phone": "13800138000",
  "address": "店铺地址",
  "planType": "free",
  "planExpiredAt": "2025-12-31T00:00:00.000Z"
}
```

---

## 服务管理

### 获取服务列表

```
GET /services
```

**响应:**
```json
[
  {
    "id": "uuid",
    "name": "洗澡",
    "price": 68,
    "duration": 60,
    "dailyLimit": 10,
    "isActive": true,
    "sortOrder": 0
  }
]
```

### 创建服务

```
POST /services
```

**请求体:**
```json
{
  "name": "精剪",
  "price": 128,
  "duration": 90,
  "dailyLimit": 5
}
```

### 更新服务

```
PUT /services/:id
```

### 删除服务

```
DELETE /services/:id
```

---

## 预约管理

### 获取预约列表

```
GET /appointments?date=2025-02-20
```

**响应:**
```json
[
  {
    "id": "uuid",
    "appointmentTime": "2025-02-20T10:00:00.000Z",
    "status": "pending",
    "notes": "狗狗怕吹风机",
    "customer": {
      "id": "uuid",
      "petName": "豆豆"
    },
    "service": {
      "id": "uuid",
      "name": "洗澡",
      "price": 68
    }
  }
]
```

### 获取今日预约

```
GET /appointments/today
```

### 创建预约

```
POST /appointments
```

**请求体:**
```json
{
  "customerId": "uuid",
  "serviceId": "uuid",
  "appointmentTime": "2025-02-20T14:00:00.000Z",
  "notes": "备注信息"
}
```

### 更新预约状态

```
PUT /appointments/:id
```

**请求体:**
```json
{
  "status": "confirmed"
}
```

---

## 客户管理

### 获取客户列表

```
GET /customers?search=豆豆&inactive=false&page=1&limit=20
```

**响应:**
```json
{
  "list": [
    {
      "id": "uuid",
      "petName": "豆豆",
      "petBreed": "泰迪",
      "phone": "138****1234",
      "totalSpent": 580,
      "visitCount": 3,
      "lastVisitAt": "2025-02-17T00:00:00.000Z"
    }
  ],
  "total": 50
}
```

### 获取客户详情

```
GET /customers/:id
```

### 获取客户消费历史

```
GET /customers/:id/history
```

### 创建客户

```
POST /customers
```

**请求体:**
```json
{
  "petName": "豆豆",
  "petBreed": "泰迪",
  "phone": "13800138000",
  "notes": "怕吹风机"
}
```

### 获取流失客户

```
GET /customers/inactive
```

---

## 收银管理

### 创建交易（收银）

```
POST /billing/checkout
```

**请求体:**
```json
{
  "customerId": "uuid",
  "appointmentId": "uuid",
  "items": [
    {"name": "洗澡", "price": 68, "quantity": 1},
    {"name": "驱虫", "price": 80, "quantity": 1}
  ],
  "totalAmount": 148,
  "paymentMethod": "wechat"
}
```

### 获取今日交易

```
GET /billing/today
```

### 获取日结汇总

```
GET /billing/daily-summary
```

**响应:**
```json
{
  "totalRevenue": 1580,
  "orderCount": 12,
  "avgPrice": 131.7,
  "paymentBreakdown": {
    "wechat": 850,
    "alipay": 480,
    "cash": 250
  },
  "uniqueCustomers": 9
}
```

### 关店日结

```
POST /billing/close-day
```

**请求体:**
```json
{
  "cashAmount": 250
}
```

---

## 营销管理

### 获取营销模板

```
GET /marketing/templates?type=poster
```

### 创建营销活动

```
POST /marketing
```

**请求体:**
```json
{
  "type": "coupon",
  "title": "新年特惠",
  "content": {"discount": 10},
  "targetTags": ["high_value"]
}
```

### 发送优惠券

```
POST /marketing/coupon
```

**请求体:**
```json
{
  "customerIds": ["uuid1", "uuid2"],
  "coupon": {
    "type": "discount",
    "value": 10,
    "expiredDays": 30
  }
}
```

---

## 数据报表

### 日报

```
GET /reports/daily?date=2025-02-20
```

**响应:**
```json
{
  "date": "2025-02-20",
  "totalRevenue": 1580,
  "orderCount": 12,
  "avgPrice": 131.7,
  "uniqueCustomers": 9,
  "paymentBreakdown": {
    "wechat": {"count": 8, "amount": 850},
    "alipay": {"count": 3, "amount": 480},
    "cash": {"count": 1, "amount": 250}
  },
  "serviceStats": [
    {"name": "洗澡", "count": 10, "revenue": 680},
    {"name": "精剪", "count": 3, "revenue": 450}
  ]
}
```

### 月报

```
GET /reports/monthly?year=2025&month=2
```

### 客户分析

```
GET /reports/customers
```

### 服务排行

```
GET /reports/services
```

---

## 公开接口

> 公开接口无需认证，供H5预约页面使用

### 获取商家服务列表

```
GET /public/services/:merchantId
```

### 获取可预约时段

```
GET /public/appointments/slots?merchantId=uuid&serviceId=uuid&date=2025-02-20
```

**响应:**
```json
[
  {"time": "09:00", "available": true},
  {"time": "10:00", "available": false},
  {"time": "11:00", "available": true}
]
```

### 创建预约（H5）

```
POST /public/appointments
```

**请求体:**
```json
{
  "merchantId": "uuid",
  "serviceId": "uuid",
  "customerName": "张三",
  "phone": "13800138000",
  "petName": "豆豆",
  "petBreed": "泰迪",
  "appointmentTime": "2025-02-20 14:00",
  "notes": "备注"
}
```

---

## 错误响应

所有错误响应格式：

```json
{
  "statusCode": 400,
  "message": "错误信息",
  "error": "Bad Request"
}
```

### 常见错误码

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 健康检查

```
GET /health
```

**响应:**
```json
{
  "status": "ok",
  "timestamp": "2025-02-20T10:00:00.000Z"
}
```
