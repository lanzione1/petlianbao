<template>
  <div class="success-page">
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    </div>
    <h1>预约成功</h1>
    <p class="pet-name">亲爱的 {{ petName }} 家长</p>
    
    <div class="info-card">
      <p><strong>服务：</strong>{{ serviceName }}</p>
      <p><strong>时间：</strong>{{ date }} {{ time }}</p>
    </div>
    
    <div class="tips">
      <p>请准时到店，我们将为您提供优质服务</p>
      <p>如有变动，请提前联系商家</p>
    </div>
    
    <div class="actions">
      <button class="btn-primary" @click="goToMyAppointments">查看我的预约</button>
      <button class="btn-secondary" @click="goHome">返回首页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const petName = ref(route.query.petName as string || '')
const serviceName = ref(route.query.serviceName as string || '')
const time = ref(route.query.time as string || '')
const date = ref(route.query.date as string || '')

const goHome = () => {
  if (route.query.shop) {
    router.push('/?shop=' + route.query.shop)
  } else {
    router.push('/')
  }
}

const goToMyAppointments = () => {
  router.push('/my-appointments')
}
</script>

<style scoped>
.success-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f5f5f5;
}

.icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.icon svg {
  width: 40px;
  height: 40px;
}

h1 {
  color: #333;
  margin-bottom: 15px;
  font-size: 24px;
}

.pet-name {
  color: #666;
  font-size: 16px;
  margin-bottom: 20px;
}

.info-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 100%;
  max-width: 300px;
  margin-bottom: 20px;
}

.info-card p {
  margin: 8px 0;
  font-size: 15px;
  color: #333;
}

.info-card strong {
  color: #666;
}

.tips {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-bottom: 30px;
}

.tips p {
  margin: 5px 0;
}

.actions {
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary {
  width: 100%;
  padding: 14px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary {
  width: 100%;
  padding: 14px 40px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}
</style>
