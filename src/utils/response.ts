/**
 * 统一 API 响应格式
 * 
 * 成功：
 *   res.json(success(data, '操作成功'))
 *   res.json(success({ user }, '登录成功'))
 * 
 * 分页：
 *   res.json(paginated(users, total, page, limit))
 * 
 * 失败（被 error-handler 自动处理，通常不需要手动调用）：
 *   res.json(error('用户不存在', 'USER_NOT_FOUND'))
 */

export interface ApiSuccess<T = any> {
  success: true
  data: T
  message?: string
  timestamp: string
}

export interface ApiError {
  success: false
  error: string
  code?: string
  timestamp: string
}

export interface PaginatedData<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ===== 成功响应 =====

export function success<T>(data: T, message?: string): ApiSuccess<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  }
}

export function created<T>(data: T, message = '创建成功'): ApiSuccess<T> {
  return { success: true, data, message, timestamp: new Date().toISOString() }
}

export function noContent(message = '操作成功'): ApiSuccess<null> {
  return { success: true, data: null, message, timestamp: new Date().toISOString() }
}

// ===== 分页响应 =====

export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): ApiSuccess<PaginatedData<T>> {
  return {
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    timestamp: new Date().toISOString(),
  }
}

// ===== 错误响应 =====

export function error(message: string, code?: string): ApiError {
  return {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
  }
}
