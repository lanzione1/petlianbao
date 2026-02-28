# 客户H5扫码预约功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 实现客户扫码直接预约功能，无需注册，扫码即可填写预约

**Architecture:** 
- 客户H5通过URL参数获取商家ID
- 显示商家信息和服务列表
- 客户填写信息提交预约
- 预约成功显示确认页面

**Tech Stack:** Vue3, Vite, 后端API

---

### Task 1: 完善客户H5首页/商家展示页面

**Files:**
- Modify: `apps/customer-h5/src/pages/BookingPage.vue`
- Modify: `apps/customer-h5/src/api/index.ts`

**Step 1: 添加获取商家信息API**

```typescript
// api/index.ts
export const merchantApi = {
  getInfo: (id: string) => fetch(`${API_URL}/public/merchants/${id}`).then(r => r.json()),
  getServices: (id: string) => fetch(`${API_URL}/public/merchants/${id}/services`).then(r => r.json()),
}
```

**Step 2: 修改预约页面显示商家信息**

```vue
<template>
  <div class="booking-page">
    <div class="header" v-if="merchant">
      <h1>{{ merchant.shopName }}</h1>
      <p class="subtitle">{{ merchant.address || '在线预约服务' }}</p>
    </div>
    
    <div class="loading" v-if="loading">加载中...</div>
    
    <div class="error" v-else-if="error">{{ error }}</div>
    
    <div class="form" v-else>
      <!-- 服务选择 -->
      <div class="form-item">
        <label>选择服务</label>
        <div class="service-list" v-if="services.length">
          <div 
            v-for="s in services" 
            :key="s.id" 
            :class="['service-card', { active: form.serviceId === s.id }]"
            @click="selectService(s)"
          >
            <div class="service-name">{{ s.name }}</div>
            <div class="service-info">
              <span class="price">¥{{ s.price }}</span>
              <span class="duration">{{ s.duration }}分钟</span>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无服务</div>
      </div>
      
      <!-- 其他表单项... -->
    </div>
  </div>
</template>
```

---

### Task 2: 添加后端公开API

**Files:**
- Modify: `apps/backend/src/modules/public/public.controller.ts`
- Modify: `apps/backend/src/modules/public/public.service.ts`

**Step 1: 添加获取商家信息API**

```typescript
@Get('merchants/:id')
async getMerchantInfo(@Param('id') id: string) {
  return this.publicService.getMerchantInfo(id);
}

@Get('merchants/:id/services')
async getMerchantServices(@Param('id') id: string) {
  return this.publicService.getMerchantServices(id);
}
```

**Step 2: 添加服务方法**

```typescript
async getMerchantInfo(id: string) {
  const merchant = await this.merchantRepository.findOne({ 
    where: { id } 
  });
  if (!merchant) throw new NotFoundException('商家不存在');
  return {
    id: merchant.id,
    shopName: merchant.shopName,
    address: merchant.address,
    phone: merchant.phone,
  };
}

async getMerchantServices(merchantId: string) {
  return this.serviceRepository.find({ 
    where: { merchantId, active: true },
    order: { createdAt: 'DESC' }
  });
}
```

---

### Task 3: 完善预约提交功能

**Files:**
- Modify: `apps/customer-h5/src/pages/BookingPage.vue`
- Modify: `apps/customer-h5/src/api/index.ts`

**Step 1: 添加预约API**

```typescript
export const appointmentApi = {
  create: (data: any) => fetch(`${API_URL}/public/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
}
```

**Step 2: 完善表单和提交逻辑**

---

### Task 4: 添加预约成功页面

**Files:**
- Modify: `apps/customer-h5/src/pages/SuccessPage.vue`

**Step 1: 显示预约成功信息**

```vue
<template>
  <div class="success-page">
    <div class="success-icon">✓</div>
    <h2>预约成功</h2>
    <div class="info-card">
      <p><strong>宠物：</strong>{{ petName }}</p>
      <p><strong>服务：</strong>{{ serviceName }}</p>
      <p><strong>时间：</strong>{{ date }} {{ time }}</p>
    </div>
    <p class="tip">请按时到店，如有变化请联系商家</p>
  </div>
</template>
```

---

### Task 5: 商家端小程序生成预约二维码

**Files:**
- Create: `apps/merchant-miniapp/pages/qrcode/index.js`
- Create: `apps/merchant-miniapp/pages/qrcode/index.wxml`
- Create: `apps/merchant-miniapp/pages/qrcode/index.wxss`
- Create: `apps/merchant-miniapp/pages/qrcode/index.json`
- Modify: `apps/merchant-miniapp/app.json`

**Step 1: 创建二维码页面**

```javascript
// pages/qrcode/index.js
Page({
  data: {
    qrcodeUrl: ''
  },
  
  onLoad() {
    const merchant = wx.getStorageSync('merchant');
    if (merchant && merchant.id) {
      const url = `https://your-domain.com/?shop=${merchant.id}`;
      this.setData({ qrcodeUrl: url });
    }
  },
  
  copyLink() {
    wx.setClipboardData({
      data: this.data.qrcodeUrl,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'success' });
      }
    });
  }
});
```

---

### Task 6: 测试验证

**Step 1: 测试后端API**

```bash
# 测试获取商家信息
curl http://localhost:3000/api/v1/public/merchants/00000000-0000-0000-0000-000000000001

# 测试获取服务列表
curl http://localhost:3000/api/v1/public/merchants/00000000-0000-0000-0000-000000000001/services

# 测试创建预约
curl -X POST http://localhost:3000/api/v1/public/appointments \
  -H "Content-Type: application/json" \
  -d '{"merchantId":"xxx","serviceId":"xxx","customerName":"张三","phone":"13800138000","petName":"小白","appointmentTime":"2026-02-24 10:00"}'
```

**Step 2: 测试H5**

- 访问 http://localhost:5173/?shop=商家ID
- 选择服务
- 填写信息
- 提交预约
- 验证成功页面

---

**Plan complete. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
