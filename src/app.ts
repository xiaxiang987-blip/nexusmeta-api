/**
 * Express 应用配置
 * 
 * 中间件注册、路由挂载、错误处理
 * 
 * 注：环境变量由 config/env.ts 自动加载
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import path from 'path'

import config from './config/env'
import { initOpenAI } from './services/openai'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/error-handler'
import apiRoutes from './routes/index'

// ===== 创建应用 =====

const app = express()

// ===== AI 服务初始化 =====

if (config.openaiApiKey) {
  initOpenAI(config.openaiApiKey, config.openaiBaseUrl)
  logger.info(`AI 服务初始化成功 [${config.openaiModel}] @ ${config.openaiBaseUrl || 'default'}`)
} else {
  logger.warn('未配置 AI API Key，命理分析功能不可用')
}

// ===== CORS =====

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}))

// ===== 请求体解析 =====

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ===== 压缩 =====

app.use(compression())

// ===== 请求日志 =====

app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.http(req.method, req.path, res.statusCode, duration)
  })
  next()
})

// ===== 健康检查 =====

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'nexusmeta-divination-api',
    version: '1.1.0',
    deployTime: '2026-07-02T21:29',
    timestamp: new Date().toISOString(),
    ai: config.openaiApiKey ? 'configured' : 'not_configured',
    environment: config.nodeEnv,
  })
})

// ===== 托管前端静态文件（管理后台）——先于 helmet，避免安全头干扰 =====

import fs from 'fs'

const adminDist = path.join(__dirname, '../../nexusmeta-admin/dist')
const adminExists = fs.existsSync(adminDist)

if (adminExists) {
  app.use(express.static(adminDist, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript')
      else if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css')
    }
  }))

  // SPA 路由回退：非 API 路径统一返回 index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(adminDist, 'index.html'))
  })
} else {
  logger.info('管理后台静态文件未部署，仅提供 API 服务')
}

// ===== API 安全加固（仅对 /api/ 生效） =====

app.use('/api/', helmet({
  contentSecurityPolicy: false,
}))

// ===== 限流 =====

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT',
    timestamp: new Date().toISOString(),
  },
})
app.use('/api/', limiter)

// ===== API 路由 =====

app.use('/api', apiRoutes)

// ===== 404 处理 =====

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `路径 ${req.method} ${req.originalUrl} 不存在`,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  })
})

// ===== 全局错误处理（必须放在路由之后） =====

app.use(errorHandler)

export default app
