/**
 * 环境配置
 * 
 * 注意：dotenv 加载不一定需要绝对路径——
 * 直接从 process.cwd() 找 .env 即可（npm scripts 在项目根目录执行）
 */

import dotenv from 'dotenv'
import path from 'path'

// 尝试从项目根目录加载 .env
dotenv.config({ path: path.resolve(__dirname, '../..', '.env') })

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // 数据库
  databaseUrl: process.env.DATABASE_URL || '',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'nexusmeta_default_secret_change_in_production',
  jwtExpiresIn: '7d',
  
  // AI 服务（兼容 OpenAI/DeepSeek/通义千问）
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'deepseek-chat',
  openaiBaseUrl: process.env.OPENAI_BASE_URL,
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['https://xuanmi.net', 'http://localhost:5173'],
  
  // 限流
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // 积分消耗
  credits: {
    baziAnalysis: 10,
    ziweiAnalysis: 15,
    fengshuiAnalysis: 20,
    compatibility: 25,
    yearlyFortune: 15,
    monthlyFortune: 10,
    translation: 5,
    videoGeneration: 50,
  }
}

export default config
