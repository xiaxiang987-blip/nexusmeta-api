/**
 * 路由汇总
 *
 * 所有 API 路由统一注册入口
 */

import { Router } from 'express'
import authRoutes from './auth'
import divinationRoutes from './divination'
import dashboardRoutes from './dashboard'
import userRoutes from './users'
import contentRoutes from './content'
import orderRoutes from './orders'
import languageRoutes from './languages'
import settingsRoutes from './settings'
import logRoutes from './logs'
import profileRoutes from './profile'

const router = Router()

// ===== API 根路径信息 =====
router.get('/', (_req, res) => {
  res.json({
    success: true,
    service: '玄咪AI NexusMeta API',
    version: '1.0.0',
    supportedLanguages: 70,
    timestamp: new Date().toISOString(),
    modules: {
      auth: {
        register: 'POST   /api/auth/register',
        login: 'POST   /api/auth/login',
        adminLogin: 'POST   /api/auth/admin/login',
        profile: 'GET    /api/auth/profile',
        updateProfile: 'PUT    /api/auth/profile',
      },
      divination: {
        analyze: 'POST   /api/divination/analyze',
        baziFree: 'POST   /api/divination/bazi/free',
        fengshui: 'POST   /api/divination/fengshui',
        history: 'GET    /api/divination/history',
        detail: 'GET    /api/divination/:id',
        knowledge: 'GET    /api/divination/knowledge/:term',
      },
      dashboard: {
        stats: 'GET    /api/dashboard/stats',
        revenueTrend: 'GET    /api/dashboard/revenue-trend',
        userRegions: 'GET    /api/dashboard/user-regions',
        recentOrders: 'GET    /api/dashboard/recent-orders',
      },
      users: {
        list: 'GET    /api/users',
        detail: 'GET    /api/users/:id',
        create: 'POST   /api/users',
        update: 'PUT    /api/users/:id',
        delete: 'DELETE /api/users/:id',
        status: 'PATCH  /api/users/:id/status',
      },
      content: {
        faqs: 'GET    /api/content/faqs',
        faqCreate: 'POST   /api/content/faqs',
        faqUpdate: 'PUT    /api/content/faqs/:id',
        faqDelete: 'DELETE /api/content/faqs/:id',
        reviews: 'GET    /api/content/reviews',
        reviewCreate: 'POST   /api/content/reviews',
        reviewUpdate: 'PUT    /api/content/reviews/:id',
        reviewDelete: 'DELETE /api/content/reviews/:id',
        logos: 'GET    /api/content/logos',
        logoCreate: 'POST   /api/content/logos',
        logoDelete: 'DELETE /api/content/logos/:id',
      },
      orders: {
        list: 'GET    /api/orders',
        detail: 'GET    /api/orders/:id',
        status: 'PATCH  /api/orders/:id/status',
        export: 'GET    /api/orders/export',
      },
      languages: {
        translations: 'GET    /api/languages/translations',
        batchUpdate: 'PUT    /api/languages/translations',
      },
      settings: {
        get: 'GET    /api/settings',
        update: 'PUT    /api/settings',
      },
      logs: {
        list: 'GET    /api/logs',
        export: 'GET    /api/logs/export',
      },
      profile: {
        get: 'GET    /api/profile',
        update: 'PUT    /api/profile',
        changePassword: 'PUT    /api/profile/change-password',
        resetApiKey: 'POST   /api/profile/reset-api-key',
        clearCache: 'POST   /api/profile/clear-cache',
      },
    },
  })
})

// ===== 注册子路由 =====
router.use('/auth', authRoutes)
router.use('/divination', divinationRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/users', userRoutes)
router.use('/content', contentRoutes)
router.use('/orders', orderRoutes)
router.use('/languages', languageRoutes)
router.use('/settings', settingsRoutes)
router.use('/logs', logRoutes)
router.use('/profile', profileRoutes)

export default router
