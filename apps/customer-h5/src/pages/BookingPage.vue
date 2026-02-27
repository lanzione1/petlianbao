<template>
  <div class="booking-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <div class="nav-title">在线预约</div>
      <button class="my-appointments-btn" @click="goToMyAppointments">
        我的预约
      </button>
    </div>

    <div class="header" v-if="merchant">
      <h1>{{ merchant.shopName }}</h1>
      <p class="subtitle">{{ merchant.address || '在线预约服务' }}</p>
    </div>
    <div class="header" v-else>
      <h1>在线预约</h1>
      <p class="subtitle" v-if="!merchantId">请扫描商家二维码或输入商家ID</p>
      <p class="subtitle" v-else>扫码预约服务</p>
    </div>

    <div class="loading" v-if="loading">加载中...</div>

    <div class="error" v-else-if="error">{{ error }}</div>
    
    <!-- 未登录提示 -->
    <div v-else-if="!isLoggedIn && merchantId" class="login-required-banner">
      <div class="login-icon">🔐</div>
      <h3>请先登录</h3>
      <p>登录后可保存预约记录、查看历史预约</p>
      <button class="login-btn" @click="wechatLogin">
        微信一键登录
      </button>
      <p class="dev-login-tip">开发测试：<a href="#" @click.prevent="devLogin">模拟登录</a></p>
    </div>
    
    <!-- 未选择商家提示 -->
    <div class="empty-state" v-else-if="!merchantId">
      <div class="empty-icon">📍</div>
      <p>请扫描商家二维码</p>
      <p>或在URL中添加 ?shop=商家ID</p>
    </div>

    <div class="form" v-else>
      <div class="form-item">
        <label>选择服务</label>
        <div class="service-list" v-if="services.length">
          <div
            v-for="s in services"
            :key="s.id"
            :class="['service-card', { active: form.serviceId === s.id }]"
            @click="selectService(s)"
          >
            <div class="service-name">{{ s.name }}</div>
            <div class="service-info">
              <span class="price">¥{{ s.price }}</span>
              <span class="duration">{{ s.duration }}分钟</span>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无服务</div>
      </div>

      <div class="form-item" v-if="form.serviceId">
        <label>选择日期</label>
        <input type="date" v-model="form.date" :min="minDate" @change="loadTimeSlots" />
      </div>

      <div class="form-item" v-if="form.date && timeSlots.length">
        <label>选择时间</label>
        <div class="time-slots">
          <button
            v-for="slot in timeSlots"
            :key="slot.time"
            :class="['slot', { active: form.appointmentTime === slot.time, disabled: !slot.available }]"
            :disabled="!slot.available"
            @click="form.appointmentTime = slot.time"
          >
            {{ slot.time }}
          </button>
        </div>
      </div>

      <div class="form-item" v-if="form.serviceId">
        <label>宠物昵称 *</label>
        <input type="text" v-model="form.petName" placeholder="请输入宠物的昵称" />
      </div>

      <div class="form-item optional" v-if="form.serviceId">
        <label>宠物品种 <span class="tag">后续完善</span></label>
        <input type="text" v-model="form.petBreed" placeholder="首次预约可不填，店主会帮您完善" />
      </div>

      <div class="form-item optional" v-if="form.serviceId">
        <label>您的称呼 <span class="tag">默认微信昵称</span></label>
        <input type="text" v-model="form.customerName" :placeholder="userStore.customer?.nickname || '请输入您的称呼'" />
      </div>

      <div class="form-item" v-if="form.serviceId">
        <label>联系手机 *</label>
        <input type="tel" v-model="form.phone" placeholder="请输入手机号，方便店主联系" maxlength="11" />
      </div>

      <div class="form-item optional" v-if="form.serviceId">
        <label>备注 <span class="tag">选填</span></label>
        <textarea v-model="form.notes" placeholder="如：狗狗怕吹风机"></textarea>
      </div>

      <div class="tips" v-if="form.serviceId">
        <p class="tip-text">💡 提示：首次预约只需填写宠物昵称和联系手机，其他信息店主会在服务时帮您完善</p>
        <p class="tip-text" v-if="isNewCustomer">🎉 您是本店的H5新客户，欢迎光临！</p>
      </div>

      <button class="submit-btn" @click="submit" :disabled="!canSubmit || loading" v-if="form.serviceId">
        {{ loading ? '提交中...' : '提交预约' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { merchantApi, appointmentApi, h5AuthApi, h5AppointmentApi, Service, Merchant, TimeSlot } from '../api'
import api from '../api'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 微信环境检测
const isWechat = computed(() => {
  return /MicroMessenger/i.test(navigator.userAgent)
})

// 登录状态
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 微信登录
const wechatLogin = async () => {
  const currentMerchantId = merchantId.value || route.query.shop as string
  if (!currentMerchantId) {
    alert('请先选择商家')
    return
  }
  
  // 不要在这里编码，让后端处理
  const redirectUri = window.location.origin + '/auth'
  
  try {
    console.log('请求授权URL:', { merchantId: currentMerchantId, redirectUri })
    const { data } = await h5AuthApi.getWechatUrl(currentMerchantId, redirectUri)
    console.log('生成的授权URL:', data.url)
    if (data.url) {
      window.location.href = data.url
    }
  } catch (e: any) {
    alert('获取授权链接失败: ' + (e.message || ''))
  }
}

// 开发模式登录（不经过微信）
const devLogin = async () => {
  const currentMerchantId = merchantId.value || route.query.shop as string
  if (!currentMerchantId) {
    alert('请先选择商家')
    return
  }
  
  try {
    const { data } = await api.post('/h5/auth/dev/login', {
      merchantId: currentMerchantId,
      openid: 'dev_test_openid_' + Date.now()
    })
    
    if (data.success) {
      userStore.setToken(data.data.token)
      userStore.setCustomer(data.data.customer)
      alert('模拟登录成功')
    }
  } catch (e: any) {
    alert('模拟登录失败: ' + (e.response?.data?.message || e.message))
  }
}

const merchantId = ref('')
const merchant = ref<Merchant | null>(null)
const services = ref<Service[]>([])
const timeSlots = ref<TimeSlot[]>([])
const loading = ref(false)
const error = ref('')

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const form = reactive({
  serviceId: '',
  serviceName: '',
  date: minDate.value,
  appointmentTime: '',
  petName: '',
  petBreed: '',
  customerName: '',
  phone: '',
  notes: '',
})

// 是否新客户（用于显示欢迎提示）
const isNewCustomer = computed(() => {
  return userStore.customer?.isNewCustomer || false
})

// 初始化表单时填充默认值
const initializeForm = () => {
  // 如果有客户信息，自动填充
  if (userStore.customer?.customerName) {
    form.customerName = userStore.customer.customerName
  }
  if (userStore.customer?.phone) {
    form.phone = userStore.customer.phone
  }
}

const canSubmit = computed(() => {
  // 首次预约只需要：服务、日期、时间、宠物昵称、手机号
  return form.serviceId && form.date && form.appointmentTime &&
         form.petName && form.phone && form.phone.length === 11
})

onMounted(async () => {
  // 从 URL 获取商家ID
  const shopId = route.query.shop as string
  if (shopId) {
    merchantId.value = shopId
    await initializePage()
    // 初始化表单默认值
    initializeForm()
  }
  // 如果没有商家ID，等待开发者模式填充
})

const goToMyAppointments = () => {
  router.push('/my-appointments')
}

// 初始化页面
const initializePage = async () => {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([loadMerchant(), loadServices()])
  } catch (e) {
    console.error('初始化页面失败', e)
    error.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const loadMerchant = async () => {
  try {
    const { data } = await merchantApi.getInfo(merchantId.value)
    merchant.value = data
  } catch (e) {
    console.error('加载商家信息失败', e)
  }
}

const loadServices = async () => {
  try {
    const { data } = await merchantApi.getServices(merchantId.value)
    services.value = data
  } catch (e) {
    console.error('加载服务失败', e)
  }
}

const selectService = (s: Service) => {
  form.serviceId = s.id
  form.serviceName = s.name
  form.appointmentTime = ''
  timeSlots.value = []
  if (form.date) {
    loadTimeSlots()
  }
}

const loadTimeSlots = async () => {
  if (!form.serviceId || !form.date) return

  try {
    const { data } = await appointmentApi.getAvailableSlots(
      merchantId.value,
      form.serviceId,
      form.date
    )
    timeSlots.value = data
  } catch (e) {
    timeSlots.value = generateMockSlots()
  }
}

const generateMockSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = []
  for (let hour = 9; hour <= 18; hour++) {
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      available: Math.random() > 0.3
    })
  }
  return slots
}

