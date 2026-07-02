/**
 * 操作日志 Controller
 */
import { Request, Response, NextFunction } from 'express'
import { logService } from '../services/log.service'
import { paginated } from '../utils/response'

export class LogController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await logService.list({
        search: req.query.search as string,
        action: req.query.action as string,
        module: req.query.module as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      })
      res.json(paginated(result.data, result.total, result.page, result.limit))
    } catch (err) {
      next(err)
    }
  }

  async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await logService.exportCsv({
        search: req.query.search as string,
        action: req.query.action as string,
        module: req.query.module as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      })

      await logService.create({
        userId: (req as any).user?.userId,
        userName: (req as any).user?.name,
        action: '导出',
        module: '系统',
        detail: '导出操作日志',
        ip: req.ip || undefined,
      }).catch(() => {})

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename=logs_${new Date().toISOString().slice(0, 10)}.csv`)
      res.send('\uFEFF' + csv)
    } catch (err) {
      next(err)
    }
  }
}

export const logController = new LogController()
