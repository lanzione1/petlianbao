const app = getApp()

Page({
  data: {
    userInfo: {},
    isAdmin: true
  },

  onShow() {
    this.loadUserInfo()
  },

  loadUserInfo() {
    const merchant = app.globalData.merchant
    if (merchant) {
      this.setData({ 
        userInfo: merchant,
        isAdmin: merchant.role === 'admin'
      })
    }
  },

  goServices() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  goReports() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  goSettings() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  goStaff() {
    wx.navigateTo({ url: '/pages/staff/index' })
  },

  goLogs() {
    wx.navigateTo({ url: '/pages/logs/index' })
  },

  upgrade() {
    wx.showModal({
      title: '升级专业版',
      content: '专业版 ¥299/年，无限客户和预约',
      confirmText: '立即升级',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '功能开发中', icon: 'none' })
        }
      }
    })
  },

  feedback() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  about() {
    wx.showModal({
      title: '宠联宝',
      content: '小微宠物服务数字化工具箱\n版本: 1.0.0',
      showCancel: false
    })
  },

  devSeed() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '创建测试数据',
      content: '将创建5个客户、5个服务项目、3个预约，是否继续？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '创建中...' });
          wx.request({
            url: 'http://localhost:3000/api/v1/dev/seed',
            method: 'POST',
            header: { 'Authorization': `Bearer ${token}` },
            success: (r) => {
              wx.hideLoading();
              wx.showToast({ title: '创建成功', icon: 'success' });
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({ title: '创建失败', icon: 'none' });
            }
          });
        }
      }
    });
  }
})
