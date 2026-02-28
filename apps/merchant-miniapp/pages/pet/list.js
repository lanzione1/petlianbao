const API_URL = 'http://localhost:3000/api/v1';

Page({
  data: {
    customerId: '',
    customerName: '',
    pets: [],
    loading: true
  },

  onLoad(options) {
    this.setData({
      customerId: options.customerId,
      customerName: options.customerName || '客户'
    });
    wx.setNavigationBarTitle({ title: `${this.data.customerName}的宠物` });
  },

  onShow() {
    this.loadPets();
  },

  onPullDownRefresh() {
    this.loadPets();
    wx.stopPullDownRefresh();
  },

  loadPets() {
    const token = wx.getStorageSync('token');
    wx.request({
      url: `${API_URL}/pets/customer/${this.data.customerId}`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        this.setData({ pets: res.data || [], loading: false });
      },
      fail: () => {
        this.setData({ loading: false });
      }
    });
  },

  addPet() {
    wx.navigateTo({
      url: `/pages/pet/edit?customerId=${this.data.customerId}`
    });
  },

  editPet(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/pet/edit?id=${id}&customerId=${this.data.customerId}`
    });
  },

  getSpeciesEmoji(species) {
    return species === 'dog' ? '🐕' : species === 'cat' ? '🐱' : '🐾';
  }
});
