/**
 * 用户管理路由
 */
import { Router } from 'express'
import { userController } from '../controllers/user.controller'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { createUserSchema, updateUserSchema, updateUserStatusSchema, userQuerySchema } from '../validators/user.validator'

const router = Router()

router.use(authenticate)
router.use(requireAdmin)

router.get('/', validate(userQuerySchema, 'query'), (req, res, next) => userController.list(req, res, next))
router.get('/:id', (req, res, next) => userController.getById(req, res, next))
router.post('/', validate(createUserSchema), (req, res, next) => userController.create(req, res, next))
router.put('/:id', validate(updateUserSchema), (req, res, next) => userController.update(req, res, next))
router.delete('/:id', (req, res, next) => userController.delete(req, res, next))
router.patch('/:id/status', validate(updateUserStatusSchema), (req, res, next) => userController.updateStatus(req, res, next))

export default router
