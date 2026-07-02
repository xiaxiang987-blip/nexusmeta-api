/**
 * 操作日志路由
 */
import { Router } from 'express'
import { logController } from '../controllers/log.controller'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { logQuerySchema } from '../validators/log.validator'

const router = Router()

router.use(authenticate)
router.use(requireAdmin)

router.get('/', validate(logQuerySchema, 'query'), (req, res, next) => logController.list(req, res, next))
router.get('/export', (req, res, next) => logController.exportCsv(req, res, next))

export default router