const submit = async () => {
  if (!canSubmit.value || loading.value) return

  // 强制检查登录状态
  if (!userStore.isLoggedIn) {
    alert('请先登录后再预约')
    wechatLogin()
    return
  }

  loading.value = true

  try {
    // H5客户登录状态 - 使用H5预约API，关联到H5客户
    const h5AppointmentData = {
      merchantId: merchantId.value,
      serviceId: form.serviceId,
      appointmentTime: `${form.date} ${form.appointmentTime}`,
      notes: form.notes || undefined,
    }
    console.log('H5客户提交预约:', h5AppointmentData)
    await h5AppointmentApi.create(h5AppointmentData)

    router.push({
      path: '/success',
      query: {
        petName: form.petName,
        serviceName: form.serviceName,
        time: form.appointmentTime,
        date: form.date
      }
    })
  } catch (e: any) {
    console.error('预约失败:', e)
    console.error('错误响应:', e.response?.data)
    const errorMsg = e.response?.data?.message || '预约失败，请稍后重试'
    alert(errorMsg)
  } finally {
    loading.value = false
  }
}

// 处理开发者模式自动填充
const handleDevFill = async (customer: any, devMerchantId: string) => {
  try {
    console.log('开发者模式填充:', { customer, devMerchantId })
    
    // 设置商家ID
    merchantId.value = devMerchantId
    
    // 加载商家和服务信息
    await initializePage()
    
    // 填充表单
    form.customerName = customer.petName
    form.phone = customer.phone
    form.petName = customer.petName
    form.notes = customer.notes || ''
    
    // 如果有服务，自动选择第一个
    if (services.value.length > 0) {
      selectService(services.value[0])
      // 自动加载时间槽
      await loadTimeSlots()
      // 自动选择第一个可用时间
      const availableSlot = timeSlots.value.find(slot => slot.available)
      if (availableSlot) {
        form.appointmentTime = availableSlot.time
      }
    }
    
    console.log('开发者模式自动填充完成', form)
  } catch (e) {
    console.error('自动填充失败', e)
    error.value = '自动填充失败，请手动填写'
  }
}
</script>

