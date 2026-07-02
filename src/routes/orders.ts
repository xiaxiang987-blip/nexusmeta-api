/**
 * 订单管理路由
 */
import { Router } from 'express'
import { orderController } from '../controllers/order.controller'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { orderQuerySchema, updateOrderStatusSchema } from '../validators/order.validator'

const router = Router()

router.use(authenticate)
router.use(requireAdmin)

router.get('/', validate(orderQuerySchema, 'query'), (req, res, next) => orderController.list(req, res, next))
router.get('/export', (req, res, next) => orderController.exportCsv(req, res, next))
router.get('/:id', (req, res, next) => orderController.getById(req, res, next))
router.patch('/:id/status', validate(updateOrderStatusSchema), (req, res, next) => orderController.updateStatus(req, res, next))

export default router
