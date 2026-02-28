const { api } = require('../../utils/api.js')

Page({
  data: {
    autoRules: {
      inactiveReminder: true,
      birthdayGreeting: true,
      serviceFollowUp: true
    },
    campaigns: []
  },

  onShow() {
    this.loadCampaigns()
  },

  async loadCampaigns() {
    try {
      const campaigns = await api.getCampaigns()
      this.setData({
        campaigns: (campaigns || []).map(c => ({
          ...c,
          createdAtText: this.formatDate(c.createdAt)
        }))
      })
    } catch (e) {
      console.error('加载活动失败', e)
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  },

  toggleRule(e) {
    const rule = e.currentTarget.dataset.rule
    const value = e.detail.value
    this.setData({
      [`autoRules.${rule}`]: value
    })
  },

  goPoster() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  goCoupon() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  goBirthday() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  goBroadcast() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  }
})
