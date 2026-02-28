<template>
  <div class="packages-page">
    <div class="page-header">
      <h3>套餐管理</h3>
      <button class="btn btn-primary" @click="openModal()">新建套餐</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="packages.length === 0" class="empty">
      暂无套餐，请点击"新建套餐"添加
    </div>

    <div v-else class="packages-grid">
      <div v-for="pkg in packages" :key="pkg.id" class="package-card">
        <div class="package-header">
          <span :class="['package-badge', 'badge-' + pkg.type]">{{ pkg.type }}</span>
          <span class="package-price">{{ pkg.price > 0 ? '¥' + (pkg.price / 100) + '/月' : '免费' }}</span>
        </div>
        <h4 class="package-name">{{ pkg.name }}</h4>
        <p class="package-desc">{{ pkg.description || '暂无描述' }}</p>
        <ul class="package-features" v-if="pkg.features && pkg.features.length">
          <li v-for="(feature, i) in pkg.features" :key="i">{{ feature }}</li>
        </ul>
        <div class="package-footer">
          <span :class="['package-status', pkg.status === 'active' ? 'status-active' : 'status-inactive']">
            {{ pkg.status === 'active' ? '在售' : '已下架' }}
          </span>
          <div class="package-actions">
            <button class="btn btn-sm" @click="editPackage(pkg)">编辑</button>
            <button class="btn btn-sm" :class="pkg.status === 'active' ? 'btn-danger' : 'btn-success'" @click="toggleStatus(pkg)">
              {{ pkg.status === 'active' ? '下架' : '上架' }}
            </button>
          </div>
        </div>
      </div>
    </div>

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
            <textarea v-model="form.description" class="form-input" rows="2"></textarea>
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

<script setup>
import { ref, reactive, onMounted } from 'vue'

const packages = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingId = ref('')

const form = reactive({
  name: '',
  type: 'basic',
  price: 0,
  description: '',
  featuresText: ''
})

onMounted(() => {
  loadPackages()
})

async function loadPackages() {
  loading.value = true
  try {
    const response = await fetch('/api/v1/admin/packages', {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
      }
    })
    if (!response.ok) throw new Error('API请求失败')
    packages.value = await response.json()
  } catch (e) {
    console.error('加载套餐失败:', e)
  } finally {
    loading.value = false
  }
}

function openModal() {
  editingId.value = ''
  resetForm()
  showModal.value = true
}

function editPackage(pkg) {
  editingId.value = pkg.id
  form.name = pkg.name
  form.type = pkg.type
  form.price = pkg.price / 100
  form.description = pkg.description || ''
  form.featuresText = (pkg.features || []).join('\n')
  showModal.value = true
}

async function toggleStatus(pkg) {
  const newStatus = pkg.status === 'active' ? 'inactive' : 'active'
  try {
    const response = await fetch('/api/v1/admin/packages/' + pkg.id + '/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
      },
      body: JSON.stringify({ status: newStatus })
    })
    if (!response.ok) throw new Error('操作失败')
    pkg.status = newStatus
  } catch (e) {
    alert('操作失败')
  }
}

async function savePackage() {
  const data = {
    name: form.name,
    type: form.type,
    price: form.price * 100,
    description: form.description,
    features: form.featuresText.split('\n').filter(f => f.trim())
  }
  try {
    const url = editingId.value 
      ? '/api/v1/admin/packages/' + editingId.value
      : '/api/v1/admin/packages'
    const method = editingId.value ? 'PUT' : 'POST'
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) throw new Error('保存失败')
    
    showModal.value = false
    loadPackages()
    resetForm()
  } catch (e) {
    alert('保存失败')
  }
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
.packages-page { padding: 20px; background: #fff; min-height: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h3 { margin: 0; }
.loading { text-align: center; padding: 40px; color: #666; }
.packages-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.package-card { background: white; border: 1px solid #eee; border-radius: 8px; padding: 20px; }
.package-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.package-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; background: #eee; }
.badge-free { background: #f5f5f5; color: #666; }
.badge-basic { background: #e6f7ff; color: #1890ff; }
.badge-pro { background: #f6ffed; color: #52c41a; }
.badge-enterprise { background: #fff7e6; color: #fa8c16; }
.package-price { font-size: 18px; font-weight: bold; color: #52c41a; }
.package-name { margin: 0 0 8px; font-size: 16px; }
.package-desc { color: #666; font-size: 14px; margin-bottom: 12px; }
.package-features { list-style: none; padding: 0; margin: 0 0 12px; }
.package-features li { padding: 4px 0; font-size: 13px; color: #666; }
.package-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #eee; }
.package-status { font-size: 12px; }
.status-active { color: #52c41a; }
.status-inactive { color: #999; }
.package-actions { display: flex; gap: 8px; }
.empty { text-align: center; padding: 40px; color: #999; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 8px; padding: 24px; width: 90%; max-width: 500px; }
.modal h3 { margin: 0 0 20px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 14px; color: #666; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid #d9d9d9; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
.form-input:focus { outline: none; border-color: #1890ff; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
</style>
