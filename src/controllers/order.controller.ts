/**
 * 订单管理 Controller
 */
import { Request, Response, NextFunction } from 'express'
import { orderService } from '../services/order.service'
import { success, paginated } from '../utils/response'
import { logService } from '../services/log.service'

export class OrderController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.list({
        search: req.query.search as string,
        status: req.query.status as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      })
      res.json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        summary: result.summary,
      })
    } catch (err) {
      next(err)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getById(req.params.id)
      if (!order) {
        res.status(404).json({ success: false, error: '订单不存在' })
        return
      }
      res.json(success(order))
    } catch (err) {
      next(err)
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.updateStatus(req.params.id, req.body.status)
      await logService.create({
        userId: (req as any).user?.userId,
        userName: (req as any).user?.name,
        action: '修改',
        module: '订单管理',
        detail: `${req.body.status === 'CANCELLED' ? '取消' : '完成'}订单 ${order.displayId}`,
        ip: req.ip || undefined,
      }).catch(() => {})
      res.json(success(order, '订单状态更新成功'))
    } catch (err) {
      next(err)
    }
  }

  async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await orderService.exportCsv({
        search: req.query.search as string,
        status: req.query.status as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      })
      await logService.create({
        userId: (req as any).user?.userId,
        userName: (req as any).user?.name,
        action: '导出',
        module: '订单管理',
        detail: '导出订单报表',
        ip: req.ip || undefined,
      }).catch(() => {})

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename=orders_${new Date().toISOString().slice(0, 10)}.csv`)
      res.send('\uFEFF' + csv) // BOM for Excel
    } catch (err) {
      next(err)
    }
  }
}

export const orderController = new OrderController()
