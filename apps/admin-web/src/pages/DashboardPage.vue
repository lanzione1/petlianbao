<template>
  <div class="dashboard-page">
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
