const { api } = require('../../utils/api.js')

Page({
  data: {
    currentTab: 'daily',
    dailyDate: '',
    monthlyDate: '',
    dailyReport: {},
    monthlyReport: {},
    customerReport: {}
  },

  onLoad() {
    this.initDates()
  },

  onShow() {
    this.loadReports()
  },

  initDates() {
    const now = new Date()
    const dailyDate = this.formatDate(now)
    const monthlyDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
    this.setData({ dailyDate, monthlyDate })
  },

  formatDate(date) {
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    this.loadReports()
  },

  onDailyDateChange(e) {
    this.setData({ dailyDate: e.detail.value })
    this.loadDailyReport()
  },

  onMonthlyDateChange(e) {
    this.setData({ monthlyDate: e.detail.value })
    this.loadMonthlyReport()
  },

  async loadReports() {
    if (this.data.currentTab === 'daily') {
      await this.loadDailyReport()
    } else if (this.data.currentTab === 'monthly') {
      await this.loadMonthlyReport()
    } else {
      await this.loadCustomerReport()
    }
  },

  async loadDailyReport() {
    try {
      const report = await api.getDailyReport(this.data.dailyDate)
      this.setData({ dailyReport: report || {} })
    } catch (e) {
      console.error('加载日报失败', e)
    }
  },

  async loadMonthlyReport() {
    try {
      const [year, month] = this.data.monthlyDate.split('-')
      const report = await api.getMonthlyReport(parseInt(year), parseInt(month))
      
      // 计算柱状图高度
      const dailyStats = (report.dailyStats || []).map(item => ({
        ...item,
        height: report.totalRevenue > 0 ? Math.min(100, (item.revenue / report.totalRevenue) * 100 * 3) : 0
      }))
      
      this.setData({ 
        monthlyReport: { ...report, dailyStats }
      })
    } catch (e) {
      console.error('加载月报失败', e)
    }
  },

  async loadCustomerReport() {
    try {
      const report = await api.getCustomerReport()
      this.setData({ customerReport: report || {} })
    } catch (e) {
      console.error('加载客户报表失败', e)
    }
  },

  onPullDownRefresh() {
    this.loadReports()
    wx.stopPullDownRefresh()
  }
})
