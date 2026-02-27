export interface Merchant {
  id: string
  openid: string
  shopName: string
  phone?: string
  address?: string
  businessHours?: Record<string, any>
  planType: 'free' | 'professional'
  planExpiredAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Service {
  id: string
  merchantId: string
  name: string
  price: number
  duration: number
  dailyLimit: number
  isActive: boolean
  sortOrder: number
  createdAt: Date
}

export interface Customer {
  id: string
  merchantId: string
  petName: string
  petBreed?: string
  petBirthday?: Date
  phone?: string
  notes?: string
  tags: string[]
  totalSpent: number
  visitCount: number
  lastVisitAt?: Date
  createdAt: Date
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Appointment {
  id: string
  merchantId: string
  customerId: string
  serviceId: string
  appointmentTime: Date
  status: AppointmentStatus
  notes?: string
  reminderSent: boolean
  createdAt: Date
}

export type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'member'
export type TransactionStatus = 'completed' | 'refunded'

export interface TransactionItem {
  name: string
  price: number
  quantity: number
}

export interface Transaction {
  id: string
  merchantId: string
  customerId: string
  appointmentId?: string
  items: TransactionItem[]
  totalAmount: number
  paymentMethod: PaymentMethod
  status: TransactionStatus
  createdAt: Date
}

export type CampaignType = 'poster' | 'coupon' | 'birthday' | 'broadcast'

export interface Campaign {
  id: string
  merchantId: string
  type: CampaignType
  title?: string
  content?: Record<string, any>
  targetTags: string[]
  sentCount: number
  createdAt: Date
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  limit: number
}
