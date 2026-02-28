const API_URL = 'http://localhost:3000/api/v1';
const app = getApp();

Page({
  data: {
    staffs: [],
    loading: true,
    isAdmin: false,
    showAddModal: false,
    newStaffOpenid: '',
    newStaffName: '',
  },

  onLoad() {
    this.setData({ isAdmin: app.globalData.merchant?.role === 'admin' });
  },

  onShow() {
    this.loadStaffs();
  },

  loadStaffs() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.request({
      url: `${API_URL}/staffs`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.data) {
          this.setData({ staffs: res.data, loading: false });
        }
      },
      fail: () => {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },

  addStaff() {
    this.setData({ showAddModal: true });
  },

  closeAddModal() {
    this.setData({ 
      showAddModal: false,
      newStaffOpenid: '',
      newStaffName: ''
    });
  },

  onOpenidInput(e) {
    this.setData({ newStaffOpenid: e.detail.value });
  },

  onNameInput(e) {
    this.setData({ newStaffName: e.detail.value });
  },

  confirmAddStaff() {
    const { newStaffOpenid, newStaffName } = this.data;
    
    if (!newStaffOpenid) {
      wx.showToast({ title: '请输入店员OpenID', icon: 'none' });
      return;
    }

    const token = wx.getStorageSync('token');
    wx.request({
      url: `${API_URL}/staffs`,
      method: 'POST',
      header: { 'Authorization': `Bearer ${token}` },
      data: { 
        openid: newStaffOpenid,
        nickname: newStaffName || '店员'
      },
      success: () => {
        wx.showToast({ title: '添加成功', icon: 'success' });
        this.closeAddModal();
        this.loadStaffs();
      },
      fail: (e) => {
        wx.showToast({ title: e.errMsg || '添加失败', icon: 'none' });
      }
    });
  },

  deleteStaff(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除店员"${name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          this.doDeleteStaff(id);
        }
      }
    });
  },

  doDeleteStaff(id) {
    const token = wx.getStorageSync('token');
    wx.request({
      url: `${API_URL}/staffs/${id}`,
      method: 'DELETE',
      header: { 'Authorization': `Bearer ${token}` },
      success: () => {
        wx.showToast({ title: '删除成功', icon: 'success' });
        this.loadStaffs();
      },
      fail: () => {
        wx.showToast({ title: '删除失败', icon: 'none' });
      }
    });
  },

  toggleStatus(e) {
    const id = e.currentTarget.dataset.id;
    const currentStatus = e.currentTarget.dataset.status;
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    
    const token = wx.getStorageSync('token');
    wx.request({
      url: `${API_URL}/staffs/${id}/status`,
      method: 'PUT',
      header: { 'Authorization': `Bearer ${token}` },
      data: { status: newStatus },
      success: () => {
        wx.showToast({ title: newStatus === 'active' ? '已启用' : '已禁用', icon: 'success' });
        this.loadStaffs();
      },
      fail: () => {
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    });
  },
});
