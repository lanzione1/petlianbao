# 客户管理页面重新设计实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 重新设计客户管理前端页面，以客户（人）为中心，宠物档案内嵌在客户流程中

**Architecture:** 修改小程序客户列表、详情、编辑页面；调整后端API返回宠物数据

**Tech Stack:** 微信小程序、NestJS、TypeORM

---

## Task 1: 修改后端 - 客户列表API增加宠物数量

**Files:**
- Modify: `apps/backend/src/modules/customer/customers.service.ts`
- Modify: `apps/backend/src/modules/customer/customers.controller.ts`

**Step 1: 修改 customers.service.ts findAll 方法**

在返回客户数据时，查询每个客户的宠物数量：

```typescript
async findAll(merchantId: string, query: { search?: string; filter?: string }): Promise<Customer[]> {
  const qb = this.customersRepository.createQueryBuilder('customer')
    .where('customer.merchantId = :merchantId', { merchantId });

  if (query.search) {
    qb.andWhere('(customer.petName LIKE :search OR customer.phone LIKE :search)', { search: `%${query.search}%` });
  }

  const customers = await qb.orderBy('customer.createdAt', 'DESC').getMany();

  // 查询每个客户的宠物数量
  const petRepo = this.dataSource.getRepository(Pet);
  for (const customer of customers) {
    const petCount = await petRepo.count({ where: { customerId: customer.id } });
    (customer as any).petCount = petCount;
  }

  return customers;
}
```

**Step 2: 修改 customers.controller.ts findAll**

确保返回宠物数量字段

**Step 3: 编译检查**

```bash
cd apps/backend && pnpm typecheck
```

---

## Task 2: 修改后端 - 客户详情API返回宠物列表

**Files:**
- Modify: `apps/backend/src/modules/customer/customers.service.ts`

**Step 1: 修改 findOne 方法**

```typescript
async findOne(merchantId: string, id: string): Promise<Customer> {
  const customer = await this.customersRepository.findOne({ 
    where: { id, merchantId } 
  });
  
  if (!customer) {
    throw new NotFoundException('客户不存在');
  }

  // 查询关联的宠物列表
  const petRepo = this.dataSource.getRepository(Pet);
  const pets = await petRepo.find({ where: { customerId: id } });
  
  return { ...customer, pets };
}
```

**Step 2: 编译检查**

```bash
cd apps/backend && pnpm typecheck
```

---

## Task 3: 小程序 - 客户列表页改版

**Files:**
- Modify: `apps/merchant-miniapp/pages/customer/list.wxml`
- Modify: `apps/merchant-miniapp/pages/customer/list.js`
- Modify: `apps/merchant-miniapp/pages/customer/list.wxss`

**Step 1: 修改 list.wxml**

```xml
<view class="search-bar">
  <input 
    type="text" 
    placeholder="搜索客户姓名/手机号" 
    value="{{searchText}}"
    bindinput="onSearch"
    confirm-type="search"
  />
</view>

<scroll-view scroll-y class="customer-list">
  <block wx:for="{{customers}}" wx:key="id">
    <view class="customer-card" bindtap="goDetail" data-id="{{item.id}}">
      <view class="card-header">
        <text class="customer-name">{{item.petName || '未设置姓名'}}</text>
        <text class="phone">{{item.phone || '无电话'}}</text>
      </view>
      <view class="card-body">
        <view class="pet-info">
          <text class="pet-count">{{item.petCount || 0}}只宠物</text>
        </view>
        <view class="stats">
          <text class="total-spent">¥{{item.totalSpent || 0}}</text>
          <text class="visit-count">{{item.visitCount || 0}}次</text>
        </view>
      </view>
    </view>
  </block>
</scroll-view>
```

**Step 2: 修改 list.js**

搜索改为按 petName（客户姓名）搜索

**Step 3: 编译测试**

在微信开发者工具中编译

---

## Task 4: 小程序 - 客户详情页改版

**Files:**
- Modify: `apps/merchant-miniapp/pages/customer/detail.wxml`
- Modify: `apps/merchant-miniapp/pages/customer/detail.js`
- Modify: `apps/merchant-miniapp/pages/customer/detail.wxss`

