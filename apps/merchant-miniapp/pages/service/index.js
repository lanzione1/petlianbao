const { api } = require('../../utils/api.js')

Page({
  data: {
    services: [],
    showModal: false,
    editId: '',
    form: {
      name: '',
      price: '',
      duration: '60',
      dailyLimit: '10'
    }
  },

  onShow() {
    this.loadServices()
  },

  onPullDownRefresh() {
    this.loadServices()
    wx.stopPullDownRefresh()
  },

  async loadServices() {
    try {
      const services = await api.getServices()
      this.setData({ services: services || [] })
    } catch (e) {
      console.error('加载服务失败', e)
    }
  },

  async toggleActive(e) {
    const id = e.currentTarget.dataset.id
    const service = this.data.services.find(s => s.id === id)
    if (!service) return

    try {
      await api.updateService(id, { isActive: !service.isActive })
      this.loadServices()
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  addService() {
    this.setData({
      showModal: true,
      editId: '',
      form: {
        name: '',
        price: '',
        duration: '60',
        dailyLimit: '10'
      }
    })
  },

  editService(e) {
    const id = e.currentTarget.dataset.id
    const service = this.data.services.find(s => s.id === id)
    if (!service) return

    this.setData({
      showModal: true,
      editId: id,
      form: {
        name: service.name,
        price: String(service.price),
        duration: String(service.duration),
        dailyLimit: String(service.dailyLimit)
      }
    })
  },

  closeModal() {
    this.setData({ showModal: false })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: e.detail.value
    })
  },

  async submit() {
    if (!this.data.form.name) {
      wx.showToast({ title: '请输入服务名称', icon: 'none' })
      return
    }
    if (!this.data.form.price) {
      wx.showToast({ title: '请输入价格', icon: 'none' })
      return
    }

    try {
      const data = {
        name: this.data.form.name,
        price: parseFloat(this.data.form.price),
        duration: parseInt(this.data.form.duration) || 60,
        dailyLimit: parseInt(this.data.form.dailyLimit) || 10
      }

      if (this.data.editId) {
        await api.updateService(this.data.editId, data)
        wx.showToast({ title: '修改成功' })
      } else {
        await api.createService(data)
        wx.showToast({ title: '添加成功' })
      }

      this.closeModal()
      this.loadServices()
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  }
})
