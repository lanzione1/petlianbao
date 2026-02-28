<template>
  <div class="logs-page">
    <div class="page-header">
      <h3>操作日志</h3>
      <div class="filters">
        <select v-model="filters.action" class="filter-select">
          <option value="">全部操作</option>
          <option value="login">登录</option>
          <option value="ban">禁用商家</option>
          <option value="unban">解禁商家</option>
          <option value="update_plan">更改套餐</option>
        </select>
        <select v-model="filters.targetType" class="filter-select">
          <option value="">全部对象</option>
          <option value="merchant">商家</option>
          <option value="admin">管理员</option>
        </select>
        <button class="btn btn-primary btn-sm" @click="loadLogs">筛选</button>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>时间</th>
            <th>操作人</th>
            <th>操作类型</th>
            <th>对象类型</th>
            <th>详情</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ formatDateTime(log.createdAt) }}</td>
            <td>{{ log.adminName || '-' }}</td>
            <td>
              <span :class="['action-badge', 'action-' + log.action]">{{ getActionName(log.action) }}</span>
            </td>
            <td>{{ getTargetTypeName(log.targetType) }}</td>
            <td>
              <span class="detail-text" :title="JSON.stringify(log.detail, null, 2)">
                {{ getDetailText(log) }}
              </span>
            </td>
            <td>{{ log.ip || '-' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="logs.length === 0" class="empty">暂无日志</div>
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button 
        class="page-btn" 
        :disabled="page === 1"
        @click="page--; loadLogs()"
      >
        上一页
      </button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button 
        class="page-btn" 
        :disabled="page === totalPages"
        @click="page++; loadLogs()"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { adminApi } from '@/api'

const logs = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const totalPages = ref(1)
const limit = 20

const filters = reactive({
  action: '',
  targetType: '',
})

onMounted(() => {
  loadLogs()
})

watch([() => filters.action, () => filters.targetType], () => {
  page.value = 1
})

async function loadLogs() {
  try {
    const res = await adminApi.getLogs({
      page: page.value,
      limit,
      action: filters.action || undefined,
      targetType: filters.targetType || undefined,
    }) as any
    
    logs.value = res.list || []
    total.value = res.total || 0
    totalPages.value = res.totalPages || 1
  } catch (e) {
    console.error('加载日志失败', e)
  }
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}

function getActionName(action: string) {
  const names: Record<string, string> = {
    login: '登录',
    logout: '登出',
    ban: '禁用',
    unban: '解禁',
    update_plan: '更改套餐',
    create_admin: '创建管理员',
  }
  return names[action] || action
}

function getTargetTypeName(type: string) {
  const names: Record<string, string> = {
    merchant: '商家',
    admin: '管理员',
  }
  return names[type] || type || '-'
}

function getDetailText(log: any) {
  if (!log.detail) return '-'
  if (log.action === 'update_plan') {
    return `${log.detail.oldPlan || '-'} → ${log.detail.newPlan || '-'}`
  }
  if (log.action === 'ban') {
    return log.detail.reason || '-'
  }
  return '-'
}
</script>

<style scoped>
.logs-page {
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

.action-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.action-login { background: #e6f7ff; color: #1890ff; }
.action-ban { background: #fff1f0; color: #ff4d4f; }
.action-unban { background: #f6ffed; color: #52c41a; }
.action-update_plan { background: #fff7e6; color: #fa8c16; }

.detail-text {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

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
</style>
