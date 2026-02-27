Page({
  data: {
    qrcodeUrl: ''
  },

  onLoad() {
    const merchant = wx.getStorageSync('merchant');
    if (merchant && merchant.id) {
      const baseUrl = 'https://your-domain.com';
      const url = `${baseUrl}/?shop=${merchant.id}`;
      this.setData({ qrcodeUrl: url });
    } else {
      this.setData({ qrcodeUrl: '请先登录商家账号' });
    }
  },

  copyLink() {
    if (!this.data.qrcodeUrl || this.data.qrcodeUrl === '请先登录商家账号') {
      wx.showToast({ title: '暂无链接', icon: 'none' });
      return;
    }

    wx.setClipboardData({
      data: this.data.qrcodeUrl,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'success' });
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '预约服务',
      path: `/pages/index/index?shop=${wx.getStorageSync('merchant')?.id || ''}`
    };
  }
});