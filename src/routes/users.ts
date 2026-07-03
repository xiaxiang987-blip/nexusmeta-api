/**
 * 用户管理路由
 */
import { Router, Request, Response, NextFunction } from 'express'
import { userController } from '../controllers/user.controller'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createUserSchema, updateUserSchema, updateUserStatusSchema, userQuerySchema } from '../validators/user.validator'

const router = Router()

router.use(authenticate)
router.use(requireAdmin)

router.get('/', validate(userQuerySchema, 'query'), (req: Request, res: Response, next: NextFunction) => userController.list(req, res, next))
router.get('/:id', (req: Request, res: Response, next: NextFunction) => userController.getById(req, res, next))
router.post('/', validate(createUserSchema), (req: Request, res: Response, next: NextFunction) => userController.create(req, res, next))
router.put('/:id', validate(updateUserSchema), (req: Request, res: Response, next: NextFunction) => userController.update(req, res, next))
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => userController.delete(req, res, next))
router.patch('/:id/status', validate(updateUserStatusSchema), (req: Request, res: Response, next: NextFunction) => userController.updateStatus(req, res, next))

export default router
