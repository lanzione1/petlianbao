const { api } = require('../../utils/api.js')
const app = getApp()

Page({
  data: {
    date: '',
    dateText: '',
    currentTab: 'pending',
    appointments: [],
    pendingCount: 0,
    completedCount: 0,
    customerCancelledCount: 0,
    currentAppointments: [],
    summary: {},
    reminderCount: 0,
    searchKeyword: '',
    statusText: {
      pending: '待服务',
      completed: '已完成',
      paid: '已收银',
      cancelled_by_merchant: '店家取消',
      cancelled_by_customer: '客户取消'
    },
    loading: true,
    lastTab: 'pending' // 记录跳转前的标签页
  },

  onLoad() {
    this.initDate()
  },

  async onShow() {
    console.log('Page onShow, waiting for login...')
    const loggedIn = await app.waitForLogin()
    if (!loggedIn) {
      console.log('Not logged in, skipping data load')
      return
    }
    console.log('Login ready, loading data...')
    
    this.setData({ loading: true })
    await Promise.all([
      this.loadAppointments(),
      this.loadSummary(),
      this.loadReminderCount()
    ])
    this.setData({ loading: false })
    
    // 恢复之前的标签页
    if (this.data.lastTab !== this.data.currentTab) {
      this.setData({ 
        currentTab: this.data.lastTab,
        currentAppointments: this.filterAppointments(this.data.appointments, this.data.lastTab)
      })
    }
  },

  onPullDownRefresh() {
    this.loadAppointments()
    this.loadSummary()
    wx.stopPullDownRefresh()
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
    this.loadAppointments()
  },

  nextDay() {
    const current = new Date(this.data.date)
    current.setDate(current.getDate() + 1)
    this.setData({
      date: this.formatDate(current),
      dateText: this.formatDateText(current)
    })
    this.loadAppointments()
  },

  switchTab(e) {
    const currentTab = e.currentTarget.dataset.tab
    const currentAppointments = this.filterAppointments(this.data.appointments, currentTab)
    this.setData({ 
      currentTab, 
      currentAppointments,
      lastTab: currentTab // 记录当前标签
    })
  },

  filterAppointments(appointments, tab) {
    // 合并 completed 和 paid 状态到 completed 标签
    const statusMap = {
      'pending': ['pending'],
      'completed': ['completed', 'paid'],
      'customer_cancelled': ['cancelled_by_customer']
    }
      
    let filtered = appointments.filter(a => statusMap[tab]?.includes(a.status))
      
    // 如果有搜索关键词，进一步筛选
    const keyword = this.data.searchKeyword.trim().toLowerCase()
    if (keyword) {
      filtered = filtered.filter(a => {
        const petName = (a.customer?.petName || '').toLowerCase()
        const phone = (a.customer?.phone || '').toLowerCase()
        return petName.includes(keyword) || phone.includes(keyword)
      })
    }
      
    return filtered
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  // 执行搜索
  onSearch() {
    const currentAppointments = this.filterAppointments(this.data.appointments, this.data.currentTab)
    this.setData({ currentAppointments })
  },

  // 清空搜索
  clearSearch() {
    this.setData({ searchKeyword: '' })
    const currentAppointments = this.filterAppointments(this.data.appointments, this.data.currentTab)
    this.setData({ currentAppointments })
  },

  async loadAppointments() {
    try {
      const data = await api.getAppointments(this.data.date)
      const appointments = data.map(a => ({
        ...a,
        timeStr: this.formatTime(a.appointmentTime)
      }))
      
      // 计算各种数量
      const pendingCount = appointments.filter(a => a.status === 'pending').length
      const completedCount = appointments.filter(a => a.status === 'completed' || a.status === 'paid').length
      const customerCancelledCount = appointments.filter(a => 
        a.status === 'cancelled_by_customer' && !a.followedUpAt
      ).length
      const todayTotalCount = appointments.length // 今日总预约数
      const currentAppointments = this.filterAppointments(appointments, this.data.currentTab)
      
      this.setData({ 
        appointments, 
        pendingCount,
        completedCount,
        customerCancelledCount,
        todayTotalCount,
        currentAppointments
      })
      console.log('Loaded appointments:', appointments.length, 'pending:', pendingCount, 'completed:', completedCount)
    } catch (e) {
      console.error('加载预约失败', e)
    }
  },

  formatTime(dateStr) {
    const date = new Date(dateStr)
    const h = date.getHours().toString().padStart(2, '0')
    const m = date.getMinutes().toString().padStart(2, '0')
    return `${h}:${m}`
  },

  async loadSummary() {
    try {
      const data = await api.getDailySummary()
      this.setData({ summary: data })
      console.log('Loaded summary:', data)
    } catch (e) {
      console.error('加载统计失败', e)
    }
  },

  async loadReminderCount() {
    try {
      const data = await api.getReminders('all', 7)
      this.setData({ reminderCount: data.length })
    } catch (e) {
      console.error('加载提醒数失败', e)
    }
  },

  goReminders() {
    wx.navigateTo({ url: '/pages/pet/reminder/index' })
  },

  async completeService(e) {
    const id = e.currentTarget.dataset.id
    const appointment = this.data.appointments.find(a => a.id === id)
    if (!appointment) return

    // 加载店员列表
    try {
      const staffs = await api.getStaffs()
      const staffItems = staffs.map(s => s.nickname || '店员')
      
      wx.showActionSheet({
        itemList: staffItems,
        success: async (res) => {
          const selectedStaff = staffs[res.tapIndex]
          
          wx.showLoading({ title: '处理中...' })
          
          try {
            // 更新预约状态为已完成，记录完成店员和时间
            await api.updateAppointment(id, {
              status: 'completed',
              completedByStaffId: selectedStaff.id,
              completedByStaffName: selectedStaff.nickname
            })
            
            wx.hideLoading()
            wx.showToast({ title: '服务完成', icon: 'success' })
            
            // 刷新预约列表
            this.loadAppointments()
            
            // 跳转到收银页面
            setTimeout(() => {
              wx.navigateTo({
                url: `/pages/billing/index?appointmentId=${id}&customerId=${appointment.customerId}`
              })
            }, 1000)
          } catch (e) {
            wx.hideLoading()
            wx.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      })
    } catch (e) {
      console.error('加载店员失败', e)
      wx.showToast({ title: '加载店员失败', icon: 'none' })
    }
  },

  async cancelAppointment(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '取消预约',
      content: '确定要取消这个预约吗？',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.updateAppointment(id, { status: 'cancelled_by_merchant' })
            wx.showToast({ title: '预约已取消', icon: 'success' })
            this.loadAppointments()
          } catch (e) {
            wx.showToast({ title: '取消失败', icon: 'none' })
          }
        }
      }
    })
  },

  showDetail(e) {
    const id = e.currentTarget.dataset.id
    const appointment = this.data.appointments.find(a => a.id === id)
    if (!appointment) return
    
    // 跳转前保存当前标签页
    this.setData({ lastTab: this.data.currentTab })
    
    // 所有状态都跳转到客户详情页，方便查看客户信息
    wx.navigateTo({
      url: `/pages/customer/detail?id=${appointment.customerId}`
    })
  },

  // 导航栏右侧按钮点击
  onNavigationBarRightButtonTap() {
    wx.navigateTo({
      url: '/pages/appointment/create'
    })
  },

  // 快速添加预约（浮动按钮方式）
  quickAddAppointment() {
    wx.navigateTo({
      url: '/pages/appointment/create'
    })
  },

  // 致电客户
  callCustomer(e) {
    const phone = e.currentTarget.dataset.phone
    if (!phone) {
      wx.showToast({ title: '无客户电话', icon: 'none' })
      return
    }
    wx.makePhoneCall({ phoneNumber: phone })
  },

  // 标记已回访
  async markFollowedUp(e) {
    const id = e.currentTarget.dataset.id
    
    try {
      await api.updateAppointment(id, { followedUpAt: new Date().toISOString() })
      wx.showToast({ title: '已标记为已回访', icon: 'success' })
      this.loadAppointments()
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 生成测试数据（开发调试用）
  async seedTestData() {
    wx.showModal({
      title: '生成测试数据',
      content: '这将创建5个客户、7个宠物、5个服务和3个预约，确定继续？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '生成中...' })
          try {
            const result = await api.seedTestData()
            wx.hideLoading()
            wx.showToast({ 
              title: `创建${result.customers}个客户`, 
              icon: 'success' 
            })
            this.loadAppointments()
            this.loadSummary()
          } catch (e) {
            wx.hideLoading()
            wx.showToast({ title: '生成失败', icon: 'none' })
          }
        }
      }
    })
  }
})
