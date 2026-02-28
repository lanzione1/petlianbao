import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format)
}

export function formatTime(date: Date | string, format: string = 'HH:mm'): string {
  return dayjs(date).format(format)
}

export function formatDateTime(date: Date | string, format: string = 'YYYY-MM-DD HH:mm'): string {
  return dayjs(date).format(format)
}

export function fromNow(date: Date | string): string {
  return dayjs(date).fromNow()
}

export function formatMoney(amount: number): string {
  return `¥${amount.toFixed(2)}`
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

export function generateOrderId(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${year}${month}${day}${random}`
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function(this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

export { dayjs }
