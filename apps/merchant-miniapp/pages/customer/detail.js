const { api } = require('../../utils/api.js')

Page({
  data: {
    customerId: '',
    customer: {},
    history: [],
    avgPrice: 0,
    tagText: {
      recently_active: '近期活跃',
      high_value: '高价值',
      at_risk: '流失风险'
    }
  },

  onLoad(options) {
    this.setData({ customerId: options.id })
    this.loadCustomer()
    this.loadHistory()
  },

  onPullDownRefresh() {
    this.loadCustomer()
    this.loadHistory()
    wx.stopPullDownRefresh()
  },

  async loadCustomer() {
    try {
      const customer = await api.getCustomer(this.data.customerId)
      // 为宠物照片生成完整 URL
      if (customer.pets) {
        const app = getApp()
        const baseUrl = (app.globalData.apiBase || 'http://localhost:3000/api/v1').replace('/api/v1', '')
        customer.pets = customer.pets.map(pet => ({
          ...pet,
          photoUrl: pet.photo ? (pet.photo.startsWith('http') ? pet.photo : `${baseUrl}${pet.photo}`) : ''
        }))
      }
      const avgPrice = customer.visitCount > 0 
        ? Math.round(customer.totalSpent / customer.visitCount) 
        : 0
      this.setData({ customer, avgPrice })
    } catch (e) {
      console.error('加载客户失败', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async loadHistory() {
    try {
      const rawHistory = await api.getCustomerHistory(this.data.customerId)
      const history = (rawHistory || []).map(item => ({
        ...item,
        dateText: this.formatDate(item.createdAt),
        itemsText: this.formatItems(item.items)
      }))
      this.setData({ history })
    } catch (e) {
      console.error('加载历史失败', e)
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  formatItems(items) {
    if (!items || !items.length) return ''
    return items.map(i => i.name).join('、')
  },

  goBilling() {
    wx.navigateTo({
      url: `/pages/billing/index?customerId=${this.data.customerId}`
    })
  },

  editPet(e) {
    const petId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/pet/edit?id=${petId}&customerId=${this.data.customerId}` });
  },

  addPet() {
    wx.navigateTo({ url: `/pages/pet/edit?customerId=${this.data.customerId}` });
  },

  editCustomer() {
    wx.navigateTo({
      url: `/pages/customer/add?id=${this.data.customerId}`
    })
  },

  deleteCustomer() {
    const petCount = (this.data.customer.pets || []).length
    const hint = petCount > 0 
      ? `该客户有${petCount}只宠物档案，删除后将一并清除，且不可恢复。`
      : '删除后将无法恢复，确定继续？'
    wx.showModal({
      title: '确认删除客户',
      content: hint,
      confirmColor: '#FF3B30',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteCustomer(this.data.customerId)
            wx.showToast({ title: '已删除', icon: 'success' })
            setTimeout(() => wx.navigateBack(), 1000)
          } catch (e) {
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  onShow() {
    this.loadCustomer();
    this.loadHistory();
  }
})
