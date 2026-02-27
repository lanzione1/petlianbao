const { api } = require('../../utils/api.js')

Page({
  data: {
    selectedCustomer: null,
    services: [],
    selectedServices: {},
    customItems: [],
    totalAmount: 0,
    paymentMethod: 'wechat',
    loading: false,
    appointmentId: null
  },

  onLoad(options) {
    if (options.appointmentId) {
      this.setData({ appointmentId: options.appointmentId })
    }
    if (options.customerId) {
      this.loadCustomer(options.customerId)
    }
    this.loadServices()
  },

  async loadServices() {
    try {
      const data = await api.getServices()
      this.setData({ services: data })
    } catch (e) {
      console.error('加载服务失败', e)
    }
  },

  async loadCustomer(id) {
    try {
      const customer = await api.getCustomer(id)
      this.setData({ selectedCustomer: customer })
    } catch (e) {
      console.error('加载客户失败', e)
    }
  },

  selectCustomer() {
    wx.navigateTo({
      url: '/pages/customer/list?select=1'
    })
  },

  toggleService(e) {
    const id = e.currentTarget.dataset.id
    const selectedServices = { ...this.data.selectedServices }
    selectedServices[id] = !selectedServices[id]
    this.setData({ selectedServices })
    this.calculateTotal()
  },

  addCustomItem() {
    this.setData({
      customItems: [...this.data.customItems, { name: '', price: '' }]
    })
  },

  removeCustomItem(e) {
    const index = e.currentTarget.dataset.index
    const customItems = [...this.data.customItems]
    customItems.splice(index, 1)
    this.setData({ customItems })
    this.calculateTotal()
  },

  updateCustomName(e) {
    const index = e.currentTarget.dataset.index
    const customItems = [...this.data.customItems]
    customItems[index].name = e.detail.value
    this.setData({ customItems })
  },

  updateCustomPrice(e) {
    const index = e.currentTarget.dataset.index
    const customItems = [...this.data.customItems]
    customItems[index].price = e.detail.value
    this.setData({ customItems })
    this.calculateTotal()
  },

  calculateTotal() {
    let total = 0
    
    this.data.services.forEach(s => {
      if (this.data.selectedServices[s.id]) {
        total += Number(s.price)
      }
    })
    
    this.data.customItems.forEach(item => {
      total += parseFloat(item.price) || 0
    })
    
    this.setData({ totalAmount: total.toFixed(2) })
  },

  selectPayment(e) {
    this.setData({ paymentMethod: e.currentTarget.dataset.method })
  },

  async submitPayment() {
    if (!this.data.selectedCustomer) {
      wx.showToast({ title: '请选择客户', icon: 'none' })
      return
    }

    if (this.data.totalAmount <= 0) {
      wx.showToast({ title: '请选择服务', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    const items = [
      ...this.data.services
        .filter(s => this.data.selectedServices[s.id])
        .map(s => ({ name: s.name, price: Number(s.price), quantity: 1 })),
      ...this.data.customItems
        .filter(i => i.name && i.price)
        .map(i => ({ name: i.name, price: parseFloat(i.price), quantity: 1 }))
    ]

    try {
      await api.checkout({
        customerId: this.data.selectedCustomer.id,
        appointmentId: this.data.appointmentId,
        items,
        totalAmount: parseFloat(this.data.totalAmount),
        paymentMethod: this.data.paymentMethod
      })

      // 如果有预约ID，更新预约状态为已收银
      if (this.data.appointmentId) {
        await api.updateAppointment(this.data.appointmentId, {
          status: 'paid'
        })
      }

      wx.showToast({ title: '收款成功', icon: 'success' })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (e) {
      wx.showToast({ title: '收款失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
