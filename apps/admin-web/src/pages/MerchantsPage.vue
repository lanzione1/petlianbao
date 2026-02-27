<template>
  <div class="table-container">
    <div class="table-header">
      <h3 class="table-title">商家列表</h3>
      <div class="search-box">
        <select v-model="filters.status" class="search-input" style="width: 120px">
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="banned">已禁用</option>
        </select>
        <input 
          v-model="filters.search" 
          class="search-input" 
          placeholder="搜索店铺名/手机号"
          @keyup.enter="loadMerchants"
        />
        <button class="btn btn-primary btn-sm" @click="loadMerchants">搜索</button>
      </div>
    </div>

    <table v-if="merchants.length > 0">
      <thead>
        <tr>
          <th>店铺名称</th>
          <th>店主</th>
          <th>联系电话</th>
          <th>地址</th>
          <th>状态</th>
          <th>注册时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in merchants" :key="m.id">
          <td>{{ m.shopName }}</td>
          <td>{{ m.ownerName || '-' }}</td>
          <td>{{ m.phone || '-' }}</td>
          <td>{{ m.address || '-' }}</td>
          <td>
            <span :class="['status-badge', m.planType === 'banned' ? 'status-banned' : 'status-active']">
              {{ m.planType === 'banned' ? '已禁用' : '正常' }}
            </span>
          </td>
          <td>{{ formatDate(m.createdAt) }}</td>
          <td>
            <div class="action-btns">
              <button class="btn btn-sm" @click="$router.push('/merchants/' + m.id)">详情</button>
              <button 
                v-if="m.planType !== 'banned'"
                class="btn btn-sm btn-danger"
                @click="handleBan(m.id)"
              >
                禁用
              </button>
              <button 
                v-else
                class="btn btn-sm btn-success"
                @click="handleUnban(m.id)"
              >
                解禁
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    
    <div v-else class="empty">暂无商家数据</div>

    <div class="pagination" v-if="totalPages > 1">
      <button 
        class="page-btn" 
        :disabled="page === 1"
        @click="page--; loadMerchants()"
      >
        上一页
      </button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button 
        class="page-btn" 
        :disabled="page === totalPages"
        @click="page++; loadMerchants()"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { adminApi } from '@/api'

const merchants = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const totalPages = ref(1)
const limit = 10

const filters = reactive({
  status: '',
  search: ''
})

onMounted(() => {
  loadMerchants()
})

watch(() => filters.status, () => {
  page.value = 1
  loadMerchants()
})

async function loadMerchants() {
  try {
    const res = await adminApi.getMerchants({
      page: page.value,
      limit,
      status: filters.status || undefined,
      search: filters.search || undefined
    }) as any
    
    merchants.value = res.list || []
    total.value = res.total || 0
    totalPages.value = res.totalPages || 1
  } catch (e) {
    console.error('加载商家列表失败', e)
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN')
}

async function handleBan(id: string) {
  const reason = prompt('请输入禁用原因')
  if (!reason) return
  
  try {
    await adminApi.banMerchant(id, reason)
    loadMerchants()
  } catch (e) {
    alert('操作失败')
  }
}

async function handleUnban(id: string) {
  if (!confirm('确定要解禁该商家吗？')) return
  
  try {
    await adminApi.unbanMerchant(id)
    loadMerchants()
  } catch (e) {
    alert('操作失败')
  }
}
</script>
