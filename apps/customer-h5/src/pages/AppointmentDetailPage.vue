<template>
  <div class="detail-page">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="appointment">
      <div class="status-card" :class="getStatusClass(appointment.status)">
        <div class="status-text">{{ getStatusText(appointment.status) }}</div>
        <div class="status-desc">{{ getStatusDesc(appointment.status) }}</div>
      </div>

      <div class="info-card">
        <h3>预约信息</h3>
        <div class="info-row">
          <span class="label">服务项目</span>
          <span class="value">{{ appointment.service?.name || '未知服务' }}</span>
        </div>
        <div class="info-row">
          <span class="label">预约时间</span>
          <span class="value">{{ formatTime(appointment.appointmentTime) }}</span>
        </div>
        <div class="info-row" v-if="appointment.proposedTime && appointment.status === 'reschedule'">
          <span class="label">改期时间</span>
          <span class="value highlight">{{ formatTime(appointment.proposedTime) }}</span>
        </div>
        <div class="info-row">
          <span class="label">宠物</span>
          <span class="value">{{ appointment.h5Pet?.name || '未指定' }}</span>
        </div>
        <div class="info-row" v-if="appointment.notes">
          <span class="label">备注</span>
          <span class="value">{{ appointment.notes }}</span>
        </div>
      </div>

      <div class="info-card" v-if="appointment.merchant">
        <h3>商家信息</h3>
        <div class="info-row">
          <span class="label">店名</span>
          <span class="value">{{ appointment.merchant.shopName }}</span>
        </div>
        <div class="info-row" v-if="appointment.merchant.address">
          <span class="label">地址</span>
          <span class="value">{{ appointment.merchant.address }}</span>
        </div>
        <div class="info-row" v-if="appointment.merchant.phone">
          <span class="label">电话</span>
          <span class="value">{{ appointment.merchant.phone }}</span>
        </div>
      </div>

      <div class="info-card" v-if="appointment.history && appointment.history.length">
        <h3>协商记录</h3>
        <div class="history-list">
          <div class="history-item" v-for="h in appointment.history" :key="h.id">
            <div class="history-header">
              <span class="history-action">{{ getActionText(h.action) }}</span>
              <span class="history-time">{{ formatTime(h.createdAt) }}</span>
            </div>
            <div class="history-info" v-if="h.oldTime && h.newTime">
              {{ formatTime(h.oldTime) }} → {{ formatTime(h.newTime) }}
            </div>
          </div>
        </div>
      </div>

      <div class="actions" v-if="canOperate">
        <!-- 待确认状态显示确认按钮 -->
        <button 
          v-if="appointment.status === 'pending' && appointment.createdBy === 'merchant'" 
          class="btn-confirm" 
          @click="confirmAppointment"
          :disabled="submitting"
        >
          {{ submitting ? '确认中...' : '确认预约' }}
        </button>
        <button class="btn-reschedule" @click="showRescheduleModal = true">改期</button>
        <button class="btn-cancel" @click="showCancelModal = true">取消预约</button>
      </div>

      <div class="confirm-card" v-if="appointment.status === 'reschedule' && appointment.proposedBy === 'merchant'">
        <p>商家提议改期：{{ formatTime(appointment.proposedTime) }}</p>
        <div class="confirm-actions">
          <button class="btn-accept" @click="acceptReschedule">接受</button>
          <button class="btn-reject" @click="rejectReschedule">拒绝</button>
        </div>
      </div>
    </div>

    <div v-else class="error-state">
      <div class="error-icon">❌</div>
      <p>{{ error || '预约不存在' }}</p>
      <button @click="router.back()">返回</button>
    </div>

    <div v-if="showRescheduleModal" class="modal" @click="showRescheduleModal = false">
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
          <button class="btn-secondary" @click="showRescheduleModal = false">取消</button>
          <button class="btn-primary" @click="submitReschedule" :disabled="!newTime || submitting">
            {{ submitting ? '提交中...' : '确认改期' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCancelModal" class="modal" @click="showCancelModal = false">
      <div class="modal-content" @click.stop>
        <h3>取消预约</h3>
        <p class="modal-subtitle">确定要取消这个预约吗？</p>
        <div class="form-item">
          <label>取消原因（选填）</label>
          <textarea v-model="cancelReason" placeholder="请输入取消原因"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showCancelModal = false">不取消</button>
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
import { useRoute, useRouter } from 'vue-router'
import api from '../api'

const route = useRoute()
const router = useRouter()

const appointment = ref<any>(null)
const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const showRescheduleModal = ref(false)
const showCancelModal = ref(false)
const newTime = ref('')
const rescheduleNotes = ref('')
const cancelReason = ref('')

const canOperate = computed(() => {
  if (!appointment.value) return false
  return ['pending', 'confirmed', 'reschedule'].includes(appointment.value.status)
})

onMounted(async () => {
  await loadAppointment()
})

async function loadAppointment() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/h5/appointments/${route.params.id}`)
    appointment.value = data.data
  } catch (e: any) {
    error.value = e.response?.data?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function getStatusClass(status: string) {
  const map: Record<string, string> = {
    pending: 'pending', confirmed: 'confirmed', reschedule: 'reschedule',
    in_service: 'in-service', completed: 'completed', paid: 'completed',
    cancelled_by_customer: 'cancelled', cancelled_by_merchant: 'cancelled',
  }
  return map[status] || status
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待确认', confirmed: '已确认', reschedule: '待改期',
    in_service: '服务中', completed: '已完成', paid: '已支付',
    cancelled_by_customer: '已取消', cancelled_by_merchant: '商家取消',
  }
  return map[status] || status
}

function getStatusDesc(status: string) {
  const map: Record<string, string> = {
    pending: '请等待商家确认', confirmed: '预约已确认，请按时到店',
    reschedule: '有改期请求待处理', in_service: '宠物正在接受服务',
    completed: '服务已完成', paid: '已支付',
    cancelled_by_customer: '您已取消此预约', cancelled_by_merchant: '商家已取消此预约',
  }
  return map[status] || ''
}

function getActionText(action: string) {
  const map: Record<string, string> = {
    create: '创建预约', confirm: '确认预约', reschedule: '提议改期',
    accept: '接受改期', reject: '拒绝改期', cancel: '取消预约', complete: '完成服务',
  }
  return map[action] || action
}

function formatTime(time: string | Date) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function submitReschedule() {
  if (!newTime.value || submitting.value) return
  submitting.value = true
  try {
    await api.put(`/h5/appointments/${route.params.id}/reschedule`, {
      proposedTime: new Date(newTime.value).toISOString(),
      notes: rescheduleNotes.value,
    })
    showRescheduleModal.value = false
    await loadAppointment()
  } catch (e: any) {
    alert(e.response?.data?.message || '改期失败')
  } finally {
    submitting.value = false
  }
}

async function acceptReschedule() {
  if (submitting.value) return
  submitting.value = true
  try {
    await api.put(`/h5/appointments/${route.params.id}/accept`, { notes: '接受改期' })
    await loadAppointment()
  } catch (e: any) {
    alert(e.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function confirmAppointment() {
  if (submitting.value) return
  submitting.value = true
  try {
    await api.put(`/h5/appointments/${route.params.id}/confirm`)
    alert('预约已确认！')
    await loadAppointment()
  } catch (e: any) {
    alert(e.response?.data?.message || '确认失败')
  } finally {
    submitting.value = false
  }
}

async function rejectReschedule() {
  if (!confirm('确定要拒绝商家的改期提议吗？')) return
  if (submitting.value) return
  submitting.value = true
  try {
    await api.put(`/h5/appointments/${route.params.id}/reject`)
    await loadAppointment()
  } catch (e: any) {
    alert(e.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function submitCancel() {
  if (submitting.value) return
  submitting.value = true
  try {
    await api.put(`/h5/appointments/${route.params.id}/cancel`, { reason: cancelReason.value })
    router.back()
  } catch (e: any) {
    alert(e.response?.data?.message || '取消失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.detail-page { min-height: 100vh; background: #f5f5f5; padding-bottom: 30px; }
.loading, .error-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; color: #999; }
.spinner { width: 40px; height: 40px; border: 3px solid #f0f0f0; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-icon { font-size: 48px; margin-bottom: 16px; }
.error-state button { margin-top: 16px; padding: 10px 24px; background: #667eea; color: white; border: none; border-radius: 8px; }
.status-card { padding: 30px 20px; text-align: center; color: white; }
.status-card.pending { background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%); }
.status-card.confirmed { background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%); }
.status-card.reschedule { background: linear-gradient(135deg, #fa8c16 0%, #d46b08 100%); }
.status-card.in-service { background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%); }
.status-card.completed { background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%); }
.status-card.cancelled { background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%); }
.status-text { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
.status-desc { font-size: 14px; opacity: 0.9; }
.info-card { background: white; margin: 12px; padding: 16px; border-radius: 12px; }
.info-card h3 { margin: 0 0 16px; font-size: 16px; color: #333; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.info-row { display: flex; margin-bottom: 12px; font-size: 14px; }
.info-row .label { color: #999; width: 80px; }
.info-row .value { flex: 1; color: #333; }
.info-row .highlight { color: #fa8c16; font-weight: 500; }
.history-list { max-height: 300px; overflow-y: auto; }
.history-item { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.history-item:last-child { border-bottom: none; }
.history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.history-action { font-weight: 500; color: #333; }
.history-time { font-size: 12px; color: #999; }
.history-info { font-size: 13px; color: #666; }
.actions { display: flex; gap: 12px; margin: 12px; }
.btn-reschedule, .btn-cancel { flex: 1; padding: 14px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
.btn-reschedule { background: white; border: 1px solid #667eea; color: #667eea; }
.btn-cancel { background: white; border: 1px solid #ff4d4f; color: #ff4d4f; }
.btn-confirm { flex: 1; padding: 14px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; background: #52c41a; color: white; }
.btn-confirm:disabled { opacity: 0.6; }
.confirm-card { background: #fff7e6; margin: 12px; padding: 16px; border-radius: 12px; text-align: center; }
.confirm-card p { margin: 0 0 16px; color: #ad6800; }
.confirm-actions { display: flex; gap: 12px; }
.btn-accept, .btn-reject { flex: 1; padding: 12px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
.btn-accept { background: #52c41a; color: white; }
.btn-reject { background: white; border: 1px solid #ff4d4f; color: #ff4d4f; }
.modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-content { background: white; border-radius: 12px; padding: 24px; width: 100%; max-width: 400px; }
.modal-content h3 { margin: 0 0 8px; font-size: 18px; color: #333; }
.modal-subtitle { margin: 0 0 20px; font-size: 13px; color: #999; }
.form-item { margin-bottom: 16px; }
.form-item label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; }
.form-item input, .form-item textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
.form-item textarea { min-height: 80px; resize: vertical; }
.modal-actions { display: flex; gap: 12px; margin-top: 20px; }
.modal-actions button { flex: 1; padding: 12px; border: none; border-radius: 8px; font-size: 15px; font-weight: 500; cursor: pointer; }
.btn-secondary { background: #f5f5f5; color: #666; }
.btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-danger { background: #ff4d4f; color: white; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }
</style>