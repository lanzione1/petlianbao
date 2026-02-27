<template>
  <div class="dev-mode">
    <!-- 开发者模式切换按钮 -->
    <div 
      class="dev-toggle"
      @click="toggleDevMode"
      :class="{ active: isDevMode }"
    >
      {{ isDevMode ? '🔧 DEV' : '👨‍💻' }}
    </div>

    <!-- 开发者面板 -->
    <transition name="slide">
      <div class="dev-panel" v-if="isDevMode">
        <div class="panel-header">
          <h3>开发者模式</h3>
          <button @click="isDevMode = false" class="close-btn">✕</button>
        </div>

        <!-- Token 输入区域 -->
        <div class="dev-section" v-if="!hasToken">
          <label>商家 Token</label>
          <textarea 
            v-model="tokenInput" 
            placeholder="请输入商家 JWT Token"
            class="token-input"
            rows="4"
          ></textarea>
          <button @click="saveToken" class="btn-save" :disabled="!tokenInput.trim()">
            保存 Token
          </button>
          <div class="token-tips">
            <p><strong>💡 如何获取 Token？</strong></p>
            <ol>
              <li>打开小程序开发者工具</li>
              <li>点击控制台 > Storage</li>
              <li>找到并复制 <code>token</code> 字段的值</li>
              <li>粘贴到上方输入框</li>
            </ol>
          </div>
        </div>

        <!-- 商家信息显示 -->
        <div class="dev-section" v-if="hasToken">
          <label>当前商家</label>
          <div class="merchant-card" v-if="merchant">
            <div class="merchant-name">{{ merchant.shopName }}</div>
            <div class="merchant-phone">{{ merchant.phone }}</div>
            <div class="merchant-id">ID: {{ merchantId }}</div>
          </div>
          <div v-else class="loading-text">加载中...</div>
          <button @click="clearToken" class="btn-link">清除 Token</button>
        </div>

        <!-- 客户选择 -->
        <div class="dev-section" v-if="hasToken && customers.length > 0">
          <label>选择测试客户</label>
          <div class="customer-list">
            <div
              v-for="c in customers"
              :key="c.id"
              :class="['customer-item', { selected: selectedCustomer?.id === c.id }]"
              @click="selectCustomer(c)"
            >
              <div class="customer-info">
                <div class="name">{{ c.petName }}</div>
                <div class="phone">{{ c.phone }}</div>
              </div>
              <div class="check" v-if="selectedCustomer?.id === c.id">✓</div>
            </div>
          </div>
        </div>

        <div class="dev-section" v-else-if="hasToken && !loadingCustomers">
          <div class="empty">暂无客户数据</div>
        </div>

        <!-- 快捷操作 -->
        <div class="dev-actions" v-if="hasToken">
          <button @click="clearSelection" class="btn-secondary">清除选择</button>
          <button @click="autoFill" class="btn-primary" :disabled="!selectedCustomer">
            自动填充
          </button>
        </div>

        <!-- 提示信息 -->
        <div class="dev-tips" v-if="hasToken">
          <p>💡 选择客户后点击"自动填充"按钮</p>
          <p>💡 填充后可以直接提交预约测试</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

interface Customer {
  id: string
  petName: string
  phone: string
  notes?: string
}

interface Merchant {
  id: string
  shopName: string
  phone: string
  address?: string
}

const emit = defineEmits<{
  fillForm: [customer: Customer, merchantId: string]
}>()

const isDevMode = ref(false)
const tokenInput = ref('')
const token = ref('')
const merchantId = ref('')
const merchant = ref<Merchant | null>(null)
const selectedCustomer = ref<Customer | null>(null)
const customers = ref<Customer[]>([])
const loadingCustomers = ref(false)

const hasToken = computed(() => !!token.value)

// 从 localStorage 恢复状态
onMounted(() => {
  const savedToken = localStorage.getItem('dev-merchant-token')
  if (savedToken) {
    token.value = savedToken
    loadMerchantInfo()
  }
  
  const saved = localStorage.getItem('dev-mode-state')
  if (saved) {
    try {
      const state = JSON.parse(saved)
      isDevMode.value = state.isDevMode || false
    } catch (e) {
      console.error('恢复状态失败', e)
    }
  }
})

// 切换开发者模式
const toggleDevMode = () => {
  isDevMode.value = !isDevMode.value
  saveState()
}

// 保存 Token
const saveToken = async () => {
  const trimmedToken = tokenInput.value.trim()
  if (!trimmedToken) return
  
  // 验证 Token 格式
  if (!trimmedToken.startsWith('eyJ')) {
    alert('Token 格式不正确，应该以 eyJ 开头')
    return
  }
  
  token.value = trimmedToken
  localStorage.setItem('dev-merchant-token', trimmedToken)
  tokenInput.value = ''
  
  console.log('保存的 Token:', trimmedToken.substring(0, 50) + '...')
  
  await loadMerchantInfo()
}

// 清除 Token
const clearToken = () => {
  token.value = ''
  merchantId.value = ''
  merchant.value = null
  customers.value = []
  selectedCustomer.value = null
  localStorage.removeItem('dev-merchant-token')
}

