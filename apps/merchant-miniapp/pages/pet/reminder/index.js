const { api } = require('../../../utils/api.js')
const app = getApp()

Page({
  data: {
    reminders: [],
    filteredReminders: [],
    typeFilter: 'all',
    dayFilter: 7,
    selectedPets: [],
    templates: {},
    editTemplates: {},
    showSendModal: false,
    showTemplateModal: false,
    sendMessage: '',
    loading: true,
    typeOptions: [
      { value: 'all', label: '全部' },
      { value: 'birthday', label: '生日' },
      { value: 'vaccine', label: '疫苗' },
      { value: 'deworm', label: '驱虫' }
    ],
    dayOptions: [
      { value: 7, label: '7天内' },
      { value: 3, label: '3天内' },
      { value: 1, label: '1天内' }
    ]
  },

  onLoad() {
    this.loadData()
  },

  async onShow() {
    const loggedIn = await app.waitForLogin()
    if (!loggedIn) return
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const [reminders, templates] = await Promise.all([
        api.getReminders(this.data.typeFilter, this.data.dayFilter),
        api.getReminderTemplates()
      ])
      this.setData({
        reminders,
        filteredReminders: reminders,
        templates,
        loading: false
      })
    } catch (e) {
      console.error('加载提醒失败', e)
      this.setData({ loading: false })
    }
  },

  onTypeFilter(e) {
    const typeFilter = e.currentTarget.dataset.type
    this.setData({ typeFilter })
    this.filterReminders()
  },

  onDayFilter(e) {
    const dayFilter = parseInt(e.currentTarget.dataset.days)
    this.setData({ dayFilter })
    this.loadData()
  },

  filterReminders() {
    const { reminders, typeFilter } = this.data
    let filtered = reminders
    if (typeFilter !== 'all') {
      filtered = reminders.filter(r => r.reminderType === typeFilter)
    }
    this.setData({ filteredReminders: filtered })
  },

  toggleSelect(e) {
    const petId = e.currentTarget.dataset.id
    const { selectedPets } = this.data
    const index = selectedPets.indexOf(petId)
    if (index > -1) {
      selectedPets.splice(index, 1)
    } else {
      selectedPets.push(petId)
    }
    this.setData({ selectedPets })
  },

  selectAll() {
    const allIds = this.data.filteredReminders.map(r => r.id)
    this.setData({ selectedPets: allIds })
  },

  deselectAll() {
    this.setData({ selectedPets: [] })
  },

  openSendModal() {
    if (this.data.selectedPets.length === 0) {
      wx.showToast({ title: '请选择要发送的宠物', icon: 'none' })
      return
    }
    
    const firstPet = this.data.filteredReminders.find(r => r.id === this.data.selectedPets[0])
    const type = firstPet?.reminderType || 'birthday'
    const templateKey = `${type}Template`
    const defaultMessage = this.data.templates[templateKey] || ''
      .replace('{petName}', firstPet?.name || '宠物')
    
    this.setData({
      showSendModal: true,
      sendMessage: defaultMessage
    })
  },

  closeSendModal() {
    this.setData({ showSendModal: false })
  },

  onMessageInput(e) {
    this.setData({ sendMessage: e.detail.value })
  },

  async sendMessages() {
    const { selectedPets, sendMessage } = this.data
    if (!sendMessage.trim()) {
      wx.showToast({ title: '请输入消息内容', icon: 'none' })
      return
    }

    try {
      const result = await api.sendReminders({
        petIds: selectedPets,
        type: 'custom',
        message: sendMessage
      })
      wx.showToast({ title: `成功发送 ${result.sent} 条`, icon: 'success' })
      this.setData({ showSendModal: false, selectedPets: [] })
      this.loadData()
    } catch (e) {
      wx.showToast({ title: '发送失败', icon: 'none' })
    }
  },

  openTemplateModal() {
    this.setData({
      showTemplateModal: true,
      editTemplates: { ...this.data.templates }
    })
  },

  closeTemplateModal() {
    this.setData({ showTemplateModal: false })
  },

  onTemplateInput(e) {
    const { type } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      editTemplates: {
        ...this.data.editTemplates,
        [type]: value
      }
    })
  },

  async saveTemplates() {
    try {
      await api.updateReminderTemplates(this.data.editTemplates)
      wx.showToast({ title: '保存成功', icon: 'success' })
      this.setData({ showTemplateModal: false, templates: this.data.editTemplates })
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  getTypeLabel(type) {
    const labels = { birthday: '生日', vaccine: '疫苗', deworm: '驱虫' }
    return labels[type] || type
  },

  getDaysText(daysLeft) {
    if (daysLeft === 0) return '今天'
    if (daysLeft === 1) return '明天'
    return `${daysLeft}天后`
  }
})
