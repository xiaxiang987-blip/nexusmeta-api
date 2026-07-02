/**
 * 多语言管理路由
 */
import { Router } from 'express'
import { languageController } from '../controllers/language.controller'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { batchUpdateTranslationsSchema } from '../validators/language.validator'

const router = Router()

router.use(authenticate)
router.use(requireAdmin)

router.get('/translations', (req, res, next) => languageController.getTranslations(req, res, next))
router.put('/translations', validate(batchUpdateTranslationsSchema), (req, res, next) => languageController.batchUpdate(req, res, next))

export default router
