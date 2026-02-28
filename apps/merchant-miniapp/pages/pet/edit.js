const API_URL = 'http://localhost:3000/api/v1';

Page({
  data: {
    id: '',
    customerId: '',
    speciesIndex: 0,
    photoFullUrl: '',
    form: {
      name: '',
      species: 'dog',
      breed: '',
      weight: '',
      birthday: '',
      feeding: '',
      allergy: '',
      behavior: '',
      notes: '',
      nextVaccineDate: '',
      nextDewormDate: ''
    },
    speciesOptions: [
      { value: 'dog', label: '🐕 狗' },
      { value: 'cat', label: '🐱 猫' },
      { value: 'other', label: '🐾 其他' }
    ]
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id, customerId: options.customerId });
      wx.setNavigationBarTitle({ title: '编辑宠物' });
      this.loadPet(options.id);
    } else {
      this.setData({ customerId: options.customerId });
      wx.setNavigationBarTitle({ title: '添加宠物' });
    }
  },

  loadPet(id) {
    const token = wx.getStorageSync('token');
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: `${API_URL}/pets/${id}`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        wx.hideLoading();
        if (res.data) {
          const form = { ...res.data };
          if (form.birthday) form.birthday = form.birthday.split('T')[0];
          if (form.nextVaccineDate) form.nextVaccineDate = form.nextVaccineDate.split('T')[0];
          if (form.nextDewormDate) form.nextDewormDate = form.nextDewormDate.split('T')[0];
          const speciesIndex = this.data.speciesOptions.findIndex(s => s.value === form.species) || 0;
          const photoFullUrl = form.photo ? (form.photo.startsWith('http') ? form.photo : `${API_URL.replace('/api/v1', '')}${form.photo}`) : '';
          this.setData({ form, speciesIndex, photoFullUrl });
        }
      },
      fail: () => {
        wx.hideLoading();
      }
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onSpeciesChange(e) {
    const idx = parseInt(e.detail.value);
    this.setData({ 
      speciesIndex: idx,
      'form.species': this.data.speciesOptions[idx].value 
    });
  },

  choosePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ photoFullUrl: tempFilePath });

        // 如果是编辑模式（已有 id），立即上传
        if (this.data.id) {
          this.uploadPhoto(tempFilePath);
        } else {
          // 新建模式：暂存本地路径，保存宠物后再上传
          this.setData({ '_pendingPhoto': tempFilePath });
        }
      }
    });
  },

  uploadPhoto(filePath) {
    const token = wx.getStorageSync('token');
    const petId = this.data.id;
    if (!petId) return;

    wx.uploadFile({
      url: `${API_URL.replace('/api/v1', '')}/api/v1/pets/${petId}/photo`,
      filePath: filePath,
      name: 'file',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.url) {
            const fullUrl = `${API_URL.replace('/api/v1', '')}${data.url}`;
            this.setData({ 'form.photo': data.url, photoFullUrl: fullUrl });
          }
        } catch (e) {
          console.error('photo upload parse error', e);
        }
      },
      fail: () => {
        wx.showToast({ title: '照片上传失败', icon: 'none' });
      }
    });
  },

  submit() {
    const { form, id, customerId } = this.data;
    
    if (!form.name) {
      wx.showToast({ title: '请输入名字', icon: 'none' });
      return;
    }
    if (!form.breed) {
      wx.showToast({ title: '请输入品种', icon: 'none' });
      return;
    }
    if (!form.weight) {
      wx.showToast({ title: '请输入体重', icon: 'none' });
      return;
    }

    const token = wx.getStorageSync('token');
    const url = id ? `${API_URL}/pets/${id}` : `${API_URL}/pets`;
    const method = id ? 'PUT' : 'POST';

    wx.showLoading({ title: '保存中...' });
    wx.request({
      url,
      method,
      header: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { ...form, customerId },
      success: (res) => {
        wx.hideLoading();
        // 新建宠物时，如果有待上传照片，上传后再返回
        if (!id && this.data._pendingPhoto && res.data && res.data.id) {
          this.setData({ id: res.data.id });
          this.uploadPhoto(this.data._pendingPhoto);
        }
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    });
  },

  deletePet() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这只宠物吗？',
      success: (res) => {
        if (res.confirm) {
          const token = wx.getStorageSync('token');
          wx.showLoading({ title: '删除中...' });
          wx.request({
            url: `${API_URL}/pets/${this.data.id}`,
            method: 'DELETE',
            header: { 'Authorization': `Bearer ${token}` },
            success: () => {
              wx.hideLoading();
              wx.showToast({ title: '已删除', icon: 'success' });
              setTimeout(() => wx.navigateBack(), 1000);
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({ title: '删除失败', icon: 'none' });
            }
          });
        }
      }
    });
  }
});
