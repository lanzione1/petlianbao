const app = getApp()

const request = (options) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.apiBase + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          app.logout()
          wx.showToast({ title: '请重新登录', icon: 'none' })
          reject(new Error('Unauthorized'))
        } else {
          wx.showToast({ title: res.data?.message || '请求失败', icon: 'none' })
          reject(res.data)
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      }
    })
  })
}

const api = {
  // 认证
  login: (code) => request({ url: '/auth/wechat/login', method: 'POST', data: { code } }),
  getProfile: () => request({ url: '/auth/profile' }),
  updateProfile: (data) => request({ url: '/auth/profile', method: 'POST', data }),

  // 服务
  getServices: () => request({ url: '/services' }),
  createService: (data) => request({ url: '/services', method: 'POST', data }),
  updateService: (id, data) => request({ url: `/services/${id}`, method: 'PUT', data }),
  deleteService: (id) => request({ url: `/services/${id}`, method: 'DELETE' }),

  // 预约
  getAppointments: (date) => request({ url: `/appointments${date ? '?date=' + date : ''}` }),
  getTodayAppointments: () => request({ url: '/appointments/today' }),
  getAppointment: (id) => request({ url: `/appointments/${id}` }),
  createAppointment: (data) => request({ url: '/appointments', method: 'POST', data }),
  updateAppointment: (id, data) => request({ url: `/appointments/${id}`, method: 'PUT', data }),
  deleteAppointment: (id) => request({ url: `/appointments/${id}`, method: 'DELETE' }),

  // 客户
  getCustomers: (params) => {
    const query = Object.entries(params || {}).filter(([_, v]) => v).map(([k, v]) => `${k}=${v}`).join('&')
    return request({ url: `/customers${query ? '?' + query : ''}` })
  },
  getCustomer: (id) => request({ url: `/customers/${id}` }),
  createCustomer: (data) => request({ url: '/customers', method: 'POST', data }),
  updateCustomer: (id, data) => request({ url: `/customers/${id}`, method: 'PUT', data }),
  getCustomerHistory: (id) => request({ url: `/customers/${id}/history` }),
  deleteCustomer: (id) => request({ url: `/customers/${id}`, method: 'DELETE' }),
  getInactiveCustomers: () => request({ url: '/customers/inactive' }),

  // 宠物
  getPetsByCustomer: (customerId) => request({ url: `/pets/customer/${customerId}` }),
  deletePet: (id) => request({ url: `/pets/${id}`, method: 'DELETE' }),

  // 收银
  checkout: (data) => request({ url: '/billing/checkout', method: 'POST', data }),
  getTodayTransactions: () => request({ url: '/billing/today' }),
  getDailySummary: () => request({ url: '/billing/daily-summary' }),
  closeDay: (cashAmount) => request({ url: '/billing/close-day', method: 'POST', data: { cashAmount } }),

  // 报表
  getDailyReport: (date) => request({ url: `/reports/daily${date ? '?date=' + date : ''}` }),
  getMonthlyReport: (year, month) => request({ url: `/reports/monthly?year=${year}&month=${month}` }),
  getCustomerReport: () => request({ url: '/reports/customers' }),
  getServiceReport: () => request({ url: '/reports/services' }),

  // 营销
  getMarketingTemplates: (type) => request({ url: `/marketing/templates?type=${type}` }),
  getCampaigns: () => request({ url: '/marketing/campaigns' }),
  createCampaign: (data) => request({ url: '/marketing', method: 'POST', data }),
  sendCoupon: (customerIds, coupon) => request({ url: '/marketing/coupon', method: 'POST', data: { customerIds, coupon } }),
  sendBroadcast: (customerIds, message) => request({ url: '/marketing/broadcast', method: 'POST', data: { customerIds, message } }),

  // 开发调试
  seedTestData: () => request({ url: '/dev/seed', method: 'POST' }),
  clearTestData: () => request({ url: '/dev/clear', method: 'POST' }),

  // 宠物提醒
  getReminders: (type, days) => request({ url: `/pets/reminders?type=${type || 'all'}&days=${days || 7}` }),
  getReminderTemplates: () => request({ url: '/pets/reminders/templates' }),
  updateReminderTemplates: (data) => request({ url: '/pets/reminders/templates', method: 'PUT', data }),
  sendReminders: (data) => request({ url: '/pets/reminders/send', method: 'POST', data }),

  // 店员管理
  getStaffs: () => request({ url: '/staffs' }),
  createStaff: (data) => request({ url: '/staffs', method: 'POST', data }),
  deleteStaff: (id) => request({ url: `/staffs/${id}`, method: 'DELETE' }),
  updateStaffStatus: (id, status) => request({ url: `/staffs/${id}/status`, method: 'PUT', data: { status } }),
}

module.exports = { api, request }
