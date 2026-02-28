const API_URL = 'http://localhost:3000/api/v1';

Page({
  data: {
    logs: [],
    loading: true,
    total: 0,
    page: 1,
    hasMore: false,
  },

  onLoad() {
    this.loadLogs();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, logs: [] });
    this.loadLogs();
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({ page: this.data.page + 1 });
      this.loadLogs(true);
    }
  },

  loadLogs(loadMore = false) {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.request({
      url: `${API_URL}/logs`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      data: { 
        page: this.data.page,
        limit: 20 
      },
      success: (res) => {
        if (res.data && res.data.data) {
          const logs = this.formatLogs(res.data.data);
          this.setData({
            logs: loadMore ? [...this.data.logs, ...logs] : logs,
            total: res.data.total,
            hasMore: res.data.data.length >= 20,
            loading: false,
          });
        }
      },
      fail: () => {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },

  formatLogs(logs) {
    const actionMap = {
      'create': '创建',
      'update': '修改',
      'delete': '删除',
      'add_staff': '添加店员',
      'remove_staff': '删除店员',
      'enable_staff': '启用店员',
      'disable_staff': '禁用店员',
      'checkout': '结账',
    };

    const targetMap = {
      'customer': '客户',
      'appointment': '预约',
      'staff': '店员',
      'order': '订单',
    };

    return logs.map(log => {
      const action = actionMap[log.action] || log.action;
      const target = targetMap[log.targetType] || log.targetType;
      
      let detail = '';
      if (log.details) {
        if (log.details.petName) detail = log.details.petName;
        if (log.details.nickname) detail = log.details.nickname;
        if (log.details.amount) detail = `金额: ¥${log.details.amount}`;
      }

      return {
        ...log,
        actionText: `${action}${target}`,
        detail: detail,
        time: this.formatTime(log.createdAt),
      };
    });
  },

  formatTime(dateStr) {
    const date = new Date(dateStr);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${month}-${day} ${hour}:${minute}`;
  },
});