**Step 1: 修改 detail.wxml**

```xml
<view class="container">
  <view class="header">
    <view class="customer-info">
      <text class="customer-name">{{customer.petName || '未设置姓名'}}</text>
      <text class="phone">{{customer.phone || '无电话'}}</text>
    </view>
    <view class="tags">
      <text class="tag" wx:for="{{customer.tags}}" wx:key="*this">{{tagText[item] || item}}</text>
    </view>
  </view>

  <view class="stats">
    <view class="stat-item">
      <text class="stat-value">¥{{customer.totalSpent || 0}}</text>
      <text class="stat-label">累计消费</text>
    </view>
    <view class="stat-item">
      <text class="stat-value">{{customer.visitCount || 0}}</text>
      <text class="stat-label">到店次数</text>
    </view>
    <view class="stat-item">
      <text class="stat-value">{{avgPrice}}</text>
      <text class="stat-label">平均客单价</text>
    </view>
  </view>

  <view class="section" wx:if="{{customer.pets && customer.pets.length > 0}}">
    <view class="section-title">宠物档案 ({{customer.pets.length}}只)</view>
    <scroll-view scroll-x class="pet-scroll">
      <view class="pet-cards">
        <block wx:for="{{customer.pets}}" wx:key="id">
          <view class="pet-card" bindtap="editPet" data-id="{{item.id}}">
            <view class="pet-icon">{{item.species === 'dog' ? '🐕' : item.species === 'cat' ? '🐱' : '🐾'}}</view>
            <view class="pet-info">
              <text class="pet-name">{{item.name}}</text>
              <text class="pet-breed">{{item.breed}}</text>
            </view>
            <view class="pet-badges">
              <text class="badge" wx:if="{{item.nextVaccineDate}}">💉</text>
              <text class="badge" wx:if="{{item.nextDewormDate}}">🐛</text>
            </view>
          </view>
        </block>
      </view>
    </scroll-view>
  </view>

  <view class="section" wx:else>
    <view class="section-title">宠物档案</view>
    <view class="no-pets" bindtap="addPet">
      <text>+ 添加宠物</text>
    </view>
  </view>

  <view class="section">
    <view class="section-title">消费记录</view>
    <view class="history-list">
      <view class="history-item" wx:for="{{history}}" wx:key="id">
        <view class="history-left">
          <text class="history-date">{{formatDate(item.createdAt)}}</text>
          <text class="history-items">{{formatItems(item.items)}}</text>
        </view>
        <text class="history-amount">¥{{item.totalAmount}}</text>
      </view>
      <view class="empty" wx:if="{{history.length === 0}}">
        <text>暂无消费记录</text>
      </view>
    </view>
  </view>

  <view class="actions">
    <button class="btn-primary" bindtap="goBilling">新增消费</button>
    <button class="btn-secondary" bindtap="editCustomer">编辑客户</button>
  </view>
</view>
```

**Step 2: 修改 detail.js**

添加 editPet 和 addPet 方法：

```javascript
editPet(e) {
  const petId = e.currentTarget.dataset.id;
  wx.navigateTo({ url: `/pages/pet/edit?id=${petId}&customerId=${this.data.customerId}` });
},

addPet() {
  wx.navigateTo({ url: `/pages/pet/edit?customerId=${this.data.customerId}` });
},
```

修改 loadCustomer 解析 pets 数组

**Step 3: 编译测试**

---

## Task 5: 小程序 - 客户编辑页增加宠物管理

**Files:**
- Modify: `apps/merchant-miniapp/pages/customer/add.wxml`
- Modify: `apps/merchant-miniapp/pages/customer/add.js`
- Modify: `apps/merchant-miniapp/pages/customer/add.wxss`

**Step 1: 修改 add.wxml**

