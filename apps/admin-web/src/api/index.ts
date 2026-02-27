import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
})

// 请求拦截器
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const adminApi = {
  // 登录
  login: (username: string, password: string) => 
    api.post('/admin/login', { username, password }),
  
  // 初始化
  init: () => 
    api.post('/admin/init'),
  
  // 商家列表
  getMerchants: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get('/admin/merchants', { params }),
  
  // 商家统计
  getMerchantStats: () =>
    api.get('/admin/merchants/stats'),
  
  // 商家详情
  getMerchant: (id: string) =>
    api.get(`/admin/merchants/${id}`),
  
  // 审核通过
  approveMerchant: (id: string) =>
    api.put(`/admin/merchants/${id}/approve`),
  
  // 禁用商家
  banMerchant: (id: string, reason: string) =>
    api.put(`/admin/merchants/${id}/ban`, { reason }),
  
  // 解禁商家
  unbanMerchant: (id: string) =>
    api.put(`/admin/merchants/${id}/unban`),
  
  // 更新套餐
  updateMerchantPlan: (id: string, planType: string, expiredAt?: string) =>
    api.put(`/admin/merchants/${id}/plan`, { planType, expiredAt }),
  
  // 平台统计
  getPlatformStats: () =>
    api.get('/admin/platform/stats'),
  
  // 平台趋势
  getPlatformTrend: (days?: number) =>
    api.get('/admin/platform/trend', { params: { days } }),
  
  // 收入统计
  getRevenueStats: (startDate?: string, endDate?: string) =>
    api.get('/admin/revenue/stats', { params: { startDate, endDate } }),
  
  // 商家排行榜
  getMerchantRanking: (type?: string, limit?: number) =>
    api.get('/admin/ranking', { params: { type, limit } }),
  
  // 操作日志
  getLogs: (params?: { page?: number; limit?: number; adminId?: string; action?: string; targetType?: string }) =>
    api.get('/admin/logs', { params }),
  
  // 素材库列表
  getMediaList: (params?: { page?: number; limit?: number; merchantId?: string; type?: string; category?: string }) =>
    api.get('/admin/media', { params }),
  
  // 素材库统计
  getMediaStats: () =>
    api.get('/admin/media/stats'),
  
  // 删除素材
  deleteMedia: (id: string) =>
    api.delete(`/admin/media/${id}`),

  // 套餐管理
  getPackages: () => api.get('/admin/packages'),
  getPackage: (id: string) => api.get(`/admin/packages/${id}`),
  createPackage: (data: any) => api.post('/admin/packages', data),
  updatePackage: (id: string, data: any) => api.put(`/admin/packages/${id}`, data),
  deletePackage: (id: string) => api.delete(`/admin/packages/${id}`),
  updatePackageStatus: (id: string, status: string) => 
    api.put(`/admin/packages/${id}/status`, { status }),
}

export default api
