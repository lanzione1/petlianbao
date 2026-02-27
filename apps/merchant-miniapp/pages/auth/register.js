const API_URL = 'http://localhost:3000/api/v1';

const DEV_USERS = [
  { openid: 'dev_fixed_openid_001', name: '店主(管理员)', role: 'admin' },
  { openid: 'test_staff_001', name: '测试店员A', role: 'staff' },
  { openid: 'test_staff_002', name: '测试店员B', role: 'staff' },
];

Page({
  data: {
    region: ['请选择省', '市', '区'],
    wxCode: '',
    openid: '',
    loading: false,
    submitting: false,
    isDevMode: false,
    showDevLogin: false,
    devUsers: DEV_USERS
  },

  onLoad(options) {
    // 只在有完整商家信息时才跳转首页
    const token = wx.getStorageSync('token');
    const merchant = wx.getStorageSync('merchant');
    if (token && merchant && merchant.shopName && merchant.ownerName && merchant.phone) {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  toggleDevMode() {
    this.setData({ showDevLogin: !this.data.showDevLogin });
  },

  devLogin(e) {
    const openid = e.currentTarget.dataset.openid;
    const name = e.currentTarget.dataset.name;
    const role = e.currentTarget.dataset.role;
    
    wx.showLoading({ title: '登录中...' });
    
    wx.request({
      url: API_URL + '/auth/wechat/login',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { code: openid },
      success: (res) => {
        wx.hideLoading();
        const data = res.data;
        
        if (data.access_token && (data.merchant || data.staff)) {
          const merchant = data.merchant || {
            id: data.staff.merchantId,
            openid: openid,
            shopName: '我的宠物店',
            ownerName: name,
            phone: '13800000000',
            role: data.staff.role || 'staff',
          };
          
          const app = getApp();
          app.globalData.token = data.access_token;
          app.globalData.merchant = merchant;
          
          wx.setStorageSync('token', data.access_token);
          wx.setStorageSync('merchant', merchant);
          
          wx.showToast({ title: '登录成功', icon: 'success' });
          
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/index/index' });
          }, 1000);
        } else {
          wx.showToast({ title: '登录失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '登录失败', icon: 'none' });
      }
    });
  },

  onRegionChange(e) {
    this.setData({ region: e.detail.value });
  },

  submitForm: async function(e) {
    var that = this;
    
    if (that.data.submitting) {
      return;
    }

    var shopName = e.detail.value.shopName;
    var ownerName = e.detail.value.ownerName;
    var phone = e.detail.value.phone;
    var detailedAddress = e.detail.value.detailedAddress;
    
    if (!shopName || !ownerName || !phone) {
      wx.showToast({ title: '请填写必填项', icon: 'none' });
      return;
    }

    if (phone.length !== 11) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    that.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' });

    // 1. 先获取微信code
    wx.login({
      success: function(loginRes) {
        var code = loginRes.code;

        // 2. 用code换取openid和token
        wx.request({
          url: API_URL + '/auth/wechat/login',
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: { code: code },
          success: function(authRes) {
            var data = authRes.data;
            if (!data.access_token || !data.merchant) {
              wx.hideLoading();
              wx.showToast({ title: '登录失败', icon: 'none' });
              that.setData({ submitting: false });
              return;
            }

            var openid = data.merchant.openid;
            var token = data.access_token;

            // 3. 更新商家信息
            wx.request({
              url: API_URL + '/merchants/register',
              method: 'POST',
              header: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              data: {
                openid: openid,
                shopName: shopName,
                ownerName: ownerName,
                phone: phone,
                address: that.data.region.join(''),
                detailedAddress: detailedAddress
              },
              success: function(updateRes) {
                wx.hideLoading();
                
                var merchant = {
                  id: updateRes.data.id,
                  openid: openid,
                  shopName: shopName,
                  ownerName: ownerName,
                  phone: phone,
                  address: that.data.region.join(''),
                  detailedAddress: detailedAddress,
                  planType: updateRes.data.planType || 'free',
                  role: updateRes.data.role || 'admin'
                };

                var app = getApp();
                app.globalData.token = token;
                app.globalData.merchant = merchant;
                app.globalData.merchantId = merchant.id;

                wx.setStorageSync('token', token);
                wx.setStorageSync('merchant', merchant);

                wx.showToast({ title: '注册成功', icon: 'success' });
                
                setTimeout(function() {
                  wx.reLaunch({ url: '/pages/index/index' });
                }, 1500);
              },
              fail: function() {
                wx.hideLoading();
                wx.showToast({ title: '注册失败', icon: 'none' });
                that.setData({ submitting: false });
              }
            });
          },
          fail: function() {
            wx.hideLoading();
            wx.showToast({ title: '登录失败', icon: 'none' });
            that.setData({ submitting: false });
          }
        });
      },
      fail: function() {
        wx.hideLoading();
        wx.showToast({ title: '微信登录失败', icon: 'none' });
        that.setData({ submitting: false });
      }
    });
  }
});