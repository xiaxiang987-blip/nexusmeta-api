/**
 * JWT 认证中间件
 */
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import config from '../config/env'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
    role: string
    name?: string
  }
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  return authMiddleware(req, res, next)
}

function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // 从 Header 获取 Token
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // "Bearer <token>"
    
    if (!token) {
      res.status(401).json({ success: false, error: '未提供认证令牌' })
      return
    }
    
    // 验证 Token
    jwt.verify(token, config.jwtSecret, (err: any, decoded: any) => {
      if (err) {
        res.status(403).json({ success: false, error: '令牌无效或已过期' })
        return
      }
      
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'USER',
      }
      next()
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '认证过程发生错误' })
  }
}

/**
 * 管理员权限中间件
 */
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  return adminMiddleware(req, res, next)
}

function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    res.status(403).json({ success: false, error: '需要管理员权限' })
    return
  }
  next()
}

/**
 * 生成 JWT Token
 */
export function generateToken(userId: string, email: string, role: string = 'USER'): string {
  return jwt.sign(
    { userId, email, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as any }
  )
}

/**
 * 验证 Token（用于 Socket 等场景）
 */
export function verifyToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'USER',
    }
  } catch {
    return null
  }
}
