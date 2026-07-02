/**
 * 仪表盘路由
 */
import { Router } from 'express'
import { dashboardController } from '../controllers/dashboard.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/stats', (req, res, next) => dashboardController.getStats(req, res, next))
router.get('/revenue-trend', (req, res, next) => dashboardController.getRevenueTrend(req, res, next))
router.get('/user-regions', (req, res, next) => dashboardController.getUserRegions(req, res, next))
router.get('/recent-orders', (req, res, next) => dashboardController.getRecentOrders(req, res, next))

export default router