// 加载商家信息
const loadMerchantInfo = async () => {
  if (!token.value) return
  
  console.log('开始加载商家信息...')
  console.log('Token 预览:', token.value.substring(0, 50) + '...')
  console.log('请求地址:', '/api/v1/merchants/me')
  
  try {
    const { data } = await axios.get('/api/v1/merchants/me', {
      headers: { 
        Authorization: `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('商家信息加载成功:', data)
    
    merchant.value = data
    merchantId.value = data.id
    
    // 自动加载客户列表
    await loadCustomers()
  } catch (e: any) {
    console.error('加载商家信息失败:', e)
    console.error('错误响应:', e.response?.data)
    console.error('状态码:', e.response?.status)
    
    if (e.response?.status === 401) {
      const errorMsg = e.response?.data?.message || 'Token 无效或已过期'
      alert(`认证失败: ${errorMsg}\n\n请检查：\n1. Token 是否完整复制\n2. Token 是否已过期\n3. 小程序是否已登录\n4. 后端服务是否运行`)
      clearToken()
    } else if (e.code === 'ERR_NETWORK') {
      alert('网络连接失败，请检查：\n1. 后端服务是否运行 (http://localhost:3000)\n2. Vite 代理配置是否正确')
    } else {
      alert(`加载失败: ${e.message}`)
    }
  }
}

// 加载客户列表
const loadCustomers = async () => {
  if (!token.value) return
  
  console.log('开始加载客户列表...')
  loadingCustomers.value = true
  
  try {
    const { data } = await axios.get('/api/v1/customers', {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    
    console.log('客户列表原始数据:', data)
    console.log('数据类型:', typeof data, Array.isArray(data))
    
    // 处理数据格式 - 后端返回 { list: [], total: number }
    if (data?.list && Array.isArray(data.list)) {
      customers.value = data.list
      console.log('使用 data.list, 客户数量:', customers.value.length)
    } else if (Array.isArray(data)) {
      customers.value = data
      console.log('使用 data, 客户数量:', customers.value.length)
    } else {
      customers.value = []
      console.log('无法解析客户数据')
    }
    
    console.log('解析后的客户列表:', customers.value)
  } catch (e: any) {
    console.error('加载客户列表失败:', e)
    console.error('错误响应:', e.response?.data)
    console.error('状态码:', e.response?.status)
    customers.value = []
  } finally {
    loadingCustomers.value = false
  }
}

// 选择客户
const selectCustomer = (customer: Customer) => {
  selectedCustomer.value = customer
  saveState()
}

// 清除选择
const clearSelection = () => {
  selectedCustomer.value = null
  saveState()
}

// 自动填充表单
const autoFill = () => {
  if (selectedCustomer.value && merchantId.value) {
    emit('fillForm', selectedCustomer.value, merchantId.value)
    // 自动关闭面板
    setTimeout(() => {
      isDevMode.value = false
      saveState()
    }, 300)
  }
}

// 保存状态到 localStorage
const saveState = () => {
  localStorage.setItem('dev-mode-state', JSON.stringify({
    isDevMode: isDevMode.value
  }))
}
</script>

<style scoped>
.dev-mode {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

.dev-toggle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  user-select: none;
}

.dev-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
}

.dev-toggle.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.dev-panel {
  position: absolute;
  top: 60px;
  right: 0;
  width: 340px;
  max-height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dev-section {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.dev-section label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.token-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Courier New', monospace;
  resize: vertical;
  margin-bottom: 12px;
}

.token-input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-save {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.token-tips {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9ff;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.6;
}

.token-tips p {
  margin: 0 0 8px 0;
  color: #667eea;
}

.token-tips ol {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.token-tips li {
  margin-bottom: 4px;
}

.token-tips code {
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  color: #667eea;
  font-family: 'Courier New', monospace;
}

.merchant-card {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.merchant-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.merchant-phone {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.merchant-id {
  font-size: 11px;
  color: #999;
  font-family: 'Courier New', monospace;
}

.btn-link {
  background: none;
  border: none;
  color: #667eea;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
}

.customer-list {
  max-height: 240px;
  overflow-y: auto;
}

.customer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.customer-item:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.customer-item.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
}

.customer-info {
  flex: 1;
}

.customer-info .name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.customer-info .phone {
  font-size: 12px;
  color: #999;
}

.check {
  color: #667eea;
  font-size: 20px;
  font-weight: bold;
}

.empty, .loading-text {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 13px;
}

.dev-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.dev-actions button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dev-tips {
  padding: 16px 20px;
  background: #f8f9ff;
}

.dev-tips p {
  margin: 0;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.dev-tips p:last-child {
  margin-bottom: 0;
}

/* 动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 滚动条样式 */
.dev-panel::-webkit-scrollbar,
.customer-list::-webkit-scrollbar {
  width: 6px;
}

.dev-panel::-webkit-scrollbar-track,
.customer-list::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.dev-panel::-webkit-scrollbar-thumb,
.customer-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.dev-panel::-webkit-scrollbar-thumb:hover,
.customer-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
