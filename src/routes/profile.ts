/**
 * 个人中心路由
 */
import { Router } from 'express'
import { profileController } from '../controllers/profile.controller'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { updateProfileSchema, changePasswordSchema } from '../validators/profile.validator'

const router = Router()

router.use(authenticate)

router.get('/', (req, res, next) => profileController.getProfile(req, res, next))
router.put('/', validate(updateProfileSchema), (req, res, next) => profileController.updateProfile(req, res, next))
router.put('/change-password', validate(changePasswordSchema), (req, res, next) => profileController.changePassword(req, res, next))
router.post('/reset-api-key', (req, res, next) => profileController.resetApiKey(req, res, next))
router.post('/clear-cache', (req, res, next) => profileController.clearCache(req, res, next))

export default router
