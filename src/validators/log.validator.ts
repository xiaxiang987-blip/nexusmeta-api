/**
 * 操作日志验证器
 */
import { z } from 'zod'

export const logQuerySchema = z.object({
  search: z.string().optional(),
  action: z.string().optional(),
  module: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
