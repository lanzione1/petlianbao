const { api } = require('../../utils/api.js')
const app = getApp()

Page({
  data: {
    appointmentId: '',
    loading: true,
    appointment: {
      customer: {},
      service: {},
      pets: []
    },
    history: [],
    statusText: {
      pending: '待服务',
      completed: '已完成',
      paid: '已收银',
      cancelled: '已取消'
    },
    statusIcon: {
      pending: '⏳',
      completed: '✨',
      paid: '💰',
      cancelled: '❌'
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ appointmentId: options.id })
      this.loadAppointmentDetail()
    } else {
      wx.showToast({ title: '预约ID不存在', icon: 'none' })
      wx.navigateBack()
    }
  },

  onShow() {
    // 刷新数据
    if (this.data.appointmentId) {
      this.loadAppointmentDetail()
    }
  },

  async loadAppointmentDetail() {
    this.setData({ loading: true })
    try {
      // 获取预约详情
      const appointment = await api.getAppointment(this.data.appointmentId)
      
      // 获取客户历史记录
      const history = await api.getCustomerHistory(appointment.customerId)
      
      this.setData({
        appointment,
        history: history.slice(0, 5), // 只显示最近5条
        loading: false
      })
    } catch (e) {
      console.error('加载预约详情失败', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  formatDateTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    const h = date.getHours().toString().padStart(2, '0')
    const min = date.getMinutes().toString().padStart(2, '0')
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const w = weekDays[date.getDay()]
    return `${y}年${m}月${d}日 ${w} ${h}:${min}`
  },

  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    return `${m}-${d}`
  },

  // 拨打客户电话
  callCustomer() {
    const phone = this.data.appointment.customer.phone
    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone,
        fail: () => {
          wx.showToast({ title: '拨打电话失败', icon: 'none' })
        }
      })
    }
  },

  // 完成服务
  completeService() {
    const appointment = this.data.appointment
    wx.navigateTo({
      url: `/pages/billing/index?appointmentId=${appointment.id}&customerId=${appointment.customerId}`
    })
  },

  // 取消预约
  cancelAppointment() {
    wx.showModal({
      title: '取消预约',
      content: '确定要取消这个预约吗？取消后无法恢复。',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.updateAppointment(this.data.appointmentId, { status: 'cancelled' })
            wx.showToast({ title: '预约已取消', icon: 'success' })
            this.loadAppointmentDetail()
          } catch (e) {
            wx.showToast({ title: '取消失败', icon: 'none' })
          }
        }
      }
    })
  }
})
