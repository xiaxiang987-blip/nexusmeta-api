/**
 * 命理分析相关请求验证 Schema
 *
 * 重要：GenderEnum 兼容大小写输入（前端可能发送 male/MALE）
 * BirthTime 支持多种格式（HH:MM, HH:MM:SS, H:MM）
 */

import { z } from 'zod'

const DivinationTypeEnum = z.enum([
  'BAZI', 'ZIWEI', 'FENGSHUI', 'COMPATIBILITY', 'YEARLY_FORTUNE', 'MONTHLY_FORTUNE',
])

// 兼容大小写的性别枚举：接受 male/female/other/MALE/FEMALE/OTHER 等任意格式
const GenderEnum = z.string()
  .transform((val) => {
    const upper = val.toUpperCase().trim()
    if (!['MALE', 'FEMALE', 'OTHER'].includes(upper)) {
      throw new Error(`Invalid gender value: ${val}. Expected MALE, FEMALE or OTHER`)
    }
    return upper
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .pipe(z.enum(['MALE', 'FEMALE', 'OTHER']) as any)

// 支持的语言代码（部分列举）
const supportedLanguages = [
  'zh', 'zh-TW', 'en', 'ms', 'id', 'yue', 'th', 'vi', 'ja', 'ko',
  'ar', 'he', 'ur', 'hi', 'bn', 'pt', 'es', 'fr', 'de', 'ru',
  'it', 'nl', 'pl', 'sv', 'da', 'fi', 'nb', 'cs', 'sk', 'hu',
  'ro', 'bg', 'sr', 'uk', 'tr', 'el', 'tl', 'km', 'lo', 'my',
  'am', 'sw', 'ha', 'yo', 'ig', 'zu', 'xh', 'af', 'so', 'rw',
  'ml', 'ta', 'te', 'kn', 'mr', 'gu', 'pa', 'si', 'ne', 'ps',
  'fa', 'ku', 'az', 'uz', 'kk', 'tk', 'ky', 'tg', 'mn', 'bo',
]

export const divinationSchemas = {
  /** 命理分析 */
  analyze: z.object({
    type: DivinationTypeEnum,
    name: z.string().max(50).optional(),
    gender: GenderEnum,
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
    birthTime: z.string().regex(/^\d{2}:\d{2}$/, '时间格式应为 HH:MM').optional(),
    birthPlace: z.string().max(100).optional(),
    language: z.enum(supportedLanguages as [string, ...string[]]).default('zh'),

    // 合盘用
    partnerName: z.string().max(50).optional(),
    partnerGender: GenderEnum.optional(),
    partnerBirthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    partnerBirthTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),

    // 流年用
    targetYear: z.number().int().min(1900).max(2100).optional(),
    targetMonth: z.number().int().min(1).max(12).optional(),
  }),

  /** 免费八字排盘 */
  baziFree: z.object({
    name: z.string().max(50).optional(),
    gender: GenderEnum,
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
    // 兼容多种时间格式：H:MM, HH:MM, HH:MM:SS 等（前端可能发送 "0:00" 而不是 "00:00"）
    birthTime: z.preprocess((val) => {
      if (typeof val !== 'string' || !val.trim()) return undefined
      const parts = val.trim().split(':')
      if (parts.length >= 2) {
        const hour = parts[0].padStart(2, '0')
        const min = parts[1].padStart(2, '0')
        return `${hour}:${min}`
      }
      return val
    }, z.string().regex(/^\d{2}:\d{2}$/, '时间格式应为 HH:MM').optional()).optional(),
    birthPlace: z.string().max(100).optional(),
    language: z.enum(supportedLanguages as [string, ...string[]]).default('zh'),
  }),

  /** 风水分析 */
  fengshui: z.object({
    description: z.string().min(10, '请提供至少10字的描述').max(2000),
    analysisType: z.enum(['home', 'office', 'burial', 'layout']),
    language: z.enum(supportedLanguages as [string, ...string[]]).default('zh'),
  }),
}

export type AnalyzeInput = z.infer<typeof divinationSchemas.analyze>
export type BaziFreeInput = z.infer<typeof divinationSchemas.baziFree>
