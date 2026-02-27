<template>
  <div class="detail-container">
    <div class="page-header">
      <button class="btn btn-sm" @click="$router.back()">返回</button>
      <h3 class="page-title">商家详情</h3>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    
    <template v-else-if="merchant">
      <div class="detail-card">
        <div class="card-header">
          <h4>套餐信息</h4>
        </div>
        <div class="plan-section">
          <div class="current-plan">
            <label>当前套餐</label>
            <span :class="['plan-badge', 'plan-' + merchant.planType]">{{ getPlanName(merchant.planType) }}</span>
          </div>
          <div class="plan-expire" v-if="merchant.planExpiredAt">
            <label>到期时间</label>
            <span>{{ formatDateTime(merchant.planExpiredAt) }}</span>
          </div>
          <div class="plan-change">
            <label>更改套餐</label>
            <div class="plan-options">
              <button 
                v-for="plan in planOptions" 
                :key="plan.value"
                :class="['plan-btn', { active: selectedPlan === plan.value }]"
                @click="selectedPlan = plan.value"
              >
                {{ plan.label }}
              </button>
            </div>
            <div class="plan-date" v-if="selectedPlan && selectedPlan !== 'free' && selectedPlan !== 'banned'">
              <label>到期日期</label>
              <input type="date" v-model="planExpiredAt" />
            </div>
            <button 
              class="btn btn-primary" 
              @click="handleUpdatePlan"
              :disabled="selectedPlan === merchant.planType"
            >
              确认更改
            </button>
          </div>
        </div>
      </div>

      <div class="detail-card">
        <div class="card-header">
          <h4>基本信息</h4>
          <span :class="['status-badge', merchant.planType === 'banned' ? 'status-banned' : 'status-active']">
            {{ merchant.planType === 'banned' ? '已禁用' : '正常' }}
          </span>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <label>店铺名称</label>
            <span>{{ merchant.shopName }}</span>
          </div>
          <div class="info-item">
            <label>店主姓名</label>
            <span>{{ merchant.ownerName || '-' }}</span>
          </div>
          <div class="info-item">
            <label>联系电话</label>
            <span>{{ merchant.phone || '-' }}</span>
          </div>
          <div class="info-item">
            <label>联系邮箱</label>
            <span>{{ merchant.email || '-' }}</span>
          </div>
          <div class="info-item">
            <label>店铺地址</label>
            <span>{{ merchant.address || '-' }}</span>
          </div>
          <div class="info-item">
            <label>营业执照</label>
            <span>{{ merchant.businessLicense || '-' }}</span>
          </div>
          <div class="info-item">
            <label>套餐类型</label>
            <span>{{ getPlanName(merchant.planType) }}</span>
          </div>
          <div class="info-item">
            <label>注册时间</label>
            <span>{{ formatDate(merchant.createdAt) }}</span>
          </div>
          <div class="info-item">
            <label>OpenID</label>
            <span class="mono">{{ merchant.openid || '-' }}</span>
          </div>
        </div>
      </div>

      <div class="detail-card">
        <div class="card-header">
          <h4>业务统计</h4>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ stats.customers?.total || 0 }}</div>
            <div class="stat-label">客户总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.customers?.active || 0 }}</div>
            <div class="stat-label">活跃客户</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.appointments?.total || 0 }}</div>
            <div class="stat-label">预约总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.appointments?.pending || 0 }}</div>
            <div class="stat-label">待处理预约</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.transactions?.total || 0 }}</div>
            <div class="stat-label">订单总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value highlight">{{ formatMoney(stats.revenue?.total) }}</div>
            <div class="stat-label">累计收入</div>
          </div>
          <div class="stat-item">
            <div class="stat-value highlight">{{ formatMoney(stats.revenue?.monthly) }}</div>
            <div class="stat-label">本月收入</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.services?.total || 0 }}</div>
            <div class="stat-label">服务数量</div>
          </div>
        </div>
      </div>

      <div class="detail-card">
        <div class="card-header">
          <h4>最近预约</h4>
        </div>
        <table v-if="recentAppointments.length > 0">
          <thead>
            <tr>
              <th>客户</th>
              <th>服务</th>
              <th>时间</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="apt in recentAppointments" :key="apt.id">
              <td>{{ apt.customerName || '-' }}</td>
              <td>{{ apt.serviceName || '-' }}</td>
              <td>{{ formatDateTime(apt.appointmentTime) }}</td>
              <td>
                <span :class="['status-badge', 'status-' + apt.status]">
                  {{ getStatusName(apt.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">暂无预约记录</div>
      </div>

      <div class="detail-card">
        <div class="card-header">
          <h4>最近订单</h4>
        </div>
        <table v-if="recentBillings.length > 0">
          <thead>
            <tr>
              <th>客户</th>
              <th>金额</th>
              <th>类型</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bill in recentBillings" :key="bill.id">
              <td>{{ bill.customerName || '-' }}</td>
              <td class="highlight">{{ formatMoney(bill.totalAmount) }}</td>
              <td>{{ bill.billingType === 'service' ? '服务' : '商品' }}</td>
              <td>{{ formatDateTime(bill.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">暂无订单记录</div>
      </div>

      <div class="action-bar">
        <button 
          v-if="merchant.planType !== 'banned'"
          class="btn btn-danger"
          @click="handleBan"
        >
          禁用商家
        </button>
        <button 
          v-else
          class="btn btn-success"
          @click="handleUnban"
        >
          解禁商家
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminApi } from '@/api'

const route = useRoute()
const router = useRouter()

const merchant = ref<any>(null)
const stats = ref<any>({})
const recentAppointments = ref<any[]>([])
const recentBillings = ref<any[]>([])
const loading = ref(true)
const selectedPlan = ref('')
const planExpiredAt = ref('')

const planOptions = [
  { value: 'free', label: '免费版' },
  { value: 'basic', label: '基础版' },
  { value: 'professional', label: '专业版' },
  { value: 'enterprise', label: '企业版' },
]

onMounted(() => {
  loadDetail()
})

async function loadDetail() {
  loading.value = true
  try {
    const res = await adminApi.getMerchant(route.params.id as string) as any
    merchant.value = res.merchant
    stats.value = res.stats || {}
    recentAppointments.value = res.recentAppointments || []
    recentBillings.value = res.recentTransactions || []
    selectedPlan.value = res.merchant.planType
  } catch (e) {
    console.error('加载商家详情失败', e)
    alert('加载失败')
    router.back()
  } finally {
    loading.value = false
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN')
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}

function formatMoney(amount: number) {
  if (!amount) return '0.00'
  return (amount / 100).toFixed(2)
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

function getStatusName(status: string) {
  const statuses: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statuses[status] || status
}

async function handleBan() {
  const reason = prompt('请输入禁用原因')
  if (!reason) return
  
  try {
    await adminApi.banMerchant(merchant.value.id, reason)
    merchant.value.planType = 'banned'
  } catch (e) {
    alert('操作失败')
  }
}

async function handleUnban() {
  if (!confirm('确定要解禁该商家吗？')) return
  
  try {
    await adminApi.unbanMerchant(merchant.value.id)
    merchant.value.planType = 'free'
    selectedPlan.value = 'free'
  } catch (e) {
    alert('操作失败')
  }
}

async function handleUpdatePlan() {
  if (!selectedPlan.value) return
  
  try {
    await adminApi.updateMerchantPlan(
      merchant.value.id, 
      selectedPlan.value, 
      planExpiredAt.value || undefined
    )
    merchant.value.planType = selectedPlan.value
    if (planExpiredAt.value) {
      merchant.value.planExpiredAt = planExpiredAt.value
    }
    alert('套餐更新成功')
  } catch (e) {
    alert('操作失败')
  }
}
</script>

<style scoped>
.detail-container {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 18px;
}

.detail-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.card-header h4 {
  margin: 0;
  font-size: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 12px;
  color: #666;
}

.info-item span {
  font-size: 14px;
}

.info-item .mono {
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.stat-value.highlight {
  color: #52c41a;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  font-weight: 500;
  color: #666;
  font-size: 13px;
}

td.highlight {
  color: #52c41a;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.status-active {
  background: #e6f7e6;
  color: #52c41a;
}

.status-banned {
  background: #fff1f0;
  color: #ff4d4f;
}

.status-pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status-confirmed {
  background: #e6f7ff;
  color: #1890ff;
}

.status-completed {
  background: #f6ffed;
  color: #52c41a;
}

.status-cancelled {
  background: #f5f5f5;
  color: #999;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty {
  text-align: center;
  padding: 20px;
  color: #999;
}

.action-bar {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.plan-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.current-plan, .plan-expire {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-plan label, .plan-expire label, .plan-change > label {
  font-size: 12px;
  color: #666;
  width: 80px;
}

.plan-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.plan-free { background: #f5f5f5; color: #666; }
.plan-basic { background: #e6f7ff; color: #1890ff; }
.plan-professional { background: #f6ffed; color: #52c41a; }
.plan-enterprise { background: #fff7e6; color: #fa8c16; }
.plan-banned { background: #fff1f0; color: #ff4d4f; }

.plan-change {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.plan-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.plan-btn {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.plan-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.plan-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.plan-date {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plan-date input {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}
</style>
