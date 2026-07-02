/**
 * 内容管理路由（FAQ / 评价 / Logo）
 */
import { Router } from 'express'
import { contentController } from '../controllers/content.controller'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  createFaqSchema,
  updateFaqSchema,
  createReviewSchema,
  updateReviewSchema,
  createLogoSchema,
} from '../validators/content.validator'

const router = Router()

router.use(authenticate)
router.use(requireAdmin)

// FAQ
router.get('/faqs', (req, res, next) => contentController.listFaqs(req, res, next))
router.post('/faqs', validate(createFaqSchema), (req, res, next) => contentController.createFaq(req, res, next))
router.put('/faqs/:id', validate(updateFaqSchema), (req, res, next) => contentController.updateFaq(req, res, next))
router.delete('/faqs/:id', (req, res, next) => contentController.deleteFaq(req, res, next))

// 客户评价
router.get('/reviews', (req, res, next) => contentController.listReviews(req, res, next))
router.post('/reviews', validate(createReviewSchema), (req, res, next) => contentController.createReview(req, res, next))
router.put('/reviews/:id', validate(updateReviewSchema), (req, res, next) => contentController.updateReview(req, res, next))
router.delete('/reviews/:id', (req, res, next) => contentController.deleteReview(req, res, next))

// 合作方 Logo
router.get('/logos', (req, res, next) => contentController.listLogos(req, res, next))
router.post('/logos', validate(createLogoSchema), (req, res, next) => contentController.createLogo(req, res, next))
router.delete('/logos/:id', (req, res, next) => contentController.deleteLogo(req, res, next))

export default router
