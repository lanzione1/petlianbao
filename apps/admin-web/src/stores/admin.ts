import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminApi } from '@/api'

export const useAdminStore = defineStore('admin', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const admin = ref<any>(null)

  const isLoggedIn = computed(() => !!token.value)

  async function login(username: string, password: string) {
    const res: any = await adminApi.login(username, password)
    token.value = res.access_token
    admin.value = res.admin
    localStorage.setItem('admin_token', res.access_token)
    return res
  }

  function logout() {
    token.value = ''
    admin.value = null
    localStorage.removeItem('admin_token')
  }

  return {
    token,
    admin,
    isLoggedIn,
    login,
    logout,
  }
})
