/**
 * 命理分析路由
 * 
 * 路由层职责：参数验证 + 中间件挂载 → 委托 Controller
 */

import { Router } from 'express'
import { validate } from '../middleware/validate'
import { authenticate } from '../middleware/auth'
import { divinationSchemas } from '../validators/divination.validator'
import { divinationController } from '../controllers/divination.controller'

const router = Router()

// ===== 免费接口（无需登录） =====
// Fengshui endpoint is PUBLIC - no auth required (verified 2026-07-02)
router.post('/bazi/free', validate(divinationSchemas.baziFree), divinationController.baziFree)
router.post('/fengshui', validate(divinationSchemas.fengshui), divinationController.fengshui)
router.get('/knowledge/:term', divinationController.getKnowledge)

// ===== 需要登录 =====
router.post('/analyze', authenticate, validate(divinationSchemas.analyze), divinationController.analyze)
router.get('/history', authenticate, divinationController.getHistory)
router.get('/:id', authenticate, divinationController.getById)

export default router
