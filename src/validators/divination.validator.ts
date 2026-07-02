/**
 * 命理分析相关请求验证 Schema
 *
 * v2: 兼容性修复版
 * - Gender 直接接受 male/female/other/MALE/FEMALE/OTHER（6种格式）
 * - BirthTime 支持 "H:MM" 和 "HH:MM" 两种格式
 */

import { z } from 'zod'

const DivinationTypeEnum = z.enum([
  'BAZI', 'ZIWEI', 'FENGSHUI', 'COMPATIBILITY', 'YEARLY_FORTUNE', 'MONTHLY_FORTUNE',
])

// 兼容大小写的性别枚举（直接接受6种常见写法）
const GenderEnum = z.enum(['male', 'female', 'other', 'MALE', 'FEMALE', 'OTHER'], {
  errorMap: () => ({ message: '性别应为 male/female 或 MALE/FEMALE' }),
})

// 支持的语言代码
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
    // 支持 H:MM 和 HH:MM 格式
    birthTime: z.string().regex(/^\d{1,2}:\d{2}$/, '时间格式应为 HH:MM').optional(),
    birthPlace: z.string().max(100).optional(),
    language: z.enum(supportedLanguages as [string, ...string[]]).default('zh'),

    // 合盘用
    partnerName: z.string().max(50).optional(),
    partnerGender: GenderEnum.optional(),
    partnerBirthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    partnerBirthTime: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),

    // 流年用
    targetYear: z.number().int().min(1900).max(2100).optional(),
    targetMonth: z.number().int().min(1).max(12).optional(),
  }),

  /** 免费八字排盘 */
  baziFree: z.object({
    name: z.string().max(50).optional(),
    gender: GenderEnum,
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
    // 支持 H:MM 和 HH:MM 格式（如 "0:00", "01:00", "12:30"）
    birthTime: z.string().regex(/^\d{1,2}:\d{2}$/, '时间格式应为 HH:MM').optional(),
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
