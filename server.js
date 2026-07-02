/**
 * 玄咪AI NexusMeta - 命理解盘 API（JavaScript 版，快速测试用）
 * 
 * 启动：node server.js
 */

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
require('dotenv').config()

// ===== 八字计算引擎（精简版）=====

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const GAN_WUXING = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
}

const ZHI_WUXING = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
}

function calcBazi(year, month, day, hour, gender) {
  // 简化版：使用 lunar-javascript 库的精确计算
  try {
    const { Solar, Lunar } = require('lunar-javascript')
    const solar = Solar.fromYmd(year, month, day)
    const lunar = solar.getLunar()
    
    const yearPillar = lunar.getYearInGanZhi()
    const monthPillar = lunar.getMonthInGanZhi()
    const dayPillar = lunar.getDayInGanZhi()
    const dayGan = dayPillar[0]
    
    // 计算时柱
    const hourZhi = getHourZhi(hour)
    const dayGanIndex = TIAN_GAN.indexOf(dayGan)
    const hourZhiIndex = DI_ZHI.indexOf(hourZhi)
    const hourGanIndex = (dayGanIndex * 2 + hourZhiIndex) % 10
    const hourPillar = TIAN_GAN[hourGanIndex] + hourZhi
    
    const dayMaster = dayGan
    const dayMasterElement = GAN_WUXING[dayMaster]
    
    // 统计五行
    const allGans = [yearPillar[0], monthPillar[0], dayPillar[0], hourPillar[0]]
    const allZhis = [yearPillar[1], monthPillar[1], dayPillar[1], hourPillar[1]]
    
    const wuxingCount = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
    allGans.forEach(gan => { wuxingCount[GAN_WUXING[gan]] = (wuxingCount[GAN_WUXING[gan]] || 0) + 1 })
    allZhis.forEach(zhi => { wuxingCount[ZHI_WUXING[zhi]] = (wuxingCount[ZHI_WUXING[zhi]] || 0) + 1 })
    
    return {
      yearPillar,
      monthPillar,
      dayPillar,
      hourPillar,
      dayMaster,
      dayMasterElement,
      pillars: [yearPillar, monthPillar, dayPillar, hourPillar],
      allGans,
      allZhis,
      wuxingCount,
    }
  } catch (e) {
    // 备用算法
    return calcBaziFallback(year, month, day, hour)
  }
}

function getHourZhi(hour) {
  const h = hour % 24
  if (h === 23 || h === 0) return '子'
  if (h >= 1 && h <= 2) return '丑'
  if (h >= 3 && h <= 4) return '寅'
  if (h >= 5 && h <= 6) return '卯'
  if (h >= 7 && h <= 8) return '辰'
  if (h >= 9 && h <= 10) return '巳'
  if (h >= 11 && h <= 12) return '午'
  if (h >= 13 && h <= 14) return '未'
  if (h >= 15 && h <= 16) return '申'
  if (h >= 17 && h <= 18) return '酉'
  if (h >= 19 && h <= 20) return '戌'
  return '亥'
}

function calcBaziFallback(year, month, day) {
  const baseDate = new Date(1900, 0, 1)
  const targetDate = new Date(year, month - 1, day)
  const diffDays = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24))
  
  const ganIndex = ((diffDays % 10) + 10) % 10
  const zhiIndex = ((diffDays % 12) + 12) % 12
  
  const dayPillar = TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex]
  
  return {
    yearPillar: '未知',
    monthPillar: '未知',
    dayPillar,
    hourPillar: '未知',
    dayMaster: dayPillar[0],
    dayMasterElement: GAN_WUXING[dayPillar[0]],
    pillars: ['未知', '未知', dayPillar, '未知'],
    allGans: [dayPillar[0]],
    allZhis: [dayPillar[1]],
    wuxingCount: { '木': 1, '火': 0, '土': 0, '金': 0, '水': 0 },
  }
}

