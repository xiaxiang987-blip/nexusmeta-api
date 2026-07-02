/**
 * 个人中心 Controller
 */
import { Request, Response, NextFunction } from 'express'
import { profileService } from '../services/profile.service'
import { success } from '../utils/response'
import { logService } from '../services/log.service'

export class ProfileController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId
      const data = await profileService.getProfile(userId)
      res.json(success(data))
    } catch (err) {
      next(err)
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId
      await profileService.updateProfile(userId, req.body)
      const updated = await profileService.getProfile(userId)
      res.json(success(updated, '个人信息已更新'))
    } catch (err) {
      next(err)
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId
      await profileService.changePassword(userId, req.body)
      await logService.create({
        userId,
        userName: (req as any).user?.name,
        action: '修改',
        module: '系统',
        detail: '修改登录密码',
        ip: req.ip || undefined,
      }).catch(() => {})
      res.json(success(null, '密码修改成功'))
    } catch (err) {
      next(err)
    }
  }

  async resetApiKey(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId
      const result = await profileService.resetApiKey(userId)
      await logService.create({
        userId,
        userName: (req as any).user?.name,
        action: '修改',
        module: '系统',
        detail: '重置API密钥',
        ip: req.ip || undefined,
      }).catch(() => {})
      res.json(success(result, 'API密钥已重置'))
    } catch (err) {
      next(err)
    }
  }

  async clearCache(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await profileService.clearCache()
      res.json(success(result))
    } catch (err) {
      next(err)
    }
  }
}

export const profileController = new ProfileController()
