# 商家注册功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 实现商家端小程序注册功能，支持微信授权登录和店铺信息填写

**Architecture:** 
- 后端：NestJS，新增商家注册API
- 小程序：微信授权登录 + 注册页面

**Tech Stack:** 微信小程序, NestJS, TypeORM

---

### Task 1: 完善商家实体和数据库字段

**Files:**
- Modify: `apps/backend/src/modules/merchant/merchant.entity.ts`

**Step 1: 添加详细地址字段**

```typescript
// 在 merchant.entity.ts 中添加
@Column({ name: 'detailed_address', length: 200, nullable: true })
detailedAddress: string;
```

**Step 2: 添加状态字段（可选，用于后续扩展审核功能）**

```typescript
@Column({ name: 'status', length: 20, default: 'active' })
status: string;
```

---

### Task 2: 创建商家注册API

**Files:**
- Modify: `apps/backend/src/modules/merchant/merchant.controller.ts`
- Modify: `apps/backend/src/modules/merchant/merchant.service.ts`
- Modify: `apps/backend/src/modules/merchant/merchant.module.ts`

**Step 1: 在 MerchantController 中添加注册路由**

```typescript
@Post('register')
async register(@Body() dto: {
  openid: string;
  shopName: string;
  ownerName: string;
  phone: string;
  address?: string;
  detailedAddress?: string;
}) {
  return this.merchantService.register(dto);
}
```

**Step 2: 在 MerchantService 中添加注册方法**

```typescript
async register(data: {
  openid: string;
  shopName: string;
  ownerName: string;
  phone: string;
  address?: string;
  detailedAddress?: string;
}) {
  // 检查openid是否已存在
  const existing = await this.merchantsRepository.findOne({
    where: { openid: data.openid }
  });
  
  if (existing) {
    // 已存在则返回商家信息（支持多次登录）
    return existing;
  }
  
  // 创建新商家
  const merchant = this.merchantsRepository.create({
    openid: data.openid,
    shopName: data.shopName,
    ownerName: data.ownerName,
    phone: data.phone,
    address: data.address || '',
    detailedAddress: data.detailedAddress || '',
    planType: 'free',
    status: 'active',
  });
  
  return this.merchantsRepository.save(merchant);
}
```

**Step 3: 在 MerchantModule 中添加对应DTO**

---

### Task 3: 创建小程序注册页面

**Files:**
- Create: `apps/merchant-miniapp/pages/auth/register.js`
- Create: `apps/merchant-miniapp/pages/auth/register.json`
- Create: `apps/merchant-miniapp/pages/auth/register.wxml`
- Create: `apps/merchant-miniapp/pages/auth/register.wxss`
- Modify: `apps/merchant-miniapp/app.json`

**Step 1: 创建注册页面 WXML**

```html
<view class="container">
  <view class="header">
    <text class="title">商家入驻</text>
    <text class="subtitle">填写店铺信息开始经营</text>
  </view>

  <form bindsubmit="submitForm">
    <view class="form-group">
      <text class="label">店铺名称 *</text>
      <input name="shopName" placeholder="请输入店铺名称" />
    </view>

    <view class="form-group">
      <text class="label">店主姓名 *</text>
      <input name="ownerName" placeholder="请输入店主姓名" />
    </view>

    <view class="form-group">
      <text class="label">手机号 *</text>
      <input name="phone" type="number" maxlength="11" placeholder="请输入手机号" />
    </view>

    <view class="form-group">
      <text class="label">所在地区</text>
      <picker mode="region" bindchange="onRegionChange">
        <view class="picker">
          {{region[0]}} {{region[1]}} {{region[2]}}
        </view>
      </picker>
    </view>

    <view class="form-group">
      <text class="label">详细地址</text>
      <input name="detailedAddress" placeholder="请输入详细地址" />
    </view>

    <button class="btn-submit" form-type="submit">提交注册</button>
  </form>
</view>
```