function formatBaziForPrompt(bazi, gender, name) {
  const strength = judgeDayMasterStrength(bazi)
  const elements = calcLuckyElements(bazi)
  
  return `
## 命主信息
- 姓名：${name || '匿名'}
- 性别：${gender === 'MALE' ? '男' : '女'}
- 四柱八字：${bazi.yearPillar} ${bazi.monthPillar} ${bazi.dayPillar} ${bazi.hourPillar}
- 日主：${bazi.dayMaster}（五行属${bazi.dayMasterElement}）
- 日主强弱：${strength.strength}（${strength.description}）
- 五行统计：木${bazi.wuxingCount['木'] || 0} 火${bazi.wuxingCount['火'] || 0} 土${bazi.wuxingCount['土'] || 0} 金${bazi.wuxingCount['金'] || 0} 水${bazi.wuxingCount['水'] || 0}
- 喜用神：${elements.luckyElements.join('、')}
- 忌神：${elements.weakElements.join('、')}
`.trim()
}

function judgeDayMasterStrength(bazi) {
  const { dayMasterElement, wuxingCount } = bazi
  const support = (wuxingCount[dayMasterElement] || 0) + 1
  const oppose = 5 - support
  const ratio = support / Math.max(oppose, 1)
  
  if (ratio >= 2) return { strength: '强', description: '日主得令得势，身强有力' }
  if (ratio >= 1.2) return { strength: '偏强', description: '日主偏旺，需适当克制' }
  if (ratio >= 0.8) return { strength: '中和', description: '日主中和，五行相对平衡' }
  if (ratio >= 0.5) return { strength: '偏弱', description: '日主偏弱，需生扶帮身' }
  return { strength: '弱', description: '日主衰弱，急需生扶' }
}

function calcLuckyElements(bazi) {
  const { dayMasterElement } = bazi
  const strength = judgeDayMasterStrength(bazi)
  
  const shengMap = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const keMap = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' }
  const beShengMap = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' }
  
  let luckyElements = []
  let weakElements = []
  
  if (strength.strength === '强' || strength.strength === '偏强') {
    luckyElements = [keMap[dayMasterElement], shengMap[dayMasterElement], keMap[beShengMap[dayMasterElement]]]
    weakElements = [dayMasterElement, beShengMap[dayMasterElement]]
  } else {
    luckyElements = [beShengMap[dayMasterElement], dayMasterElement]
    weakElements = [keMap[dayMasterElement], shengMap[dayMasterElement], keMap[beShengMap[dayMasterElement]]]
  }
  
  return {
    luckyElements: [...new Set(luckyElements)],
    weakElements: [...new Set(weakElements)],
  }
}

// ===== Express 应用 =====

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'nexusmeta_secret'

// 中间件
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }))
app.use(express.json())
app.use(compression())

// 限流
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, error: '请求过于频繁，请稍后再试' }
})
app.use('/api/', limiter)

// 请求日志
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`)
  })
  next()
})

// ===== 健康检查 =====

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'nexusmeta-divination-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
  })
})

// ===== API 信息 =====

app.get('/api', (req, res) => {
  res.json({
    success: true,
    service: '玄咪AI NexusMeta 命理解盘API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
      },
      divination: {
        baziFree: 'POST /api/divination/bazi/free',
        analyze: 'POST /api/divination/analyze',
      },
    },
    note: '此为 JavaScript 快速测试版，完整 TypeScript 版开发中',
  })
})

// ===== 认证路由 =====

// 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: '邮箱和密码为必填项' })
    }
    
    // TODO: 检查用户是否已存在（需要数据库）
    // 这里先返回成功
    const token = jwt.sign(
      { userId: `user-${Date.now()}`, email, role: 'USER' },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    return res.status(201).json({
      success: true,
      data: {
        token,
        user: { email, name: name || '匿名用户', role: 'USER', plan: 'FREE', credits: 100 }
      },
      message: '注册成功，赠送100积分！'
    })
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message })
  }
})

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: '邮箱和密码为必填项' })
    }
    
    // TODO: 验证用户（需要数据库）
    // 这里先返回成功（测试用）
    const token = jwt.sign(
      { userId: 'user-test', email, role: 'USER' },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    return res.json({
      success: true,
      data: {
        token,
        user: { email, name: '测试用户', role: 'USER', plan: 'FREE', credits: 100 }
      },
      message: '登录成功'
    })
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message })
  }
})

// ===== 命理分析路由 =====

// 免费八字排盘（无需登录）
app.post('/api/divination/bazi/free', async (req, res) => {
  try {
    const { name, gender, birthDate, birthTime, birthPlace, language } = req.body
    
    if (!birthDate || !gender) {
      return res.status(400).json({ success: false, error: '请提供出生日期和性别' })
    }
    
    // 计算八字
    const [year, month, day] = birthDate.split('-').map(Number)
    const hour = birthTime ? parseInt(birthTime.split(':')[0]) : 12
    const bazi = calcBazi(year, month, day, hour, gender)
    
    // 构造 Prompt（如果没有 OpenAI API Key，返回模拟数据）
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
      // 返回模拟数据（用于测试）
      return res.json({
        success: true,
        data: {
          bazi,
          analysis: `【${name || '命主'}的八字分析报告】

