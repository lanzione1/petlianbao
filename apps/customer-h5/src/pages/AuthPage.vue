<template>
  <div class="auth-page">
    <div class="loading" v-if="loading">
      <div class="spinner"></div>
      <p>正在授权...</p>
    </div>
    <div class="error" v-else-if="error">
      <div class="error-icon">❌</div>
      <p>{{ error }}</p>
      <button @click="retry">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const code = route.query.code as string
  const state = route.query.state as string

  if (!code) {
    error.value = '授权码缺失'
    loading.value = false
    return
  }

  try {
    const { data } = await axios.get('/api/v1/h5/auth/wechat/callback', {
      params: { code, state }
    })

    if (data.success) {
      userStore.setToken(data.data.token)
      userStore.setCustomer(data.data.customer)
      
      const redirect = route.query.redirect as string || '/appointments'
      router.replace(redirect)
    }
  } catch (e: any) {
    console.error('Auth failed:', e)
    error.value = e.response?.data?.message || '授权失败，请重试'
  } finally {
    loading.value = false
  }
})

function retry() {
  loading.value = true
  error.value = ''
  window.location.reload()
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading, .error {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error p {
  margin: 0 0 16px;
  color: #666;
}

.error button {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.error button:hover {
  opacity: 0.9;
}
</style>