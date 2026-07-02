/**
 * 数据库客户端
 *
 * 优先使用 Prisma（连接 PostgreSQL）/ 自动降级到内存 Mock。
 * 用法：import { prisma } from '../config/database'
 */

import { logger } from '../utils/logger'

// 延迟加载，避免循环依赖
let _prisma: any = null

async function getPrismaClient() {
  if (_prisma) return _prisma

  // 尝试加载 Prisma
  try {
    const { PrismaClient } = require('@prisma/client')
    const client = new PrismaClient({
      log: ['error'],
    })
    await client.$connect()
    logger.info('数据库连接成功 (Prisma/PostgreSQL)')
    _prisma = client
    return _prisma
  } catch (err: any) {
    logger.warn(`Prisma 不可用，使用内存 Mock 存储: ${err.message}`)
    const { MockPrismaClient, seedMockData } = require('./mock-store')
    seedMockData()
    _prisma = MockPrismaClient
    return _prisma
  }
}

// 同步代理：延迟初始化
const handler: ProxyHandler<object> = {
  get(_target, prop) {
    if (!_prisma) {
      // 立即同步初始化 Mock
      const { MockPrismaClient, seedMockData } = require('./mock-store')
      seedMockData()
      _prisma = MockPrismaClient
    }
    return _prisma[prop]
  },
}

export const prisma = new Proxy({}, handler) as any

export async function disconnectDatabase(): Promise<void> {
  if (_prisma) {
    try { await _prisma.$disconnect() } catch {}
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

export default prisma
