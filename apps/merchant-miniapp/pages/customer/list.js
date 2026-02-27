const { api } = require('../../utils/api.js')
const app = getApp()

Page({
  data: {
    customers: [],
    searchText: '',
    filter: 'all',
    selectMode: false // 选择模式
  },

  onLoad(options) {
    // 检查是否是选择模式（通过全局数据判断）
    if (app.globalData.selectCustomerMode) {
      this.setData({ selectMode: true })
      wx.setNavigationBarTitle({ title: '选择客户' })
      console.log('选择模式已启用')
    }
  },

  onShow() {
    // 每次显示时检查选择模式
    if (app.globalData.selectCustomerMode) {
      this.setData({ selectMode: true })
      wx.setNavigationBarTitle({ title: '选择客户' })
    } else {
      this.setData({ selectMode: false })
      wx.setNavigationBarTitle({ title: '客户管理' })
    }
    this.loadCustomers()
  },

  onPullDownRefresh() {
    this.loadCustomers()
    wx.stopPullDownRefresh()
  },

  onSearch(e) {
    this.setData({ searchText: e.detail.value })
    this.loadCustomers()
  },

  clearSearch() {
    this.setData({ searchText: '' })
    this.loadCustomers()
  },

  switchFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.filter })
    this.loadCustomers()
  },

  async loadCustomers() {
    try {
      const params = {
        search: this.data.searchText || undefined,
        inactive: this.data.filter === 'inactive' ? true : undefined
      }
      
      const data = await api.getCustomers(params)
      const customers = (data.list || data).map(c => ({
        ...c,
        lastVisitAtText: this.formatLastVisit(c.lastVisitAt)
      }))
      
      this.setData({ customers })
    } catch (e) {
      console.error('加载客户失败', e)
    }
  },

  formatLastVisit(dateStr) {
    if (!dateStr) return '从未到店'
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    if (diff === 0) return '今天'
    if (diff === 1) return '昨天'
    if (diff < 7) return `${diff}天前`
    return `${date.getMonth() + 1}/${date.getDate()}`
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    const customer = this.data.customers.find(c => c.id === id)
    
    // 如果是选择模式，保存选中的客户并返回
    if (this.data.selectMode) {
      console.log('选中客户:', customer)
      app.globalData.selectedCustomer = customer
      
      // 返回预约创建页面
      wx.switchTab({
        url: '/pages/index/index',
        success: () => {
          // 延迟跳转到预约创建页
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/appointment/create'
            })
          }, 300)
        }
      })
      return
    }
    
    wx.navigateTo({ url: `/pages/customer/detail?id=${id}` })
  },

  addCustomer() {
    wx.navigateTo({ url: '/pages/customer/add' })
  }
})
