/**
 * 统一错误类
 * 
 * 用法：
 *   throw new AppError('用户不存在', 404, 'USER_NOT_FOUND')
 *   throw new ValidationError('邮箱格式不正确')
 *   throw new AuthError('Token 已过期')
 *   throw new ForbiddenError('无权限访问')
 */

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message, 400, code)
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class AuthError extends AppError {
  constructor(message = '认证失败', code = 'AUTH_ERROR') {
    super(message, 401, code)
    Object.setPrototypeOf(this, AuthError.prototype)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '无权限访问', code = 'FORBIDDEN') {
    super(message, 403, code)
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(message = '资源不存在', code = 'NOT_FOUND') {
    super(message, 404, code)
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

export class ConflictError extends AppError {
  constructor(message = '资源冲突', code = 'CONFLICT') {
    super(message, 409, code)
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}

export class RateLimitError extends AppError {
  constructor(message = '请求过于频繁', code = 'RATE_LIMIT') {
    super(message, 429, code)
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }
}
