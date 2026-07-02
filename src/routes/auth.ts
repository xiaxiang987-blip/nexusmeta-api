/**
 * 认证路由
 * 
 * 路由只做两件事：
 * 1. 挂载验证中间件
 * 2. 委托给 Controller 处理
 */

import { Router } from 'express'
import { validate } from '../middleware/validate'
import { authenticate } from '../middleware/auth'
import { authSchemas } from '../validators/auth.validator'
import { authController } from '../controllers/auth.controller'

const router = Router()

// 公开接口
router.post('/register', validate(authSchemas.register), authController.register)
router.post('/login', validate(authSchemas.login), authController.login)
router.post('/admin/login', validate(authSchemas.login), authController.adminLogin)

// 需要认证的接口
router.get('/profile', authenticate, authController.getProfile)
router.put('/profile', authenticate, validate(authSchemas.updateProfile), authController.updateProfile)

export default router
