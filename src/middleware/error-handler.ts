/**
 * 全局错误处理中间件
 * 
 * 捕获所有未被 try/catch 处理的错误，返回统一格式
 */

import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors'
import { logger } from '../utils/logger'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // 应用自定义错误
  if (err instanceof AppError) {
    logger.warn(`${err.code}: ${err.message}`, {
      path: req.path,
      method: req.method,
    })
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
    })
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: '无效的认证令牌',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString(),
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: '认证令牌已过期，请重新登录',
      code: 'TOKEN_EXPIRED',
      timestamp: new Date().toISOString(),
    })
  }

  // 未知错误
  logger.error(`未捕获错误: ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack,
  })

  const isDev = process.env.NODE_ENV === 'development'
  return res.status(500).json({
    success: false,
    error: isDev ? err.message : '服务器内部错误',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(isDev && { stack: err.stack }),
  })
}