根据您提供的出生信息，您的四柱八字为：${bazi.yearPillar} ${bazi.monthPillar} ${bazi.dayPillar} ${bazi.hourPillar}

日主${bazi.dayMaster}属${bazi.dayMasterElement}，${judgeDayMasterStrength(bazi).description}。

（此为模拟数据，配置 OpenAI API Key 后可生成真实分析）

喜用神：${calcLuckyElements(bazi).luckyElements.join('、')}
忌神：${calcLuckyElements(bazi).weakElements.join('、')}`,
          summary: `日主${bazi.dayMaster}${bazi.dayMasterElement}，${judgeDayMasterStrength(bazi).strength}`,
          luckyElements: calcLuckyElements(bazi).luckyElements,
          weakElements: calcLuckyElements(bazi).weakElements,
          scores: { overall: 75, health: 70, wealth: 75, love: 70, career: 75 },
          suggestions: [
            '配置 OpenAI API Key 以生成详细分析',
            '日主强弱影响整体运势判断',
            '喜用神为有利五行，忌神为不利五行',
          ],
        },
        note: '⚠️ 未配置 OPENAI_API_KEY，当前返回模拟数据。请复制 .env.example 为 .env 并填写真实 API Key。'
      })
    }
    
    // 调用 OpenAI（真实分析）
    const OpenAI = require('openai').default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    
    const baziInfo = formatBaziForPrompt(bazi, gender, name)
    const langInstruction = language === 'en' ? 'English' : '简体中文'
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: `你是资深命理师。请用${langInstruction}输出JSON格式：{analysis: string, summary: string, scores: {overall,health,wealth,love,career}, suggestions: string[]}` },
        { role: 'user', content: `${baziInfo}\n\n请分析。` }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    })
    
    const content = completion.choices[0]?.message?.content || '{}'
    const result = JSON.parse(content)
    
    return res.json({
      success: true,
      data: {
        bazi,
        ...result,
        luckyElements: calcLuckyElements(bazi).luckyElements,
        weakElements: calcLuckyElements(bazi).weakElements,
      }
    })
  } catch (error) {
    console.error('Bazi analysis error:', error)
    return res.status(500).json({ success: false, error: error.message || '分析失败' })
  }
})

// JWT 认证中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ success: false, error: '未提供认证令牌' })
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(403).json({ success: false, error: '令牌无效或已过期' })
  }
}

// 需要登录的分析接口
app.post('/api/divination/analyze', authMiddleware, async (req, res) => {
  // 暂时转发到免费接口（逻辑相同）
  req.url = '/bazi/free'
  app._router.handle(req, res)
})

// ===== 404 =====

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `路径 ${req.method} ${req.originalUrl} 不存在`,
    availableEndpoints: '/api',
  })
})

// ===== 启动 =====

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  玄咪AI NexusMeta 命理解盘API 服务（JS测试版）          ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  环境：${process.env.NODE_ENV || 'development'}                                    ║
║  端口：${PORT}                                                 ║
║  服务地址：http://localhost:${PORT}                       ║
║  API信息：http://localhost:${PORT}/api                    ║
║  健康检查：http://localhost:${PORT}/health                 ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  ⚠️  此为快速测试版（JavaScript）                        ║
║     完整 TypeScript 版开发中                                ║
║                                                            ║
║  下一步：                                               ║
║  1. 复制 .env.example 为 .env                         ║
║  2. 填写 OPENAI_API_KEY                                ║
║  3. 重启服务                                           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `)
})

module.exports = app
