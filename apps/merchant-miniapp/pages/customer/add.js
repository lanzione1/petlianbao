const { api } = require('../../utils/api.js')

Page({
  data: {
    id: '',
    form: {
      petName: '',
      phone: '',
      gender: '',
      notes: ''
    },
    pets: [],
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id })
      this.loadCustomer(options.id)
      wx.setNavigationBarTitle({ title: '编辑客户' })
    } else {
      wx.setNavigationBarTitle({ title: '新增客户' })
    }
  },

  async loadCustomer(id) {
    try {
      const customer = await api.getCustomer(id)
      this.setData({
        form: {
          petName: customer.petName || '',
          phone: customer.phone || '',
          gender: customer.gender || '',
          notes: customer.notes || ''
        },
        pets: customer.pets || []
      })
    } catch (e) {
      console.error('加载客户失败', e)
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: e.detail.value
    })
  },

  onGender(e) {
    const value = e.currentTarget.dataset.value
    this.setData({
      'form.gender': this.data.form.gender === value ? '' : value
    })
  },

  async submit() {
    if (!this.data.form.petName) {
      wx.showToast({ title: '请输入客户姓名', icon: 'none' })
      return
    }
    if (!this.data.form.phone || this.data.form.phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      const data = {
        petName: this.data.form.petName,
        phone: this.data.form.phone,
        gender: this.data.form.gender || undefined,
        notes: this.data.form.notes
      }

      if (this.data.id) {
        await api.updateCustomer(this.data.id, data)
        wx.showToast({ title: '修改成功' })
      } else {
        await api.createCustomer(data)
        wx.showToast({ title: '添加成功' })
      }

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  editPet(e) {
    const petId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/pet/edit?id=${petId}&customerId=${this.data.id}` })
  },

  addPet() {
    wx.navigateTo({ url: `/pages/pet/edit?customerId=${this.data.id}` })
  },

  async deletePet(e) {
    const petId = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这只宠物吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deletePet(petId)
            wx.showToast({ title: '已删除' })
            this.loadCustomer(this.data.id)
          } catch (e) {
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  onShow() {
    if (this.data.id) {
      this.loadCustomer(this.data.id)
    }
  }
})
