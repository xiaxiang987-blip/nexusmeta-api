/**
 * 用户管理 Controller
 */
import { Request, Response, NextFunction } from 'express'
import { userService } from '../services/user.service'
import { success, paginated } from '../utils/response'
import { logService } from '../services/log.service'

export class UserController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.list({
        search: req.query.search as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        status: req.query.status as string,
        plan: req.query.plan as string,
      })
      res.json(paginated(result.data, result.total, result.page, result.limit))
    } catch (err) {
      next(err)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getById(req.params.id)
      if (!user) {
        res.status(404).json({ success: false, error: '用户不存在' })
        return
      }
      res.json(success(user))
    } catch (err) {
      next(err)
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.create(req.body)
      await logService.create({
        userId: (req as any).user?.userId,
        userName: (req as any).user?.name,
        action: '新增',
        module: '用户管理',
        detail: `新增用户 ${user.email}`,
        ip: req.ip || undefined,
      })
      res.status(201).json(success(user, '用户创建成功'))
    } catch (err) {
      next(err)
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.update(req.params.id, req.body)
      await logService.create({
        userId: (req as any).user?.userId,
        userName: (req as any).user?.name,
        action: '编辑',
        module: '用户管理',
        detail: `编辑用户 ${user.email} 信息`,
        ip: req.ip || undefined,
      })
      res.json(success(user, '用户更新成功'))
    } catch (err) {
      next(err)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.delete(req.params.id)
      await logService.create({
        userId: (req as any).user?.userId,
        userName: (req as any).user?.name,
        action: '删除',
        module: '用户管理',
        detail: `删除用户 ID:${req.params.id}`,
        ip: req.ip || undefined,
      })
      res.json(success(null, '用户已删除'))
    } catch (err) {
      next(err)
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateStatus(req.params.id, req.body)
      const status: string = req.body.status
      const labelMap: Record<string, string> = { ACTIVE: '激活', INACTIVE: '停用', BANNED: '封禁' }
      const label = labelMap[status] || status
      await logService.create({
        userId: (req as any).user?.userId,
        userName: (req as any).user?.name,
        action: req.body.status === 'BANNED' ? '封禁' : '修改',
        module: '用户管理',
        detail: `${label}用户 ${user.email}`,
        ip: req.ip || undefined,
      })
      res.json(success(user, `用户${label}成功`))
    } catch (err) {
      next(err)
    }
  }
}

export const userController = new UserController()
