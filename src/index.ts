/**
 * 玄咪AI NexusMeta 命理解盘后端服务 — 启动入口
 * 
 * 启动：npm run dev   |   npm run build && npm start
 */

import app from './app'
import config from './config/env'
import { logger } from './utils/logger'

const PORT = config.port

const server = app.listen(PORT, () => {
  const banner = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    玄咪AI NexusMeta  命理解盘 API  v1.0.0                   ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  环境：${config.nodeEnv.padEnd(44)}║
║  端口：${PORT.toString().padEnd(44)}║
║  地址：http://localhost:${PORT}${' '.repeat(37 - PORT.toString().length)}║
║  API： http://localhost:${PORT}/api${' '.repeat(32 - PORT.toString().length)}║
║  健康：http://localhost:${PORT}/health${' '.repeat(30 - PORT.toString().length)}║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  八字排盘 → 紫微斗数 → 风水分析 → 合婚合盘                ║
║  流年运势 → 流月运势 → 70种语言支持                        ║
║                                                              ║
║  AI 引擎：${config.openaiModel || '未配置'.padEnd(42)}║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`
  console.log(banner)
  logger.info(`服务已启动`, { port: PORT, env: config.nodeEnv })
})

// ===== 优雅退出 =====

async function gracefulShutdown(signal: string) {
  logger.info(`收到 ${signal}，准备退出...`)
  server.close(() => {
    logger.info('HTTP 服务已关闭')
    process.exit(0)
  })
  // 强制退出（超时保护）
  setTimeout(() => {
    logger.warn('强制退出')
    process.exit(1)
  }, 5000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// 未捕获异常
process.on('uncaughtException', (err) => {
  logger.error(`未捕获异常: ${err.message}`, { stack: err.stack })
  process.exit(1)
})

process.on('unhandledRejection', (reason: any) => {
  logger.error(`未处理的 Promise 拒绝: ${reason?.message || reason}`)
})

export default server
