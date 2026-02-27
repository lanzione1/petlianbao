# Dashboard仪表盘 & 套餐管理 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 完善后台管理首页仪表盘，实现平台数据大盘功能；新增套餐管理页面

**Architecture:** 
- DashboardPage 调用 adminApi 获取平台统计数据，使用 CSS 实现趋势柱状图
- 新增 PackagesPage 管理系统套餐，支持套餐列表、创建、编辑、删除

**Tech Stack:** Vue3 Composition API, Pinia, adminApi

---

### Task 1: 完善 DashboardPage 仪表盘

**Files:**
- Modify: `apps/admin-web/src/pages/DashboardPage.vue`
- Test: 浏览器访问 http://localhost:5173/dashboard 验证

**Step 1: 重写 DashboardPage.vue 实现平台数据大盘**

```vue
<template>
  <div class="dashboard-page">
    <!-- 核心指标卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.merchants?.total || 0 }}</div>
        <div class="stat-label">总商家数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.customers?.total || 0 }}</div>
        <div class="stat-label">总客户数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value highlight">{{ formatMoney(stats.transactions?.totalRevenue) }}</div>
        <div class="stat-label">累计收入（元）</div>
      </div>
      <div class="stat-card">
        <div class="stat-value highlight">{{ formatMoney(stats.transactions?.monthlyRevenue) }}</div>
        <div class="stat-label">本月收入（元）</div>
      </div>
    </div>

    <!-- 收入趋势图 -->
    <div class="chart-container">
      <div class="chart-header">
        <h4>收入趋势</h4>
        <div class="chart-tabs">
          <button :class="['tab', { active: days === 7 }]" @click="changeDays(7)">近7天</button>
          <button :class="['tab', { active: days === 30 }]" @click="changeDays(30)">近30天</button>
        </div>
      </div>
      <div class="chart-area">
        <div class="y-axis">
          <span>{{ formatMoney(maxRevenue) }}</span>
          <span>{{ formatMoney(maxRevenue / 2) }}</span>
          <span>0</span>
        </div>
        <div class="bars-container">
          <div v-for="(item, index) in trend" :key="index" class="bar-wrapper">
            <div class="bar" :style="{ height: getBarHeight(item.revenue) + '%' }" :title="`${item.date}: ${formatMoney(item.revenue)}元`">
              <span class="bar-tooltip">{{ formatMoney(item.revenue) }}</span>
            </div>
            <span class="bar-label">{{ formatDateShort(item.date) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近入驻商家 -->
    <div class="table-container">
      <h4>最近入驻商家</h4>
      <table v-if="recentMerchants.length > 0">
        <thead>
          <tr>
            <th>店铺名称</th>
            <th>联系电话</th>
            <th>套餐类型</th>
            <th>入驻时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in recentMerchants" :key="m.id">
            <td>{{ m.shopName }}</td>
            <td>{{ m.phone || '-' }}</td>
            <td>
              <span :class="['status-badge', 'plan-' + m.planType]">{{ getPlanName(m.planType) }}</span>
            </td>
            <td>{{ formatDate(m.createdAt) }}</td>
            <td>
              <button class="btn btn-sm" @click="$router.push('/merchants/' + m.id)">详情</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">暂无商家数据</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adminApi } from '@/api'

const stats = ref<any>({})
const trend = ref<any[]>([])
const recentMerchants = ref<any[]>([])
const days = ref(30)

const maxRevenue = computed(() => {
  if (!trend.value.length) return 1
  return Math.max(...trend.value.map(d => d.revenue || 0), 1)
})

onMounted(() => {
  loadStats()
  loadTrend()
  loadRecentMerchants()
})

async function loadStats() {
  try {
    stats.value = await adminApi.getPlatformStats()
  } catch (e) {
    console.error('加载平台统计失败', e)
  }
}

async function loadTrend() {
  try {
    trend.value = await adminApi.getPlatformTrend(days.value)
  } catch (e) {
    console.error('加载趋势数据失败', e)
  }
}

async function loadRecentMerchants() {
  try {
    const res = await adminApi.getMerchants({ page: 1, limit: 5 })
    recentMerchants.value = res.list || []
  } catch (e) {
    console.error('加载商家列表失败', e)
  }
}

function changeDays(d: number) {
  days.value = d
  loadTrend()
}

function formatMoney(amount: number) {
  if (!amount) return '0.00'
  return (amount / 100).toFixed(2)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN')
}

function formatDateShort(date: string) {
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getBarHeight(value: number) {
  if (!maxRevenue.value || !value) return 0
  return (value / maxRevenue.value) * 100
}

function getPlanName(plan: string) {
  const plans: Record<string, string> = {
    free: '免费版',
    basic: '基础版',
    pro: '专业版',
    enterprise: '企业版',
    banned: '已禁用'
  }
  return plans[plan] || plan || '免费版'
}
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #333;
}

.stat-value.highlight {
  color: #52c41a;
}

.stat-label {
  color: #666;
  margin-top: 8px;
  font-size: 14px;
}

.chart-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h4 {
  margin: 0;
}

.chart-tabs {
  display: flex;
  gap: 8px;
}

.tab {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.tab.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.chart-area {
  display: flex;
  height: 200px;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 12px;
  font-size: 12px;
  color: #999;
  width: 60px;
  text-align: right;
}

.bars-container {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}

.bar {
  width: 100%;
  max-width: 30px;
  background: linear-gradient(to top, #52c41a, #95de64);
  border-radius: 4px 4px 0 0;
  min-height: 2px;
  position: relative;
  cursor: pointer;
}

.bar:hover {
  opacity: 0.8;
}

.bar-tooltip {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #666;
  white-space: nowrap;
  display: none;
}

.bar:hover .bar-tooltip {
  display: block;
}

.bar-label {
  font-size: 10px;
  color: #999;
  margin-top: 4px;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.plan-free { background: #f5f5f5; color: #666; }
.plan-basic { background: #e6f7ff; color: #1890ff; }
.plan-pro, .plan-professional { background: #f6ffed; color: #52c41a; }
.plan-enterprise { background: #fff7e6; color: #fa8c16; }
.plan-banned { background: #fff1f0; color: #ff4d4f; }
</style>
```

