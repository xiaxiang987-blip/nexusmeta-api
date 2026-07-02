/**
 * 共享 TypeScript 类型定义
 *
 * 后台管理系统与 API 之间的接口契约
 */

// ===== 通用响应 =====
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: string
  timestamp?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ===== Dashboard =====
export interface DashboardStats {
  totalUsers: StatItem
  monthlyOrders: StatItem
  monthlyRevenue: StatItem
  dailyActive: StatItem
}

export interface StatItem {
  value: number
  change: number
}

export interface RevenueTrend {
  month: string
  revenue: number
  users: number
}

export interface UserRegion {
  name: string
  value: number
}

export interface RecentOrder {
  id: string
  user: string
  plan: string
  amount: number
  status: string
  date: string
}

// ===== 用户管理 =====
export interface UserItem {
  id: string
  name: string
  email: string
  region: string
  plan: string
  status: 'active' | 'inactive' | 'banned'
  regDate: string
  avatar: string
  credits: number
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  region?: string
  plan?: string
}

export interface UpdateUserInput {
  name?: string
  email?: string
  region?: string
  plan?: string
  bio?: string
  location?: string
}

export interface UpdateUserStatusInput {
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED'
}

// ===== 内容管理 =====
export interface FaqItem {
  id: number
  question: string
  answer: string
  lang: string
  order: number
}

export interface CreateFaqInput {
  question: string
  answer: string
  lang: string
  order?: number
}

export interface ReviewItem {
  id: number
  name: string
  role: string
  content: string
  rating: number
  lang: string
  avatar?: string
}

export interface CreateReviewInput {
  name: string
  role: string
  content: string
  rating: number
  lang: string
}

export interface PartnerLogoItem {
  id: number
  name: string
  imageUrl?: string
  order: number
}

export interface CreateLogoInput {
  name: string
  imageUrl?: string
  order?: number
}

// ===== 订单管理 =====
export interface OrderItem {
  id: string
  displayId: string
  user: string
  email: string
  plan: string
  amount: number
  status: string
  date: string
  method: string
}

export interface OrderListResponse {
  data: OrderItem[]
  total: number
  page: number
  limit: number
  summary?: {
    totalCompleted: number
    totalRevenue: number
  }
}

export interface UpdateOrderStatusInput {
  status: 'COMPLETED' | 'CANCELLED'
}

// ===== 多语言管理 =====
export interface TranslationItem {
  key: string
  zh: string
  en: string
  tw: string
  section: string
}

export interface TranslationsResponse {
  sections: string[]
  translations: TranslationItem[]
}

// ===== 系统设置 =====
export interface SiteConfig {
  siteName: string
  siteUrl: string
  adminEmail: string
  contactEmail: string
  seoTitle: string
  seoDesc: string
  seoKeywords: string
  logoText: string
  primaryColor: string
  secondaryColor: string
}

// ===== 操作日志 =====
export interface LogItem {
  id: number
  user: string
  action: string
  module: string
  detail: string
  time: string
  ip: string
}

// ===== 个人中心 =====
export interface ProfileData {
  name: string
  email: string
  bio: string
  role: string
  joinedAt: string
  location: string
  managedUsers: number
  avatar: string
}

export interface UpdateProfileInput {
  name?: string
  email?: string
  bio?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
