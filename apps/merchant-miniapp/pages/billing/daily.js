const { api } = require('../../utils/api.js')

Page({
  data: {
    date: '',
    dateText: '',
    report: {},
    paymentList: [],
    cashExpected: 0,
    cashActual: '',
    cashDiff: 0,
    methodText: {
      wechat: '微信支付',
      alipay: '支付宝',
      cash: '现金',
      member: '会员余额'
    }
  },

  onLoad() {
    this.initDate()
  },

  onShow() {
    this.loadReport()
  },

  initDate() {
    const now = new Date()
    const date = this.formatDate(now)
    const dateText = this.formatDateText(now)
    this.setData({ date, dateText })
  },

  formatDate(date) {
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  formatDateText(date) {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const y = date.getFullYear()
    const m = date.getMonth() + 1
    const d = date.getDate()
    const w = weekDays[date.getDay()]
    return `${y}年${m}月${d}日 ${w}`
  },

  prevDay() {
    const current = new Date(this.data.date)
    current.setDate(current.getDate() - 1)
    this.setData({
      date: this.formatDate(current),
      dateText: this.formatDateText(current)
    })
    this.loadReport()
  },

  nextDay() {
    const current = new Date(this.data.date)
    current.setDate(current.getDate() + 1)
    this.setData({
      date: this.formatDate(current),
      dateText: this.formatDateText(current)
    })
    this.loadReport()
  },

  async loadReport() {
    try {
      const report = await api.getDailyReport(this.data.date)
      
      const paymentList = []
      const breakdown = report.paymentBreakdown || {}
      const methodText = { wechat: '微信支付', alipay: '支付宝', cash: '现金', member: '会员余额' }
      
      Object.keys(breakdown).forEach(method => {
        paymentList.push({
          method,
          amount: breakdown[method].amount || breakdown[method],
          count: breakdown[method].count || 0
        })
      })

      const cashExpected = breakdown.cash?.amount || breakdown.cash || 0

      this.setData({ 
        report, 
        paymentList,
        cashExpected
      })
    } catch (e) {
      console.error('加载报表失败', e)
    }
  },

  onCashInput(e) {
    const cashActual = parseFloat(e.detail.value) || 0
    const cashDiff = cashActual - this.data.cashExpected
    this.setData({ cashActual: e.detail.value, cashDiff })
  },

  async closeDay() {
    const cashActual = parseFloat(this.data.cashActual) || 0
    
    wx.showModal({
      title: '确认日结',
      content: `确认结束今日营业？\n实收现金: ¥${cashActual}`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.closeDay(cashActual)
            wx.showToast({ title: '日结成功', icon: 'success' })
          } catch (e) {
            wx.showToast({ title: '日结失败', icon: 'none' })
          }
        }
      }
    })
  }
})
