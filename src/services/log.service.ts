/**
 * 操作日志 Service
 */
import { prisma } from '../config/database'
import type { LogItem } from '../types'

export class LogService {
  async list(params: {
    search?: string
    action?: string
    module?: string
    dateFrom?: string
    dateTo?: string
    page: number
    limit: number
  }) {
    const where: any = {}

    if (params.action) where.action = params.action
    if (params.module) where.module = params.module
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {}
      if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom)
      if (params.dateTo) where.createdAt.lte = new Date(params.dateTo + 'T23:59:59')
    }
    if (params.search) {
      where.OR = [
        { userName: { contains: params.search } },
        { action: { contains: params.search } },
        { module: { contains: params.search } },
        { detail: { contains: params.search } },
      ]
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const data: LogItem[] = logs.map((l: { id: number; userName: string | null; action: string; module: string; detail: string | null; createdAt: Date; ip: string | null }) => ({
      id: l.id,
      user: l.userName || '系统',
      action: l.action,
      module: l.module,
      detail: l.detail || '',
      time: l.createdAt.toISOString().replace('T', ' ').slice(0, 19),
      ip: l.ip || '未知',
    }))

    return { data, total, page: params.page, limit: params.limit }
  }

  /** 写入一条日志 */
  async create(log: {
    userId?: string
    userName?: string
    action: string
    module: string
    detail?: string
    ip?: string
  }) {
    return prisma.auditLog.create({ data: log })
  }

  /** 导出 CSV */
  async exportCsv(params: { search?: string; action?: string; module?: string; dateFrom?: string; dateTo?: string }) {
    const result = await this.list({ ...params, page: 1, limit: 9999 })
    const header = 'ID,操作人,动作,模块,详情,时间,IP\n'
    const rows = result.data
      .map((l) => `${l.id},"${l.user}","${l.action}","${l.module}","${l.detail}","${l.time}","${l.ip}"`)
      .join('\n')
    return header + rows
  }
}

export const logService = new LogService()
