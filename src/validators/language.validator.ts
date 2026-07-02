/**
 * 多语言管理验证器
 */
import { z } from 'zod'

const translationItemSchema = z.object({
  key: z.string().min(1, 'Key不能为空').max(100),
  zh: z.string().min(1, '简体中文不能为空'),
  en: z.string().min(1, '英文不能为空'),
  tw: z.string().min(1, '繁体中文不能为空'),
  section: z.string().min(1, '模块不能为空').max(50),
})

export const batchUpdateTranslationsSchema = z.object({
  translations: z.array(translationItemSchema).min(1, '至少需要一条翻译'),
})
