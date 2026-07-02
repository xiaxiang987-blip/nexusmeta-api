/**
 * 系统设置验证器
 */
import { z } from 'zod'

export const updateSettingsSchema = z.object({
  siteName: z.string().max(100).optional(),
  siteUrl: z.string().url().max(200).optional(),
  adminEmail: z.string().email().max(100).optional(),
  contactEmail: z.string().email().max(100).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDesc: z.string().max(500).optional(),
  seoKeywords: z.string().max(500).optional(),
  logoText: z.string().max(50).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, '颜色格式不正确').optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, '颜色格式不正确').optional(),
})
