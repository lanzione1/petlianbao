import axios from 'axios';

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  'https://petllb-228231-9-1406143649.sh.run.tcloudbase.com/api/v1';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});

// 请求拦截器 - 添加token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('h5_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('h5_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  },
);

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Merchant {
  id: string;
  shopName: string;
  address?: string;
  phone?: string;
}

export interface H5Customer {
  id: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
}

export interface H5Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed?: string;
  gender?: 'male' | 'female' | 'unknown';
  birthday?: string;
  weight?: number;
  avatar?: string;
  notes?: string;
}

export interface H5Appointment {
  id: string;
  merchantId: string;
  h5CustomerId: string;
  h5PetId?: string;
  serviceId: string;
  appointmentTime: string;
  proposedTime?: string;
  proposedBy?: 'customer' | 'merchant';
  status: string;
  notes?: string;
  createdBy: 'customer' | 'merchant';
  h5Customer?: H5Customer;
  h5Pet?: H5Pet;
  service?: Service;
  merchant?: Merchant;
  history?: H5AppointmentHistory[];
}

export interface H5AppointmentHistory {
  id: string;
  appointmentId: string;
  action: string;
  operatorType: 'customer' | 'merchant';
  operatorId: string;
  operatorName: string;
  oldTime?: string;
  newTime?: string;
  notes?: string;
  createdAt: string;
}

export const merchantApi = {
  getInfo(id: string) {
    return api.get<Merchant>(`/public/merchants/${id}`);
  },

  getServices(id: string) {
    return api.get<Service[]>(`/public/merchants/${id}/services`);
  },
};

export const appointmentApi = {
  getServices(merchantId: string) {
    return api.get<Service[]>(`/public/services/${merchantId}`);
  },

  getAvailableSlots(merchantId: string, serviceId: string, date: string) {
    return api.get<TimeSlot[]>(`/public/appointments/slots`, {
      params: { merchantId, serviceId, date },
    });
  },

  createAppointment(data: {
    merchantId: string;
    serviceId: string;
    customerName: string;
    phone: string;
    petName: string;
    petBreed?: string;
    appointmentTime: string;
    notes?: string;
  }) {
    return api.post('/public/appointments', data);
  },
};

// H5客户相关API
export const h5AuthApi = {
  getWechatUrl(merchantId: string, redirectUri: string) {
    return api.get<{ url: string }>('/h5/auth/wechat/url', {
      params: { merchantId, redirectUri },
    });
  },

  wechatCallback(code: string, state: string) {
    return api.get<{ success: boolean; data: { customer: H5Customer; token: string } }>(
      '/h5/auth/wechat/callback',
      {
        params: { code, state },
      },
    );
  },

  bindPhone(phone: string) {
    return api.post<{ success: boolean; data: H5Customer }>('/h5/auth/phone/bind', { phone });
  },

  getMe() {
    return api.get<{ success: boolean; data: H5Customer }>('/h5/auth/me');
  },
};

// H5预约相关API
export const h5AppointmentApi = {
  getAll(status?: string) {
    return api.get<{ success: boolean; data: H5Appointment[] }>('/h5/appointments', {
      params: status ? { status } : {},
    });
  },

  getOne(id: string) {
    return api.get<{ success: boolean; data: H5Appointment }>(`/h5/appointments/${id}`);
  },

  create(data: {
    merchantId: string;
    serviceId: string;
    petId?: string;
    appointmentTime: string;
    notes?: string;
  }) {
    return api.post<{ success: boolean; data: H5Appointment }>('/h5/appointments', data);
  },

  reschedule(id: string, data: { proposedTime: string; notes?: string }) {
    return api.put<{ success: boolean; data: H5Appointment }>(
      `/h5/appointments/${id}/reschedule`,
      data,
    );
  },

  confirm(id: string) {
    return api.put<{ success: boolean; data: H5Appointment }>(`/h5/appointments/${id}/confirm`);
  },

  accept(id: string, notes?: string) {
    return api.put<{ success: boolean; data: H5Appointment }>(`/h5/appointments/${id}/accept`, {
      notes,
    });
  },

  reject(id: string) {
    return api.put<{ success: boolean; data: H5Appointment }>(`/h5/appointments/${id}/reject`);
  },

  cancel(id: string, reason?: string) {
    return api.put<{ success: boolean; message: string }>(`/h5/appointments/${id}/cancel`, {
      reason,
    });
  },
};

// H5宠物相关API
export const h5PetApi = {
  getAll() {
    return api.get<{ success: boolean; data: H5Pet[] }>('/h5/pets');
  },

  getOne(id: string) {
    return api.get<{ success: boolean; data: H5Pet }>(`/h5/pets/${id}`);
  },

  create(data: {
    name: string;
    species: 'dog' | 'cat' | 'other';
    breed?: string;
    gender?: 'male' | 'female' | 'unknown';
    birthday?: string;
    weight?: number;
    notes?: string;
  }) {
    return api.post<{ success: boolean; data: H5Pet }>('/h5/pets', data);
  },

  update(
    id: string,
    data: Partial<{
      name: string;
      species: 'dog' | 'cat' | 'other';
      breed: string;
      gender: 'male' | 'female' | 'unknown';
      birthday: string;
      weight: number;
      notes: string;
    }>,
  ) {
    return api.put<{ success: boolean; data: H5Pet }>(`/h5/pets/${id}`, data);
  },

  delete(id: string) {
    return api.delete<{ success: boolean; message: string }>(`/h5/pets/${id}`);
  },
};

export default api;
