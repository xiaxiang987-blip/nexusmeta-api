/**
 * Zod 请求验证中间件
 * 
 * 用法：
 *   router.post('/register', validate(authSchemas.register), authController.register)
 * 
 * 验证来源：req.body（默认）、req.query、req.params
 */

import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
import { ValidationError } from '../utils/errors'

type ValidationSource = 'body' | 'query' | 'params'

export function validate(schema: ZodSchema, source: ValidationSource = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source])
      // 将验证后的数据替换回去（自动处理默认值、类型转换）
      req[source] = data
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        next(new ValidationError(messages.join('; ')))
      } else {
        next(err)
      }
    }
  }
}
