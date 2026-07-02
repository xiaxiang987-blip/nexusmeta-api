/**
 * 仪表盘 Controller
 */
import { Request, Response, NextFunction } from 'express'
import { dashboardService } from '../services/dashboard.service'
import { success } from '../utils/response'

export class DashboardController {
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getStats()
      res.json(success(data))
    } catch (err) {
      next(err)
    }
  }

  async getRevenueTrend(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getRevenueTrend()
      res.json(success(data))
    } catch (err) {
      next(err)
    }
  }

  async getUserRegions(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getUserRegions()
      res.json(success(data))
    } catch (err) {
      next(err)
    }
  }

  async getRecentOrders(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getRecentOrders()
      res.json(success(data))
    } catch (err) {
      next(err)
    }
  }
}

export const dashboardController = new DashboardController()
