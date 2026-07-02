/**
 * 内容管理验证器
 */
import { z } from 'zod'

// FAQ
export const createFaqSchema = z.object({
  question: z.string().min(1, '问题不能为空').max(500),
  answer: z.string().min(1, '答案不能为空').max(5000),
  lang: z.string().min(2).max(5).default('zh'),
  order: z.number().int().min(0).optional(),
})

export const updateFaqSchema = z.object({
  question: z.string().min(1).max(500).optional(),
  answer: z.string().min(1).max(5000).optional(),
  lang: z.string().min(2).max(5).optional(),
  order: z.number().int().min(0).optional(),
})

// 评价
export const createReviewSchema = z.object({
  name: z.string().min(1, '用户名不能为空').max(50),
  role: z.string().min(1, '身份不能为空').max(100),
  content: z.string().min(1, '评价内容不能为空').max(2000),
  rating: z.number().int().min(1).max(5),
  lang: z.string().min(2).max(5).default('zh'),
})

export const updateReviewSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  role: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(2000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  lang: z.string().min(2).max(5).optional(),
})

// Logo
export const createLogoSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100),
  imageUrl: z.string().url('图片URL格式不正确').optional(),
  order: z.number().int().min(0).optional(),
})
