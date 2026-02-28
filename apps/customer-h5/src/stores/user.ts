import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Customer {
  id: string
  nickname?: string
  avatar?: string
  phone?: string
  merchantId?: string
  customerName?: string
  isNewCustomer?: boolean
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('h5_token') || '')
  const customer = ref<Customer | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  // 初始化时从 localStorage 恢复 customer
  const savedCustomer = localStorage.getItem('h5_customer')
  if (savedCustomer) {
    try {
      customer.value = JSON.parse(savedCustomer)
    } catch {
      localStorage.removeItem('h5_customer')
    }
  }

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('h5_token', newToken)
    console.log('Token saved:', newToken.substring(0, 20) + '...')
  }

  function setCustomer(newCustomer: Customer) {
    customer.value = newCustomer
    localStorage.setItem('h5_customer', JSON.stringify(newCustomer))
    console.log('Customer saved:', newCustomer)
  }

  function logout() {
    token.value = ''
    customer.value = null
    localStorage.removeItem('h5_token')
    localStorage.removeItem('h5_customer')
  }

  return {
    token,
    customer,
    isLoggedIn,
    setToken,
    setCustomer,
    logout,
  }
})