<style scoped>
.booking-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 30px;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.my-appointments-btn {
  padding: 6px 14px;
  background: #f0f0f0;
  border: none;
  border-radius: 14px;
  color: #667eea;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

/* 微信登录区域 */
.wechat-login-section {
  padding: 20px;
}

.wechat-login-card {
  background: linear-gradient(135deg, #07c160 0%, #05a350 100%);
  border-radius: 16px;
  padding: 30px 20px;
  text-align: center;
  color: white;
}

.wechat-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.wechat-login-card h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}

.wechat-login-card p {
  margin: 0 0 20px;
  opacity: 0.9;
  font-size: 14px;
}

.wechat-login-btn {
  padding: 12px 32px;
  background: white;
  border: none;
  border-radius: 24px;
  color: #07c160;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dev-login-tip {
  margin-top: 16px;
  font-size: 13px;
  opacity: 0.8;
}

.dev-login-tip a {
  color: white;
  text-decoration: underline;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px 20px;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.subtitle {
  margin: 8px 0 0;
  opacity: 0.9;
  font-size: 14px;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state p {
  margin: 8px 0;
  font-size: 16px;
  line-height: 1.6;
}

.error {
  color: #ff4d4f;
}

.form {
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
  background: white;
  padding: 16px;
  border-radius: 12px;
}

.form-item label {
  display: block;
  margin-bottom: 12px;
  color: #333;
  font-weight: 500;
  font-size: 15px;
}

.form-item input,
.form-item select,
.form-item textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 16px;
  background: #fafafa;
  box-sizing: border-box;
}

.form-item textarea {
  min-height: 80px;
  resize: vertical;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.service-card {
  padding: 16px;
  border: 2px solid #eee;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.service-card:hover {
  border-color: #667eea;
}

.service-card.active {
  border-color: #667eea;
  background: #f0f4ff;
}

.service-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.service-info {
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.price {
  color: #ff6b6b;
  font-weight: 500;
}

.duration {
  color: #999;
}

.time-slots {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.slot {
  padding: 12px 5px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  text-align: center;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.slot:hover:not(.disabled) {
  border-color: #667eea;
}

.slot.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.slot.disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 20px;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-item.optional input,
.form-item.optional textarea {
  background: #f8f9fa;
  border-color: #e9ecef;
}

.form-item .tag {
  font-size: 12px;
  color: #6c757d;
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 8px;
  font-weight: normal;
}

.tips {
  background: #e7f3ff;
  border-left: 4px solid #667eea;
  padding: 12px 16px;
  margin: 20px 0;
  border-radius: 8px;
}

.tip-text {
  margin: 0;
  color: #4a5568;
  font-size: 14px;
  line-height: 1.5;
}

/* 未登录提示样式 */
.login-required-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px 24px;
  margin: 20px 16px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.login-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.login-required-banner h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.login-required-banner p {
  margin: 0 0 20px 0;
  opacity: 0.9;
  font-size: 14px;
}

.login-btn {
  background: white;
  color: #667eea;
  border: none;
  padding: 14px 32px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
