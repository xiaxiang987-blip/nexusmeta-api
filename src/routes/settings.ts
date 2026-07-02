/**
 * 系统设置路由
 */
import { Router } from 'express'
import { settingsController } from '../controllers/settings.controller'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { updateSettingsSchema } from '../validators/settings.validator'

const router = Router()

router.use(authenticate)
router.use(requireAdmin)

router.get('/', (req, res, next) => settingsController.getSettings(req, res, next))
router.put('/', validate(updateSettingsSchema), (req, res, next) => settingsController.updateSettings(req, res, next))

export default router
