/**
 * 个人中心验证器
 */
import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50).optional(),
  email: z.string().email('邮箱格式不正确').optional(),
  bio: z.string().max(500).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '当前密码不能为空'),
  newPassword: z.string().min(6, '新密码至少6位').max(50),
  confirmPassword: z.string().min(1, '确认密码不能为空'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})