**Step 2: 验证 Dashboard**

运行: 浏览器访问 http://localhost:5173/dashboard
预期: 
- 显示4个指标卡片（商家数、客户数、累计收入、本月收入）
- 显示收入趋势图（可切换7天/30天）
- 显示最近5个入驻商家

---

### Task 2: 创建套餐管理页面 PackagesPage

**Files:**
- Create: `apps/admin-web/src/pages/PackagesPage.vue`
- Modify: `apps/admin-web/src/router/index.ts` 添加路由
- Modify: `apps/admin-web/src/pages/LayoutPage.vue` 添加菜单项

**Step 1: 创建 PackagesPage.vue**

```vue
<template>
  <div class="packages-page">
    <div class="page-header">
      <h3>套餐管理</h3>
      <button class="btn btn-primary" @click="showModal = true">新建套餐</button>
    </div>

    <div class="packages-grid">
      <div v-for="pkg in packages" :key="pkg.id" class="package-card">
        <div class="package-header">
          <span :class="['package-badge', 'badge-' + pkg.type]">{{ getTypeName(pkg.type) }}</span>
          <span class="package-price">{{ formatMoney(pkg.price) }}/月</span>
        </div>
        <h4 class="package-name">{{ pkg.name }}</h4>
        <p class="package-desc">{{ pkg.description }}</p>
        <ul class="package-features">
          <li v-for="(feature, i) in pkg.features" :key="i">{{ feature }}</li>
        </ul>
        <div class="package-footer">
          <span class="package-status">{{ pkg.status === 'active' ? '在售' : '已下架' }}</span>
          <div class="package-actions">
            <button class="btn btn-sm" @click="editPackage(pkg)">编辑</button>
            <button class="btn btn-sm" :class="pkg.status === 'active' ? 'btn-danger' : 'btn-success'" @click="toggleStatus(pkg)">
              {{ pkg.status === 'active' ? '下架' : '上架' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ editingId ? '编辑套餐' : '新建套餐' }}</h3>
        <form @submit.prevent="savePackage">
          <div class="form-group">
            <label>套餐名称</label>
            <input v-model="form.name" class="form-input" required />
          </div>
          <div class="form-group">
            <label>套餐类型</label>
            <select v-model="form.type" class="form-input" required>
              <option value="free">免费版</option>
              <option value="basic">基础版</option>
              <option value="pro">专业版</option>
              <option value="enterprise">企业版</option>
            </select>
          </div>
          <div class="form-group">
            <label>价格（元/月）</label>
            <input v-model.number="form.price" type="number" class="form-input" required />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="form.description" class="form-input" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>功能特性（每行一个）</label>
            <textarea v-model="form.featuresText" class="form-input" rows="4" placeholder="每行一个功能"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" @click="showModal = false">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const packages = ref<any[]>([])
const showModal = ref(false)
const editingId = ref('')

const form = reactive({
  name: '',
  type: 'basic',
  price: 0,
  description: '',
  featuresText: ''
})

// 模拟套餐数据（实际应调用API）
const defaultPackages = [
  { id: '1', name: '免费版', type: 'free', price: 0, description: '适合个人店主试用', features: ['基础客户管理', '最多50个客户', '基础预约功能'], status: 'active' },
  { id: '2', name: '基础版', type: 'basic', price: 99, description: '适合小型宠物店', features: ['无限客户管理', '套餐管理', '预约管理', '基础统计'], status: 'active' },
  { id: '3', name: '专业版', type: 'pro', price: 299, description: '适合成长型宠物店', features: ['基础版全部功能', '会员营销', '短信通知', '高级统计', '自定义服务'], status: 'active' },
  { id: '4', name: '企业版', type: 'enterprise', price: 999, description: '适合连锁宠物店', features: ['专业版全部功能', '多门店管理', '员工管理', 'API接口', '专属客服'], status: 'active' }
]

onMounted(() => {
  packages.value = defaultPackages
})

function getTypeName(type: string) {
  const names: Record<string, string> = { free: '免费版', basic: '基础版', pro: '专业版', enterprise: '企业版' }
  return names[type] || type
}

function formatMoney(amount: number) {
  return amount ? `¥${amount}` : '免费'
}

function editPackage(pkg: any) {
  editingId.value = pkg.id
  form.name = pkg.name
  form.type = pkg.type
  form.price = pkg.price
  form.description = pkg.description
  form.featuresText = pkg.features.join('\n')
  showModal.value = true
}

function toggleStatus(pkg: any) {
  pkg.status = pkg.status === 'active' ? 'inactive' : 'active'
}

function savePackage() {
  const features = form.featuresText.split('\n').filter(f => f.trim())
  if (editingId.value) {
    const pkg = packages.value.find(p => p.id === editingId.value)
    if (pkg) {
      Object.assign(pkg, { name: form.name, type: form.type, price: form.price, description: form.description, features })
    }
  } else {
    packages.value.push({
      id: Date.now().toString(),
      name: form.name,
      type: form.type,
      price: form.price,
      description: form.description,
      features,
      status: 'active'
    })
  }
  showModal.value = false
  resetForm()
}

function resetForm() {
  editingId.value = ''
  form.name = ''
  form.type = 'basic'
  form.price = 0
  form.description = ''
  form.featuresText = ''
}
</script>

<style scoped>
.packages-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h3 {
  margin: 0;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.package-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.package-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.package-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.badge-free { background: #f5f5f5; color: #666; }
.badge-basic { background: #e6f7ff; color: #1890ff; }
.badge-pro { background: #f6ffed; color: #52c41a; }
.badge-enterprise { background: #fff7e6; color: #fa8c16; }

.package-price {
  font-size: 20px;
  font-weight: 600;
  color: #52c41a;
}

.package-name {
  margin: 0 0 8px;
  font-size: 18px;
}

.package-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
}

.package-features {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
}

.package-features li {
  padding: 6px 0;
  font-size: 14px;
  color: #666;
  border-bottom: 1px solid #f0f0f0;
}

.package-features li:last-child {
  border-bottom: none;
}

.package-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.package-status {
  font-size: 12px;
  color: #52c41a;
}

.package-actions {
  display: flex;
  gap: 8px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
}

.modal h3 {
  margin: 0 0 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #666;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #1890ff;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
```

**Step 2: 添加路由**

修改 `apps/admin-web/src/router/index.ts`:
```ts
// 在 children 数组中添加
{
  path: 'packages',
  name: 'Packages',
  component: () => import('@/pages/PackagesPage.vue'),
},
```

**Step 3: 添加菜单项**

修改 `apps/admin-web/src/pages/LayoutPage.vue` - 在 sidebar-menu 中添加:
```vue
<li 
  :class="{ active: $route.path === '/packages' }"
  @click="$router.push('/packages')"
>
  套餐管理
</li>
```

**Step 4: 验证套餐管理页面**

运行: 浏览器访问 http://localhost:5173/packages
预期:
- 显示4个套餐卡片（免费版、基础版、专业版、企业版）
- 可点击"新建套餐"按钮
- 可编辑、上下架现有套餐

---

**Plan complete. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
