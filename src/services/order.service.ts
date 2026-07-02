/**
 * 订单管理 Service
 */
import { prisma } from '../config/database'
import type { OrderItem } from '../types'

const planLabelMap: Record<string, string> = {
  ENTERPRISE: '企业版',
  PROFESSIONAL: '专业版',
  STARTER: '入门版',
  FREE: '免费版',
}

const statusLabelMap: Record<string, string> = {
  COMPLETED: '已完成',
  PENDING: '待付款',
  CANCELLED: '已取消',
  REFUNDED: '已退款',
}

export class OrderService {
  async list(params: {
    search?: string
    status?: string
    page: number
    limit: number
    dateFrom?: string
    dateTo?: string
  }) {
    const where: any = {}

    if (params.status) where.status = params.status
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {}
      if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom)
      if (params.dateTo) where.createdAt.lte = new Date(params.dateTo + 'T23:59:59')
    }
    if (params.search) {
      where.OR = [
        { displayId: { contains: params.search } },
        { user: { name: { contains: params.search } } },
        { user: { email: { contains: params.search } } },
      ]
    }

    const [total, orders, completedAgg] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.order.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { ...where, status: 'COMPLETED' },
      }),
    ])

    const data: OrderItem[] = orders.map((o: { id: string; displayId: string; user: { name: string | null; email: string } | null; amount: number; plan: string | null; status: string; createdAt: Date; method: string | null }) => ({
      id: o.id,
      displayId: o.displayId,
      user: o.user?.name || '未知用户',
      email: o.user?.email || '未知邮箱',
      plan: planLabelMap[o.plan || 'FREE'] || o.plan || '未知',
      amount: o.amount,
      status: statusLabelMap[o.status] || o.status,
      date: o.createdAt.toISOString().slice(0, 10),
      method: o.method || '未知',
    }))

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      summary: {
        totalCompleted: completedAgg._count,
        totalRevenue: completedAgg._sum.amount || 0,
      },
    }
  }

  async getById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    })
  }

  async updateStatus(id: string, status: 'COMPLETED' | 'CANCELLED') {
    return prisma.order.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    })
  }

  /** 导出 CSV */
  async exportCsv(params: { search?: string; status?: string; dateFrom?: string; dateTo?: string }) {
    const result = await this.list({ ...params, page: 1, limit: 9999 })
    const header = '订单号,用户,邮箱,套餐,金额(CNY),状态,日期,支付方式\n'
    const rows = result.data
      .map((o) => `"${o.displayId}","${o.user}","${o.email}","${o.plan}",${o.amount},"${o.status}","${o.date}","${o.method}"`)
      .join('\n')
    return header + rows
  }
}

export const orderService = new OrderService()
