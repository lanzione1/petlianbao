<template>
  <div style="padding: 40px; background: white; min-height: 100vh;">
    <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">完整测试 + Dashboard</h1>
    
    <!-- 调试信息 -->
    <div style="background: #ffe; padding: 15px; margin-bottom: 20px; border: 1px solid #cc0; border-radius: 4px;">
      <p><strong>路由状态:</strong></p>
      <p>当前路径: {{ currentPath }}</p>
      <p>Store isLoggedIn: {{ isLoggedIn }}</p>
      <p>localStorage token: {{ hasLocalToken }}</p>
    </div>

    <!-- 步骤1: 检查Token -->
    <div style="background: #f5f5f5; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
      <h3>步骤1: 检查/设置Token</h3>
      <p>Token状态: <strong :style="{ color: hasLocalToken ? 'green' : 'red' }">{{ hasLocalToken ? '已设置' : '未设置' }}</strong></p>
      <button @click="doLogin" style="padding: 10px 20px; cursor: pointer; background: #1890ff; color: white; border: none; border-radius: 4px;">
        {{ hasLocalToken ? '重新登录' : '登录' }}
      </button>
      <button @click="clearToken" style="padding: 10px 20px; cursor: pointer; margin-left: 8px;">清除Token</button>
    </div>

    <!-- 步骤2: 测试API -->
    <div style="background: #f5f5f5; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
      <h3>步骤2: 测试API</h3>
      <button @click="testApi" style="padding: 10px 20px; cursor: pointer; background: #52c41a; color: white; border: none; border-radius: 4px;">
        获取平台数据
      </button>
      <div v-if="apiResult" style="margin-top: 10px; background: white; padding: 15px; border-radius: 4px; white-space: pre-wrap; max-height: 300px; overflow: auto;">
{{ apiResult }}
      </div>
    </div>

    <!-- 步骤3: 直接显示Dashboard内容 -->
    <div style="background: #ff0; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
      <h3 style="color: red;">步骤3: Dashboard内容 (直接显示，不通过路由)</h3>
      <p v-if="!hasLocalToken" style="color: red;">请先登录</p>
      <div v-else>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 15px;">
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <div style="font-size: 28px; font-weight: 600;">{{ platform.merchants?.total || 0 }}</div>
            <div style="color: #666;">总商家数</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <div style="font-size: 28px; font-weight: 600;">{{ platform.customers?.total || 0 }}</div>
            <div style="color: #666;">总客户数</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <div style="font-size: 28px; font-weight: 600; color: #52c41a;">{{ formatMoney(platform.transactions?.totalRevenue) }}</div>
            <div style="color: #666;">累计收入</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 步骤4: 跳转测试 -->
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
      <h3>步骤4: 跳转测试</h3>
      <button @click="goDashboard" style="padding: 10px 20px; cursor: pointer; background: #722ed1; color: white; border: none; border-radius: 4px;">
        router.push('/dashboard')
      </button>
      <button @click="goLogin" style="padding: 10px 20px; cursor: pointer; margin-left: 8px;">
        router.push('/login')
      </button>
      <p style="margin-top: 10px; color: #666;">跳转后检查: 是否看到黄色背景的Dashboard内容?</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

export default {
  name: 'FullTestPage',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useAdminStore()
    
    const apiResult = ref('')
    const platform = ref({})

    const currentPath = computed(() => route.path)
    const isLoggedIn = computed(() => store.isLoggedIn)
    const hasLocalToken = computed(() => !!localStorage.getItem('admin_token'))

    onMounted(() => {
      console.log('FullTestPage mounted')
      console.log('store.isLoggedIn:', store.isLoggedIn)
      console.log('localStorage token:', localStorage.getItem('admin_token') ? '有' : '无')
    })

    async function doLogin() {
      try {
        const res = await fetch('/api/v1/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'admin123456' })
        })
        const data = await res.json()
        
        if (data.access_token) {
          localStorage.setItem('admin_token', data.access_token)
          console.log('Token saved')
          // 触发响应式更新
          window.location.reload()
        }
      } catch (e) {
        console.error(e)
      }
    }

    function clearToken() {
      localStorage.removeItem('admin_token')
      window.location.reload()
    }

    async function testApi() {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        apiResult.value = '请先登录'
        return
      }
      
      try {
        const res = await fetch('/api/v1/admin/platform/stats', {
          headers: { 'Authorization': 'Bearer ' + token }
        })
        const data = await res.json()
        apiResult.value = JSON.stringify(data, null, 2)
        platform.value = data
      } catch (e) {
        apiResult.value = 'Error: ' + e.message
      }
    }

    function formatMoney(amount) {
      if (!amount) return '0'
      return (amount / 100).toFixed(2)
    }

    function goDashboard() {
      console.log('Navigating to /dashboard')
      console.log('Before nav - isLoggedIn:', store.isLoggedIn)
      console.log('Before nav - localStorage:', localStorage.getItem('admin_token') ? '有' : '无')
      router.push('/dashboard')
    }

    function goLogin() {
      router.push('/login')
    }

    return {
      currentPath,
      isLoggedIn,
      hasLocalToken,
      apiResult,
      platform,
      doLogin,
      clearToken,
      testApi,
      formatMoney,
      goDashboard,
      goLogin
    }
  }
}
</script>
