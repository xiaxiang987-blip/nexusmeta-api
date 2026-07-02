/**
 * 认证相关请求验证 Schema
 */

import { z } from 'zod'

export const authSchemas = {
  /** 用户注册 */
  register: z.object({
    email: z.string().email('邮箱格式不正确'),
    password: z.string().min(6, '密码至少6位').max(100, '密码过长'),
    name: z.string().min(1, '姓名不能为空').max(50).optional(),
    phone: z.string().optional(),
  }),

  /** 用户登录 */
  login: z.object({
    email: z.string().email('邮箱格式不正确'),
    password: z.string().min(1, '密码不能为空'),
  }),

  /** 更新用户信息 */
  updateProfile: z.object({
    name: z.string().min(1).max(50).optional(),
    avatar: z.string().url().optional(),
    phone: z.string().optional(),
  }),

  /** 修改密码 */
  changePassword: z.object({
    oldPassword: z.string().min(1, '旧密码不能为空'),
    newPassword: z.string().min(6, '新密码至少6位').max(100),
  }),
}

export type RegisterInput = z.infer<typeof authSchemas.register>
export type LoginInput = z.infer<typeof authSchemas.login>
