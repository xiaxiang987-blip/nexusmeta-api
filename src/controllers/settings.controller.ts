/**
 * 系统设置 Controller
 */
import { Request, Response, NextFunction } from 'express'
import { settingsService } from '../services/settings.service'
import { success } from '../utils/response'
import { logService } from '../services/log.service'

export class SettingsController {
  async getSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await settingsService.getSettings()
      res.json(success(data))
    } catch (err) {
      next(err)
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await settingsService.updateSettings(req.body)
      await logService.create({
        userId: (req as any).user?.userId,
        userName: (req as any).user?.name,
        action: '修改',
        module: '系统设置',
        detail: '更新系统配置',
        ip: req.ip || undefined,
      }).catch(() => {})
      res.json(success(data, '设置保存成功'))
    } catch (err) {
      next(err)
    }
  }
}

export const settingsController = new SettingsController()
