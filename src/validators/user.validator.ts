/**
 * 用户管理验证器
 */
import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名最长50字'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位').max(50),
  region: z.string().max(50).optional(),
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  region: z.string().max(50).optional(),
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
})

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED'], {
    errorMap: () => ({ message: '状态值必须为 ACTIVE、INACTIVE 或 BANNED' }),
  }),
})

export const userQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).optional(),
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
})
