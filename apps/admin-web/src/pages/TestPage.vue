<template>
  <div style="padding: 40px; background: white; min-height: 100vh;">
    <h1 style="color: #333; font-size: 24px;">Vue 正常工作!</h1>
    <p style="color: #666;">当前时间: {{ now }}</p>
    <p style="color: #666;">Token: {{ tokenPreview }}</p>
    <button @click="testApi" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">测试API</button>
    <div v-if="result" style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 4px;">
      {{ result }}
    </div>
    <div style="margin-top: 20px;">
      <a href="/login" style="color: #667eea;">去登录页</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const now = ref(new Date().toLocaleString())
const result = ref('')

const tokenPreview = computed(() => {
  const token = localStorage.getItem('admin_token')
  return token ? token.substring(0, 20) + '...' : '未设置'
})

onMounted(() => {
  setInterval(() => {
    now.value = new Date().toLocaleString()
  }, 1000)
})

async function testApi() {
  try {
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/v1/admin/platform/stats', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    const data = await res.json()
    result.value = JSON.stringify(data, null, 2)
  } catch (e: any) {
    result.value = 'Error: ' + e.message
  }
}
</script>
