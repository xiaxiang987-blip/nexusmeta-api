/**
 * 订单管理验证器
 */
import { z } from 'zod'

export const orderQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['COMPLETED', 'CANCELLED'], {
    errorMap: () => ({ message: '状态值必须为 COMPLETED 或 CANCELLED' }),
  }),
})
