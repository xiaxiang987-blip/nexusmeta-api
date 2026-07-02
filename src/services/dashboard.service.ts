/**
 * 仪表盘 Service
 */
import { prisma } from '../config/database'

export class DashboardService {
  /** 获取关键统计指标 */
  async getStats() {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const [totalUsers, monthlyUsers, lastMonthUsers] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'USER', createdAt: { gte: monthStart } } }),
      prisma.user.count({ where: { role: 'USER', createdAt: { gte: lastMonthStart, lt: monthStart } } }),
    ])

    const [monthlyOrders, lastMonthOrders] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.order.count({ where: { createdAt: { gte: lastMonthStart, lt: monthStart } } }),
    ])

    const [monthlyRevenueResult, lastMonthRevenueResult] = await Promise.all([
      prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', createdAt: { gte: monthStart } } }),
      prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', createdAt: { gte: lastMonthStart, lt: monthStart } } }),
    ])

    const monthlyRevenue = monthlyRevenueResult._sum.amount || 0
    const lastMonthRevenue = lastMonthRevenueResult._sum.amount || 0

    // 今日活跃（简化：最近创建的用户当活跃）
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dailyActive = await prisma.user.count({ where: { createdAt: { gte: todayStart } } })

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 1000) / 10
    }

    return {
      totalUsers: { value: totalUsers, change: calcChange(monthlyUsers, lastMonthUsers) },
      monthlyOrders: { value: monthlyOrders, change: calcChange(monthlyOrders, lastMonthOrders) },
      monthlyRevenue: { value: monthlyRevenue, change: calcChange(monthlyRevenue, lastMonthRevenue) },
      dailyActive: { value: dailyActive, change: 0 },
    }
  }

  /** 营收趋势（近12月） */
  async getRevenueTrend() {
    const months: { month: string; revenue: number; users: number }[] = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const y = now.getFullYear()
      const m = now.getMonth() - i
      const start = new Date(y, m, 1)
      const end = new Date(y, m + 1, 1)
      const label = `${start.getMonth() + 1}月`

      const [orders, users] = await Promise.all([
        prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', createdAt: { gte: start, lt: end } } }),
        prisma.user.count({ where: { role: 'USER', createdAt: { gte: start, lt: end } } }),
      ])

      months.push({
        month: label,
        revenue: orders._sum.amount || 0,
        users,
      })
    }

    return months
  }

  /** 用户地区分布 */
  async getUserRegions() {
    const users = await prisma.user.findMany({
      where: { role: 'USER', region: { not: null } },
      select: { region: true },
    })

    const map = new Map<string, number>()
    for (const u of users) {
      const r = u.region || '其他'
      map.set(r, (map.get(r) || 0) + 1)
    }

    const total = map.size > 0 ? Array.from(map.values()).reduce((a, b) => a + b, 0) : 1
    const result = Array.from(map.entries())
      .map(([name, count]) => ({ name, value: Math.round((count / total) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    // 标准化和为100
    const sum = result.reduce((a, b) => a + b.value, 0)
    if (result.length > 0 && sum < 100) {
      result[result.length - 1].value += (100 - sum)
    }

    return result
  }

  /** 最近订单 */
  async getRecentOrders(limit = 5) {
    const orders = await prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    })

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

    return orders.map((o: { displayId: string; user: { name: string | null }; amount: number; plan: string | null; status: string; createdAt: Date }) => ({
      id: o.displayId,
      user: o.user.name || '未知用户',
      plan: planLabelMap[o.plan || 'FREE'] || o.plan || '未知',
      amount: o.amount,
      status: statusLabelMap[o.status] || o.status,
      date: o.createdAt.toISOString().slice(0, 10),
    }))
  }
}

export const dashboardService = new DashboardService()
