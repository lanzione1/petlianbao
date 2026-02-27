App({
  globalData: {
    userInfo: null,
    token: null,
    merchantId: null,
    merchant: null,
    apiBase: 'http://localhost:3000/api/v1',
    loginPromise: null,
    // 客户选择模式相关
    selectCustomerMode: false,
    selectedCustomer: null,
    returnToPage: null
  },

  onLaunch() {
    console.log('App Launch')
    this.loadMerchantData()
  },

  async loadMerchantData() {
    const token = wx.getStorageSync('token')
    const merchant = wx.getStorageSync('merchant')
    
    if (token) {
      this.globalData.token = token
    }
    
    console.log('Loaded from storage - merchant:', merchant)
    
    if (merchant && merchant.id && merchant.shopName && merchant.ownerName && merchant.phone) {
      this.globalData.merchant = merchant
      this.globalData.merchantId = merchant.id
      console.log('Merchant info complete:', merchant.shopName)
    } else {
      console.log('Merchant info incomplete or not found')
    }
    
    await this.checkMerchant()
  },

  async checkMerchant() {
    const merchant = this.globalData.merchant
    const token = this.globalData.token
    
    console.log('checkMerchant called, merchant:', merchant, 'token:', token)
    
    // 如果有token且有商家ID，认为已登录
    if (token && merchant && (merchant.shopName || merchant.id)) {
      console.log('Merchant logged in, staying on current page')
      return true
    } else if (!token) {
      console.log('No token, redirecting to register page')
      wx.reLaunch({ url: '/pages/auth/register' })
      return false
    } else {
      console.log('Token exists but merchant info incomplete')
      return true // 让用户留在当前页面
    }
  },

  async waitForMerchant() {
    if (this.globalData.loginPromise) {
      return this.globalData.loginPromise
    }
    return this.checkMerchant()
  },

  async waitForLogin() {
    return this.waitForMerchant()
  },

  isMerchantRegistered() {
    const m = this.globalData.merchant
    return !!(m && m.shopName && m.ownerName && m.phone)
  },

  isLoggedIn() {
    return this.isMerchantRegistered()
  },

  logout() {
    this.globalData.token = null
    this.globalData.merchantId = null
    this.globalData.merchant = null
    this.globalData.userInfo = null
    this.globalData.loginPromise = null
    wx.removeStorageSync('token')
    wx.removeStorageSync('merchantId')
    wx.removeStorageSync('merchant')
    wx.reLaunch({ url: '/pages/auth/register' })
  }
})