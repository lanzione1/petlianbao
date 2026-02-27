const { api } = require('../../utils/api.js')
const app = getApp()

Page({
  data: {
    selectedCustomer: null,
    pets: [],
    selectedPets: [],
    services: [],
    selectedService: null,
    appointmentTime: '',
    timeRange: [[], [], []],
    timeIndex: [0, 0, 0],
    notes: '',
    canSubmit: false,
    loadingPets: false,
    petsLoaded: false
  },

  onLoad() {
    this.loadServices()
    this.initTimeRange()
  },

  onShow() {
    // 检查是否有选中的客户（从客户列表页返回）
    if (app.globalData.selectCustomerMode && app.globalData.selectedCustomer) {
      const customer = app.globalData.selectedCustomer
      console.log('从客户列表返回，选中客户:', customer)
      this.setData({ selectedCustomer: customer })
      this.loadCustomerPets(customer.id)
      this.checkCanSubmit()
      // 清除全局数据
      app.globalData.selectedCustomer = null
      app.globalData.selectCustomerMode = false
    }
    
    // 如果已有客户，刷新宠物列表（从添加宠物页返回）
    if (this.data.selectedCustomer && !app.globalData.selectCustomerMode) {
      this.loadCustomerPets(this.data.selectedCustomer.id)
    }
  },

  // 初始化时间选择器
  initTimeRange() {
    const days = []
    const hours = []
    const minutes = []

    // 生成未来7天的日期
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const month = date.getMonth() + 1
      const day = date.getDate()
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const week = weekDays[date.getDay()]
      days.push(`${month}月${day}日 ${week}`)
    }

    // 生成小时 (9-21点)
    for (let i = 9; i <= 21; i++) {
      hours.push(`${i.toString().padStart(2, '0')}时`)
    }

    // 生成分钟 (0, 15, 30, 45)
    minutes.push('00分', '15分', '30分', '45分')

    this.setData({
      timeRange: [days, hours, minutes]
    })
  },

  // 加载服务列表
  async loadServices() {
    try {
      const services = await api.getServices()
      this.setData({ services })
    } catch (e) {
      console.error('加载服务失败', e)
    }
  },

  // 选择客户
  selectCustomer() {
    // 设置全局标志，表示正在选择客户
    app.globalData.selectCustomerMode = true
    app.globalData.selectedCustomer = null
    app.globalData.returnToPage = '/pages/appointment/create'
    
    // 使用 switchTab 跳转到客户列表页（tabBar 页面不能用 navigateTo）
    wx.switchTab({
      url: '/pages/customer/list',
      success: () => {
        console.log('跳转客户列表成功')
      },
      fail: (err) => {
        console.error('跳转客户列表失败:', err)
        wx.showToast({ title: '跳转失败', icon: 'none' })
      }
    })
  },

  // 加载客户宠物
  async loadCustomerPets(customerId) {
    this.setData({ loadingPets: true, petsLoaded: false })
    try {
      const pets = await api.getPetsByCustomer(customerId)
      console.log('loadCustomerPets result:', pets)
      const selectedPets = (pets && pets.length > 0) ? [pets[0].id] : []
      console.log('auto selected pets:', selectedPets)
      this.setData({ 
        pets: pets || [],
        selectedPets: selectedPets,
        loadingPets: false,
        petsLoaded: true
      })
      this.checkCanSubmit()
    } catch (e) {
      console.error('加载宠物失败', e)
      this.setData({ 
        pets: [], 
        selectedPets: [],
        loadingPets: false,
        petsLoaded: true
      })
      wx.showToast({ title: '加载宠物失败', icon: 'none' })
    }
  },

  // 切换宠物选择
  togglePet(e) {
    console.log('togglePet clicked', e)
    const petId = e.currentTarget.dataset.id
    console.log('petId:', petId)
    const selectedPets = this.data.selectedPets
    console.log('before selectedPets:', selectedPets)
    const index = selectedPets.indexOf(petId)
    
    if (index > -1) {
      selectedPets.splice(index, 1)
    } else {
      selectedPets.push(petId)
    }
    
    console.log('after selectedPets:', selectedPets)
    this.setData({ selectedPets: [...selectedPets] })
    this.checkCanSubmit()
  },

  // 添加宠物
  addPet() {
    if (!this.data.selectedCustomer) {
      wx.showToast({ title: '请先选择客户', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/pet/edit?customerId=${this.data.selectedCustomer.id}`
    })
  },

  // 选择服务
  selectService(e) {
    const service = e.currentTarget.dataset.service
    this.setData({ selectedService: service })
    this.checkCanSubmit()
  },

  // 时间列改变
  onTimeColumnChange(e) {
    const { column, value } = e.detail
    const timeIndex = this.data.timeIndex
    timeIndex[column] = value
    this.setData({ timeIndex })
  },

  // 时间改变
  onTimeChange(e) {
    const timeIndex = e.detail.value
    const [dayIndex, hourIndex, minuteIndex] = timeIndex
    const day = this.data.timeRange[0][dayIndex]
    const hour = this.data.timeRange[1][hourIndex]
    const minute = this.data.timeRange[2][minuteIndex]
    
    // 计算实际时间
    const date = new Date()
    date.setDate(date.getDate() + dayIndex)
    date.setHours(9 + hourIndex, minuteIndex * 15, 0, 0)
    
    const appointmentTime = date.toISOString()
    
    this.setData({ 
      timeIndex,
      appointmentTime,
      appointmentTimeText: `${day} ${hour.replace('时', ':')}${minute.replace('分', '')}`
    })
    this.checkCanSubmit()
  },

  // 备注输入
  onNotesInput(e) {
    this.setData({ notes: e.detail.value })
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { selectedCustomer, selectedPets, selectedService, appointmentTime } = this.data
    const canSubmit = selectedCustomer && selectedPets.length > 0 && selectedService && appointmentTime
    this.setData({ canSubmit })
  },

  // 提交预约
  async submitAppointment() {
    if (!this.data.canSubmit) return

    const { selectedCustomer, selectedPets, selectedService, appointmentTime, notes } = this.data

    wx.showLoading({ title: '提交中...' })

    try {
      await api.createAppointment({
        customerId: selectedCustomer.id,
        petIds: selectedPets,
        serviceId: selectedService.id,
        appointmentTime,
        notes
      })

      wx.hideLoading()
      wx.showToast({ title: '预约成功', icon: 'success' })

      // 返回上一页并刷新
      setTimeout(() => {
        wx.navigateBack()
        const pages = getCurrentPages()
        const prevPage = pages[pages.length - 2]
        if (prevPage && prevPage.loadAppointments) {
          prevPage.loadAppointments()
        }
      }, 1500)
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '预约失败', icon: 'none' })
      console.error('创建预约失败', e)
    }
  }
})
