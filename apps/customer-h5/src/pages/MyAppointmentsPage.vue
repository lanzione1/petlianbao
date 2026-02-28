<template>
  <div class="my-appointments-page">
    <!-- 未登录状态 -->
    <div v-if="!userStore.isLoggedIn" class="login-section">
      <div class="header">
        <h1>我的预约</h1>
        <p class="subtitle">请先登录查看预约</p>
      </div>
      <div class="login-form">
        <button class="login-btn primary" @click="goToAuth">
          微信授权登录
        </button>
        
        <div class="dev-divider">或</div>
        
        <div class="dev-login">
          <p class="dev-title">🚀 开发模式</p>
          <div class="dev-inputs">
            <input type="text" v-model="devMerchantId" placeholder="商家ID" />
            <input type="text" v-model="devOpenid" placeholder="OpenID（任意）" />
          </div>
          <button class="dev-btn" @click="devLogin" :disabled="devLoginLoading">
            {{ devLoginLoading ? '登录中...' : '开发登录' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 已登录状态 -->
    <div v-else class="appointments-section">
      <div class="header">
        <h1>我的预约</h1>
        <div class="user-info">
          <span>{{ userStore.customer?.nickname || '用户' }}</span>
          <span v-if="userStore.customer?.isNewCustomer" class="new-badge">新客户</span>
          <button class="logout-btn" @click="logout">退出</button>
        </div>
      </div>

      <!-- 欢迎提示 -->
      <div v-if="userStore.customer?.isNewCustomer" class="welcome-banner new">
        <p>🎉 欢迎您首次使用在线预约！</p>
      </div>
      <div v-else-if="appointments.length > 0" class="welcome-banner">
        <p>🐾 欢迎回来！您有 {{ appointments.length }} 条预约记录</p>
      </div>

      <!-- 标签页 -->
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          :class="['tab', { active: currentTab === tab.key }]"
          @click="currentTab = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.count" class="badge">{{ tab.count }}</span>
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">加载中...</div>

      <!-- 预约列表 -->
      <div v-else-if="filteredAppointments.length" class="appointments-list">
        <div 
          v-for="apt in filteredAppointments" 
          :key="apt.id"
          class="appointment-card"
          @click="viewDetail(apt.id)"
        >
          <div class="card-header">
            <span class="shop-name">{{ apt.merchant?.shopName || '商家' }}</span>
            <span :class="['status', getStatusClass(apt.status)]">{{ getStatusText(apt.status) }}</span>
          </div>

          <div class="card-body">
            <div class="info-row">
              <span class="label">服务：</span>
              <span class="value">{{ apt.service?.name || '未知服务' }}</span>
            </div>
            <div class="info-row">
              <span class="label">宠物：</span>
              <span class="value">{{ apt.h5Pet?.name || apt.h5Customer?.nickname || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">时间：</span>
              <span class="value">{{ formatTime(apt.appointmentTime) }}</span>
            </div>
            <div class="info-row" v-if="apt.proposedTime && apt.status === 'reschedule'">
              <span class="label">改期：</span>
              <span class="value highlight">{{ formatTime(apt.proposedTime) }}</span>
            </div>
            <div v-if="apt.notes" class="info-row">
              <span class="label">备注：</span>
              <span class="value">{{ apt.notes }}</span>
            </div>
          </div>

          <div class="card-footer" v-if="canOperate(apt.status)">
            <button class="action-btn" @click.stop="handleReschedule(apt)">改期</button>
            <button class="cancel-btn" @click.stop="handleCancel(apt)">取消</button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📅</div>
        <p>{{ emptyText }}</p>
        <button class="new-btn" @click="goToBooking">新建预约</button>
      </div>
    </div>

    <!-- 改期弹窗 -->
    <div v-if="showReschedule" class="modal" @click="showReschedule = false">
      <div class="modal-content" @click.stop>
        <h3>选择新时间</h3>
        <div class="form-item">
          <label>新预约时间</label>
          <input type="datetime-local" v-model="newTime" />
        </div>
        <div class="form-item">
          <label>改期原因（选填）</label>
          <textarea v-model="rescheduleNotes" placeholder="请输入改期原因"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showReschedule = false">取消</button>
          <button class="btn-primary" @click="submitReschedule" :disabled="!newTime || submitting">
            {{ submitting ? '提交中...' : '确认改期' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 取消弹窗 -->
    <div v-if="showCancel" class="modal" @click="showCancel = false">
      <div class="modal-content" @click.stop>
        <h3>取消预约</h3>
        <p class="modal-subtitle">确定要取消这个预约吗？</p>
        <div class="form-item">
          <label>取消原因（选填）</label>
          <textarea v-model="cancelReason" placeholder="请输入取消原因"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showCancel = false">不取消</button>
          <button class="btn-danger" @click="submitCancel" :disabled="submitting">
            {{ submitting ? '取消中...' : '确认取消' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import api from '../api'

const router = useRouter()
const userStore = useUserStore()

const currentTab = ref('pending')
const appointments = ref<any[]>([])
const loading = ref(false)
const submitting = ref(false)

const showReschedule = ref(false)
const showCancel = ref(false)
const selectedAppointment = ref<any>(null)
const newTime = ref('')
const rescheduleNotes = ref('')
const cancelReason = ref('')
const devMerchantId = ref('')
const devOpenid = ref('')
const devLoginLoading = ref(false)

const tabs = computed(() => [
  { key: 'pending', label: '待处理', count: appointments.value.filter(a => ['pending', 'confirmed', 'reschedule'].includes(a.status)).length },
  { key: 'completed', label: '已完成', count: appointments.value.filter(a => ['completed', 'paid'].includes(a.status)).length },
  { key: 'cancelled', label: '已取消', count: appointments.value.filter(a => ['cancelled_by_customer', 'cancelled_by_merchant'].includes(a.status)).length },
])

const filteredAppointments = computed(() => {
  if (currentTab.value === 'pending') {
    return appointments.value.filter(a => ['pending', 'confirmed', 'reschedule'].includes(a.status))
  } else if (currentTab.value === 'completed') {
    return appointments.value.filter(a => ['completed', 'paid'].includes(a.status))
  } else {
    return appointments.value.filter(a => ['cancelled_by_customer', 'cancelled_by_merchant'].includes(a.status))
  }
})

const emptyText = computed(() => {
  if (currentTab.value === 'pending') return '暂无待处理预约'
  if (currentTab.value === 'completed') return '暂无完成记录'
  return '暂无取消记录'
})

onMounted(async () => {
  console.log('MyAppointmentsPage mounted, isLoggedIn:', userStore.isLoggedIn)
  console.log('Token:', localStorage.getItem('h5_token')?.substring(0, 20) + '...')
  console.log('Customer:', localStorage.getItem('h5_customer'))
  if (userStore.isLoggedIn) {
    await loadAppointments()
  }
})

async function loadAppointments() {
  loading.value = true
  try {
    const { data } = await api.get('/h5/appointments')
    appointments.value = data.data || []
  } catch (e) {
    console.error('Load appointments failed:', e)
  } finally {
    loading.value = false
  }
}

function goToAuth() {
  router.push('/auth')
}

function goToBooking() {
  // 从当前登录的客户信息中获取商家ID
  const merchantId = userStore.customer?.merchantId
  if (!merchantId) {
    alert('无法获取商家信息，请重新登录')
    return
  }
  router.push(`/booking?shop=${merchantId}`)
}

async function devLogin() {
  if (!devMerchantId.value || !devOpenid.value) {
    alert('请输入商家ID和OpenID')
    return
  }

  devLoginLoading.value = true
  try {
    const { data } = await api.post('/h5/auth/dev/login', {
      merchantId: devMerchantId.value,
      openid: devOpenid.value,
    })

    if (data.success) {
      userStore.setToken(data.data.token)
      userStore.setCustomer(data.data.customer)
      await loadAppointments()
    }
  } catch (e: any) {
    alert(e.response?.data?.message || '登录失败')
  } finally {
    devLoginLoading.value = false
  }
}

function logout() {
  userStore.logout()
  appointments.value = []
}

function viewDetail(id: string) {
  router.push(`/appointment/${id}`)
}

function getStatusClass(status: string) {
  const map: Record<string, string> = {
    pending: 'pending',
    confirmed: 'confirmed',
    reschedule: 'reschedule',
    in_service: 'in-service',
    completed: 'completed',
    paid: 'completed',
    cancelled_by_customer: 'cancelled',
    cancelled_by_merchant: 'cancelled',
  }
  return map[status] || status
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    reschedule: '待改期',
    in_service: '服务中',
    completed: '已完成',
    paid: '已支付',
    cancelled_by_customer: '已取消',
    cancelled_by_merchant: '商家取消',
  }
  return map[status] || status
}

function formatTime(time: string | Date) {
  if (!time) return '-'
  const d = new Date(time)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function canOperate(status: string) {
  return ['pending', 'confirmed', 'reschedule'].includes(status)
}

function handleReschedule(apt: any) {
  selectedAppointment.value = apt
  newTime.value = ''
  rescheduleNotes.value = ''
  showReschedule.value = true
}

function handleCancel(apt: any) {
  selectedAppointment.value = apt
  cancelReason.value = ''
  showCancel.value = true
}

async function submitReschedule() {
  if (!newTime.value || submitting.value) return

  submitting.value = true
  try {
    const { data } = await api.put(`/h5/appointments/${selectedAppointment.value.id}/reschedule`, {
      proposedTime: new Date(newTime.value).toISOString(),
      notes: rescheduleNotes.value,
    })
    showReschedule.value = false
    await loadAppointments()
  } catch (e: any) {
    alert(e.response?.data?.message || '改期失败')
  } finally {
    submitting.value = false
  }
}

async function submitCancel() {
  if (submitting.value) return

  submitting.value = true
  try {
    const { data } = await api.put(`/h5/appointments/${selectedAppointment.value.id}/cancel`, {
      reason: cancelReason.value,
    })
    showCancel.value = false
    await loadAppointments()
  } catch (e: any) {
    alert(e.response?.data?.message || '取消失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.my-appointments-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

.login-section {
  background: white;
  min-height: 100vh;
}

.header {
  padding: 40px 20px 20px;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header h1 {
  margin: 0 0 8px;
  font-size: 28px;
}

.subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
  font-size: 14px;
}

.logout-btn {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  font-size: 12px;
  cursor: pointer;
}

.new-badge {
  background: #ff6b6b;
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
}

.welcome-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  margin: 12px 16px;
  border-radius: 8px;
  text-align: center;
}

.welcome-banner.new {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.welcome-banner p {
  margin: 0;
  font-size: 14px;
}

.login-form {
  padding: 30px 20px;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.login-btn.primary {
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.dev-divider {
  margin: 20px 0;
  color: #999;
  font-size: 14px;
}

.dev-login {
  background: #f8f9ff;
  padding: 20px;
  border-radius: 12px;
  text-align: left;
}

.dev-title {
  font-size: 14px;
  font-weight: 500;
  color: #667eea;
  margin-bottom: 12px;
}

.dev-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.dev-inputs input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.dev-btn {
  width: 100%;
  padding: 10px;
  background: white;
  border: 1px solid #667eea;
  border-radius: 8px;
  color: #667eea;
  font-size: 14px;
  cursor: pointer;
}

.dev-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #eee;
}

.tab {
  flex: 1;
  padding: 14px;
  border: none;
  background: none;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  position: relative;
}

.tab.active {
  color: #667eea;
  font-weight: 500;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: #667eea;
}

.badge {
  display: inline-block;
  margin-left: 4px;
  padding: 2px 6px;
  background: #ff4d4f;
  color: white;
  font-size: 11px;
  border-radius: 10px;
}

.loading, .empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.new-btn {
  margin-top: 16px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.appointments-list {
  padding: 12px;
}

.appointment-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.2s;
}

.appointment-card:active {
  transform: scale(0.98);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.shop-name {
  font-weight: 500;
  font-size: 16px;
  color: #333;
}

.status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status.pending {
  background: #e6f7ff;
  color: #1890ff;
}

.status.confirmed {
  background: #f6ffed;
  color: #52c41a;
}

.status.reschedule {
  background: #fff7e6;
  color: #fa8c16;
}

.status.in-service {
  background: #e6f7ff;
  color: #1890ff;
}

.status.completed {
  background: #f6ffed;
  color: #52c41a;
}

.status.cancelled {
  background: #fff1f0;
  color: #ff4d4f;
}

.card-body {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-row .label {
  color: #999;
  min-width: 50px;
}

.info-row .value {
  color: #333;
  flex: 1;
}

.info-row .highlight {
  color: #fa8c16;
  font-weight: 500;
}

.card-footer {
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.action-btn {
  padding: 6px 16px;
  background: white;
  border: 1px solid #667eea;
  border-radius: 6px;
  color: #667eea;
  font-size: 13px;
  cursor: pointer;
}

.cancel-btn {
  padding: 6px 16px;
  background: white;
  border: 1px solid #ff4d4f;
  border-radius: 6px;
  color: #ff4d4f;
  font-size: 13px;
  cursor: pointer;
}

/* Modal */
.modal {
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
}

.modal-content h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #333;
}

.modal-subtitle {
  margin: 0 0 20px;
  font-size: 13px;
  color: #999;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-item input,
.form-item textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-item textarea {
  min-height: 80px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.modal-actions button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  background: #ff4d4f;
  color: white;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>