```xml
<view class="container">
  <view class="form">
    <view class="form-title">客户信息</view>
    <view class="form-item">
      <text class="form-label">姓名 *</text>
      <input class="form-input" placeholder="请输入客户姓名" value="{{form.petName}}" bindinput="onInput" data-field="petName" />
    </view>
    <view class="form-item">
      <text class="form-label">手机号 *</text>
      <input class="form-input" type="number" placeholder="请输入手机号" maxlength="11" value="{{form.phone}}" bindinput="onInput" data-field="phone" />
    </view>
    <view class="form-item">
      <text class="form-label">备注</text>
      <textarea class="form-textarea" placeholder="客户备注" value="{{form.notes}}" bindinput="onInput" data-field="notes" />
    </view>
  </view>

  <view class="form" wx:if="{{form.id}}">
    <view class="form-title">宠物档案 ({{pets.length}}只)</view>
    <block wx:for="{{pets}}" wx:key="id">
      <view class="pet-item">
        <view class="pet-info">
          <text class="pet-icon">{{item.species === 'dog' ? '🐕' : item.species === 'cat' ? '🐱' : '🐾'}}</text>
          <view class="pet-text">
            <text class="pet-name">{{item.name}}</text>
            <text class="pet-breed">{{item.breed}}</text>
          </view>
        </view>
        <view class="pet-actions">
          <text class="edit-btn" bindtap="editPet" data-id="{{item.id}}">编辑</text>
          <text class="delete-btn" bindtap="deletePet" data-id="{{item.id}}">删除</text>
        </view>
      </view>
    </block>
    <view class="add-pet-btn" bindtap="addPet">+ 添加宠物</view>
  </view>

  <view class="actions">
    <button class="btn-submit" bindtap="submit" disabled="{{loading}}">
      {{loading ? '保存中...' : '保存'}}
    </button>
  </view>
</view>
```

**Step 2: 修改 add.js**

```javascript
data: {
  form: {
    id: '',
    petName: '',
    phone: '',
    notes: ''
  },
  pets: [],
  loading: false
},

onLoad(options) {
  if (options.id) {
    this.setData({ 'form.id': options.id });
    this.loadCustomer(options.id);
  }
},

async loadCustomer(id) {
  const data = await api.getCustomer(id);
  const { petName, phone, notes, pets } = data;
  this.setData({ form: { id, petName, phone, notes }, pets: pets || [] });
},

editPet(e) {
  const petId = e.currentTarget.dataset.id;
  wx.navigateTo({ url: `/pages/pet/edit?id=${petId}&customerId=${this.data.form.id}` });
},

addPet() {
  wx.navigateTo({ url: `/pages/pet/edit?customerId=${this.data.form.id}` });
},

async deletePet(e) {
  const petId = e.currentTarget.dataset.id;
  wx.showModal({
    title: '确认删除',
    content: '确定要删除这只宠物吗？',
    success: async (res) => {
      if (res.confirm) {
        await api.deletePet(petId);
        wx.showToast({ title: '已删除' });
        this.loadCustomer(this.data.form.id);
      }
    }
  });
},

async onShow() {
  if (this.data.form.id) {
    this.loadCustomer(this.data.form.id);
  }
},
```

**Step 3: 编译测试**

---

## Task 6: 修改宠物编辑页面返回逻辑

**Files:**
- Modify: `apps/merchant-miniapp/pages/pet/edit.js`

**Step 1: 修改 submit 和 deletePet 方法**

成功保存后返回上一页并刷新：

```javascript
submit() {
  // ... 现有逻辑 ...
  success: () => {
    wx.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 1000);
  },
},

deletePet() {
  // ... 
  success: () => {
    wx.showToast({ title: '已删除', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 1000);
  },
},
```

---

## 执行顺序

1. Task 1: 后端 - 客户列表API增加宠物数量
2. Task 2: 后端 - 客户详情API返回宠物列表
3. Task 3: 小程序 - 客户列表页改版
4. Task 4: 小程序 - 客户详情页改版
5. Task 5: 小程序 - 客户编辑页增加宠物管理
6. Task 6: 修改宠物编辑页面返回逻辑

---

**Plan complete and saved to `docs/plans/2026-02-25-customer-redesign-implementation.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