**Step 2: 创建注册页面 JS**

```javascript
const app = getApp();
const api = require('../../utils/api.js');

Page({
  data: {
    region: ['请选择省', '市', '区'],
    openid: ''
  },

  onLoad() {
    // 获取微信登录code
    this.loginWechat();
  },

  loginWechat() {
    wx.login({
      success: res => {
        // 调用后端获取openid（需要先实现）
        this.setData({ wxCode: res.code });
      }
    });
  },

  onRegionChange(e) {
    this.setData({ region: e.detail.value });
  },

  submitForm(e) {
    const { shopName, ownerName, phone, detailedAddress } = e.detail.value;
    
    if (!shopName || !ownerName || !phone) {
      wx.showToast({ title: '请填写必填项', icon: 'none' });
      return;
    }

    if (!this.data.openid) {
      wx.showToast({ title: '请先授权微信', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中...' });

    wx.request({
      url: api.API_URL + '/merchants/register',
      method: 'POST',
      data: {
        openid: this.data.openid,
        shopName,
        ownerName,
        phone,
        address: this.data.region.join(''),
        detailedAddress
      },
      success: res => {
        wx.hideLoading();
        if (res.data.id) {
          // 保存商家信息到本地存储
          wx.setStorageSync('merchant', res.data);
          wx.showToast({ title: '注册成功', icon: 'success' });
          // 跳转到首页
          wx.switchTab({ url: '/pages/index/index' });
        } else {
          wx.showToast({ title: '注册失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  }
});
```

**Step 3: 创建注册页面 WXSS**

```css
.container {
  padding: 40rpx;
  background: #fff;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #999;
  margin-top: 16rpx;
}

.form-group {
  margin-bottom: 32rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.label::after {
  content: ' *';
  color: #ff4d4f;
}

input, .picker {
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  border: 1rpx solid #d9d9d9;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.btn-submit {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  margin-top: 60rpx;
}
```

**Step 4: 修改 app.json 添加注册页面**

```json
{
  "pages": [
    "pages/auth/register",
    "pages/index/index",
    ...
  ]
}
```

---

### Task 4: 添加微信登录获取openid的API

**Files:**
- Modify: `apps/backend/src/modules/merchant/merchant.controller.ts`
- Modify: `apps/backend/src/modules/merchant/merchant.service.ts`

**Step 1: 添加微信登录API**

```typescript
@Get('wechat/login')
async wechatLogin(@Query('code') code: string) {
  return this.merchantService.getWechatOpenid(code);
}
```

**Step 2: 添加获取openid的方法**

```typescript
async getWechatOpenid(code: string) {
  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;
  
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.openid) {
    return { openid: data.openid };
  } else {
    throw new Error('获取openid失败');
  }
}
```

---

### Task 5: 修改小程序启动逻辑

**Files:**
- Modify: `apps/merchant-miniapp/app.js`

**Step 1: 修改 app.js 判断是否已注册**

```javascript
App({
  onLaunch() {
    const merchant = wx.getStorageSync('merchant');
    if (!merchant || !merchant.id) {
      // 未注册，跳转到注册页面
      wx.redirectTo({ url: '/pages/auth/register' });
    } else {
      // 已注册，跳转到首页
      wx.switchTab({ url: '/pages/index/index' });
    }
  }
});
```

---

### Task 6: 测试验证

**Step 1: 测试后端API**

```bash
# 测试注册接口（需要真实微信code）
curl -X POST http://localhost:3000/api/v1/merchants/register \
  -H "Content-Type: application/json" \
  -d '{"openid":"test_openid_123","shopName":"测试店铺","ownerName":"张三","phone":"13800138000"}'
```

**Step 2: 测试小程序**

- 使用微信开发者工具打开 merchant-miniapp
- 点击注册页面
- 授权微信登录
- 填写店铺信息
- 提交注册
- 验证跳转首页

---

**Plan complete. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
