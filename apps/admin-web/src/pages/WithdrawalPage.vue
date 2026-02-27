<template>
  <div class="withdrawal-page">
    <div class="page-header">
      <h3>提现管理</h3>
      <div class="filters">
        <select v-model="filters.status" class="filter-select" @change="page = 1; loadWithdrawals()">
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="completed">已完成</option>
          <option value="failed">已失败</option>
        </select>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-label">总提现</span>
        <span class="stat-value">{{ stats.total || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">待处理</span>
        <span class="stat-value warning">{{ stats.pending || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已完成</span>
        <span class="stat-value success">{{ stats.completed || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">待处理金额</span>
        <span class="stat-value warning">{{ formatMoney(stats.pendingAmount) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已打款金额</span>
        <span class="stat-value success">{{ formatMoney(stats.completedAmount) }}</span>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>申请时间</th>
            <th>商家</th>
            <th>金额</th>
            <th>银行信息</th>
            <th>状态</th>
            <th>交易号</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in withdrawals" :key="item.id">
            <td>{{ formatDateTime(item.createdAt) }}</td>
            <td>{{ item.shopName || '-' }}</td>
            <td class="highlight">{{ formatMoney(item.amount) }}</td>
            <td>
              <div v-if="item.bankName">{{ item.bankName }}</div>
              <div v-if="item.bankAccount" class="sub-text">{{ item.bankAccount }}</div>
              <div v-if="item.accountName" class="sub-text">{{ item.accountName }}</div>
            </td>
            <td>
              <span :class="['status-badge', 'status-' + item.status]">{{ getStatusName(item.status) }}</span>
            </td>
            <td>{{ item.transactionNo || '-' }}</td>
            <td>{{ item.remark || '-' }}</td>
            <td>
              <template v-if="item.status === 'pending'">
                <button class="btn btn-sm btn-success" @click="handleProcess(item, 'completed')">通过</button>
                <button class="btn btn-sm btn-danger" @click="handleProcess(item, 'failed')">拒绝</button>
              </template>
              <span v-else class="sub-text">已处理</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="withdrawals.length === 0" class="empty">暂无提现记录</div>
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button 
        class="page-btn" 
        :disabled="page === 1"
        @click="page--; loadWithdrawals()"
      >
        上一页
      </button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button 
        class="page-btn" 
        :disabled="page === totalPages"
        @click="page++; loadWithdrawals()"
      >
        下一页
      </button>
    </div>

    <div v-if="showProcessModal" class="modal-overlay" @click.self="showProcessModal = false">
      <div class="modal">
        <h4>{{ processStatus === 'completed' ? '确认打款' : '拒绝提现' }}</h4>
        <div class="modal-body">
          <p>商家：{{ currentItem?.shopName }}</p>
          <p>金额：{{ formatMoney(currentItem?.amount) }}</p>
          <div class="form-group" v-if="processStatus === 'completed'">
            <label>交易流水号</label>
            <input v-model="transactionNo" placeholder="请输入银行交易流水号" />
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea v-model="remark" placeholder="请输入备注"></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showProcessModal = false">取消</button>
          <button class="btn btn-primary" @click="confirmProcess">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '@/api'

const withdrawals = ref<any[]>([])
const stats = ref<any>({})
const page = ref(1)
const totalPages = ref(1)

const showProcessModal = ref(false)
const currentItem = ref<any>(null)
const processStatus = ref('')
const transactionNo = ref('')
const remark = ref('')

const filters = reactive({
  status: '',
})

onMounted(() => {
  loadWithdrawals()
  loadStats()
})

async function loadWithdrawals() {
  try {
    const res = await adminApi.getWithdrawalList({
      page: page.value,
      limit: 20,
      status: filters.status || undefined,
    }) as any
    withdrawals.value = res.list || []
    totalPages.value = res.totalPages || 1
  } catch (e) {
    console.error('加载失败', e)
  }
}

async function loadStats() {
  try {
    const res = await adminApi.getWithdrawalStats() as any
    stats.value = res
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

function handleProcess(item: any, status: string) {
  currentItem.value = item
  processStatus.value = status
  transactionNo.value = ''
  remark.value = ''
  showProcessModal.value = true
}

async function confirmProcess() {
  if (!currentItem.value) return
  
  try {
    await adminApi.processWithdrawal(
      currentItem.value.id,
      processStatus.value,
      transactionNo.value,
      remark.value
    )
    showProcessModal.value = false
    loadWithdrawals()
    loadStats()
  } catch (e) {
    alert('操作失败')
  }
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}

function formatMoney(amount: number) {
  if (!amount) return '0.00'
  return (amount / 100).toFixed(2) + ' 元'
}

function getStatusName(status: string) {
  const names: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '已失败',
  }
  return names[status] || status
}
</script>

<style scoped>
.withdrawal-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h3 {
  margin: 0;
}

.filters {
  display: flex;
  gap: 8px;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  min-width: 120px;
}

.stats-row {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.stat-value.warning {
  color: #fa8c16;
}

.stat-value.success {
  color: #52c41a;
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
  font-weight: 600;
}

.sub-text {
  font-size: 12px;
  color: #999;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-pending { background: #fff7e6; color: #fa8c16; }
.status-processing { background: #e6f7ff; color: #1890ff; }
.status-completed { background: #f6ffed; color: #52c41a; }
.status-failed { background: #fff1f0; color: #ff4d4f; }

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.page-btn {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  max-width: 90%;
}

.modal h4 {
  margin: 0 0 16px 0;
}

.modal-body p {
  margin: 0 0 12px 0;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: #666;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-group textarea {
  height: 60px;
  resize: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
</style>
