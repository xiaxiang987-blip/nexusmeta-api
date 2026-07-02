/**
 * 命理分析控制器
 * 
 * 处理八字、紫微、风水、合婚、流年等命理分析请求
 */

import { Request, Response, NextFunction } from 'express'
import { success } from '../utils/response'
import { ValidationError } from '../utils/errors'
import { logger } from '../utils/logger'
import {
  analyzeDivination,
  analyzeBazi,
  analyzeFengshui,
  DivinationRequest,
} from '../services/openai'

// 每种分析类型消耗积分
const CREDIT_COST: Record<string, number> = {
  BAZI: 10,
  ZIWEI: 15,
  FENGSHUI: 20,
  COMPATIBILITY: 25,
  YEARLY_FORTUNE: 15,
  MONTHLY_FORTUNE: 10,
}

export const divinationController = {
  /** POST /api/divination/analyze — 通用命理分析（需登录） */
  async analyze(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId
      const body = req.body

      // 构造请求
      const divinationReq: DivinationRequest = {
        type: body.type,
        name: body.name,
        gender: body.gender,
        birthDate: body.birthDate,
        birthTime: body.birthTime,
        birthPlace: body.birthPlace,
        language: body.language || 'zh',
        partnerName: body.partnerName,
        partnerGender: body.partnerGender,
        partnerBirthDate: body.partnerBirthDate,
        partnerBirthTime: body.partnerBirthTime,
        targetYear: body.targetYear,
        targetMonth: body.targetMonth,
      }

      // TODO: 检查积分（数据库就绪后实现）
      // const user = await userService.getById(userId)
      // const cost = CREDIT_COST[body.type] || 10
      // if (user.credits < cost) {
      //   throw new AppError('积分不足，请充值', 402, 'INSUFFICIENT_CREDITS')
      // }

      logger.info(`用户 ${userId} 发起 ${body.type} 命理分析`, { language: body.language })

      // 调用 AI 分析
      const result = await analyzeDivination(divinationReq)

      if (!result.success) {
        // AI 分析失败，但返回部分结果
        return res.status(500).json({
          success: false,
          error: result.error || 'AI 分析失败',
          data: result.data,
          timestamp: new Date().toISOString(),
        })
      }

      // TODO: 保存记录到数据库 & 扣除积分
      // await divinationService.create(userId, body.type, divinationReq, result.data)
      // await userService.deductCredits(userId, cost)

      res.json(success(result.data, '分析完成'))
    } catch (err) {
      next(err)
    }
  },

  /** POST /api/divination/bazi/free — 免费八字排盘（无需登录） */
  async baziFree(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, gender, birthDate, birthTime, birthPlace, language } = req.body

      const result = await analyzeBazi({
        type: 'BAZI',
        name,
        gender,
        birthDate,
        birthTime,
        birthPlace,
        language: language || 'zh',
      })

      res.json({
        success: true,
        data: result.data,
        note: '🎁 免费体验版，详细分析请注册登录',
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      next(err)
    }
  },

  /** POST /api/divination/fengshui — 风水分析 */
  async fengshui(req: Request, res: Response, next: NextFunction) {
    try {
      const { description, analysisType, language } = req.body

      logger.info('风水分析请求', { analysisType, language })

      const result = await analyzeFengshui(description, analysisType, language || 'zh')

      res.json(success(result.data, '风水分析完成'))
    } catch (err) {
      next(err)
    }
  },

  /** GET /api/divination/history — 查询解盘历史 */
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10))
      const type = req.query.type as string | undefined

      // TODO: 从数据库查询
      // const result = await divinationService.getHistory(userId, page, limit, type)

      res.json({
        success: true,
        data: {
          items: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        },
        message: '历史记录功能开发中，数据库就绪后可用',
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      next(err)
    }
  },

  /** GET /api/divination/:id — 查询单条解盘记录 */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = (req as any).user.userId

      // TODO: 从数据库查询
      // const record = await divinationService.getById(id, userId)

      res.json({
        success: true,
        data: null,
        message: '单条记录查询功能开发中',
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      next(err)
    }
  },

  /** GET /api/divination/knowledge/:term — 查询命理术语 */
  async getKnowledge(req: Request, res: Response, next: NextFunction) {
    try {
      const { term } = req.params
      const language = (req.query.language as string) || 'zh'

      const knowledgeBase: Record<string, Record<string, string>> = {
        '天干': {
          zh: '天干共有十个：甲、乙、丙、丁、戊、己、庚、辛、壬、癸。甲乙属木，丙丁属火，戊己属土，庚辛属金，壬癸属水。',
          en: 'The Ten Heavenly Stems are: Jia, Yi, Bing, Ding, Wu, Ji, Geng, Xin, Ren, Gui. They represent the five elements in their yin and yang forms.',
        },
        '地支': {
          zh: '地支共有十二个：子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥。对应十二生肖，也对应十二时辰。',
          en: 'The Twelve Earthly Branches correspond to the twelve animals of the Chinese zodiac.',
        },
        '五行': {
          zh: '五行包括：金、木、水、火、土。相生：金生水、水生木、木生火、火生土、土生金。相克：金克木、木克土、土克水、水克火、火克金。',
          en: 'The Five Elements (Wu Xing) are Metal, Wood, Water, Fire, Earth with cycles of generation and conquest.',
        },
        '十神': {
          zh: '十神是八字分析中用到的十种神煞：比肩、劫财、食神、伤官、偏财、正财、七杀、正官、偏印、正印。描述天干之间的生克关系。',
          en: 'The Ten Gods (Shi Shen) describe relationships between heavenly stems in BaZi analysis.',
        },
      }

      const info = knowledgeBase[term]
      if (!info) {
        return res.status(404).json({
          success: false,
          error: '未找到该术语',
          code: 'TERM_NOT_FOUND',
          timestamp: new Date().toISOString(),
        })
      }

      res.json(success({
        term,
        explanation: info[language] || info.en || info.zh,
      }))
    } catch (err) {
      next(err)
    }
  },
}
