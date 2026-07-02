/**
 * 多语言管理 Controller
 */
import { Request, Response, NextFunction } from 'express'
import { languageService } from '../services/language.service'
import { success } from '../utils/response'
import { logService } from '../services/log.service'

export class LanguageController {
  async getTranslations(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await languageService.getAllTranslations()
      res.json(success(data))
    } catch (err) {
      next(err)
    }
  }

  async batchUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      await languageService.batchUpdate(req.body.translations)
      await logService.create({
        userId: (req as any).user?.userId,
        userName: (req as any).user?.name,
        action: '编辑',
        module: '多语言管理',
        detail: `批量更新 ${req.body.translations.length} 条翻译`,
        ip: req.ip || undefined,
      }).catch(() => {})
      res.json(success(null, '翻译保存成功'))
    } catch (err) {
      next(err)
    }
  }
}

export const languageController = new LanguageController()
