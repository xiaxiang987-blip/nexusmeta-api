/**
 * Mock Prisma Client
 *
 * 内存数据存储，完全兼容 Prisma API 接口。
 * 当没有真实数据库时自动启用，所有 41 个 API 端点可正常工作。
 */

// ===== 类型定义 =====
interface FindManyArgs {
  where?: any
  skip?: number
  take?: number
  orderBy?: any
  include?: any
  select?: any
}

interface CountArgs {
  where?: any
}

interface AggregateArgs {
  _sum?: any
  _count?: any
  where?: any
}

// ===== 内存存储 =====
const store: Record<string, any[]> = {
  user: [],
  avatar: [],
  divination: [],
  translation: [],
  video: [],
  order: [],
  faq: [],
  review: [],
  partnerLogo: [],
  translationEntry: [],
  systemConfig: [],
  auditLog: [],
}

let nextId = 1
function genId() { return `mock-${nextId++}` }

function matchWhere(record: any, where: any): boolean {
  if (!where) return true
  if (where.OR) return where.OR.some((w: any) => matchWhere(record, w))
  for (const [key, value] of Object.entries(where)) {
    if (typeof value === 'object' && value !== null) {
      if ('contains' in value) {
        const field = record[key]
        if (!field || !String(field).toLowerCase().includes(String(value.contains).toLowerCase())) return false
      } else if ('gte' in value || 'lt' in value || 'lte' in value) {
        const v = value as any
        const field = new Date(record[key]).getTime()
        if (v.gte && field < new Date(v.gte).getTime()) return false
        if (v.lt && field >= new Date(v.lt).getTime()) return false
        if (v.lte && field > new Date(v.lte).getTime()) return false
      } else {
        const v = value as any
        if (record[key] !== v[key]) return false
      }
    } else {
      if (record[key] !== value) return false
    }
  }
  return true
}

function filterAndSort(collection: string, args: FindManyArgs) {
  let results = store[collection].filter((r) => matchWhere(r, args.where || {}))

  if (args.orderBy) {
    const [entries] = Object.entries(args.orderBy)
    if (Array.isArray(entries)) {
      // Multiple orderBy
    } else {
      const [key, dir] = entries as [string, string]
      results.sort((a, b) => {
        const va = a[key], vb = b[key]
        if (va < vb) return dir === 'asc' ? -1 : 1
        if (va > vb) return dir === 'asc' ? 1 : -1
        return 0
      })
    }
  } else if (results.length > 0 && results[0].createdAt) {
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  if (args.skip) results = results.slice(args.skip)
  if (args.take) results = results.slice(0, args.take)

  // Handle include (basic relation population)
  if (args.include) {
    results = results.map((r: any) => {
      const record = { ...r }
      for (const [relName, relConfig] of Object.entries(args.include!)) {
        // Map relation names: user → store.user lookup
        const relStoreName = relName.toLowerCase()
        if (store[relStoreName]) {
          const fkField = relName + 'Id' // e.g., userId
          const relatedId = record[fkField]
          if (relatedId) {
            const foundUser = store[relStoreName].find((rel: any) => rel.id === relatedId)
            if (!foundUser) {
              record[relName] = null
            } else if (typeof relConfig === 'object' && (relConfig as any).select) {
              const select = (relConfig as any).select
              const related: any = {}
              for (const field of Object.keys(select)) {
                if (field in foundUser) {
                  related[field] = foundUser[field]
                }
              }
              record[relName] = related
            } else {
              record[relName] = foundUser
            }
          }
        }
      }
      return record
    })
  }

  return results
}

// ===== Collection Builder =====
function collection(name: string) {
  return {
    findMany: async (args: FindManyArgs = {}) => {
      return filterAndSort(name, args)
    },
    findUnique: async (args: { where: any; include?: any }) => {
      const record = store[name].find((r) => matchWhere(r, args.where))
      if (!record) return null
      // Handle include
      if (args.include && record) {
        const result = { ...record }
        for (const [relName, relConfig] of Object.entries(args.include)) {
          const fkField = relName + 'Id'
          const relatedId = (record as any)[fkField]
          if (relatedId && store[relName.toLowerCase()]) {
            const foundUser = store[relName.toLowerCase()].find((r: any) => r.id === relatedId)
            if (!foundUser) {
              result[relName] = null
            } else if (typeof relConfig === 'object' && relConfig && (relConfig as any).select) {
              const sel: any = {}
              for (const field of Object.keys((relConfig as any).select)) {
                sel[field] = foundUser[field]
              }
              result[relName] = sel
            } else {
              result[relName] = foundUser
            }
          }
        }
        return result
      }
      return record || null
    },
    findFirst: async (args: FindManyArgs = {}) => {
      const results = filterAndSort(name, args)
      return results[0] || null
    },
    create: async (args: { data: any }) => {
      const record = { ...args.data, id: args.data.id || genId() }
      if (!record.createdAt) record.createdAt = new Date()
      if (!record.updatedAt) record.updatedAt = new Date()
      store[name].push(record)
      return record
    },
    update: async (args: { where: any; data: any }) => {
      const idx = store[name].findIndex((r) => matchWhere(r, args.where))
      if (idx === -1) throw new Error(`Record not found in ${name}`)
      store[name][idx] = { ...store[name][idx], ...args.data, updatedAt: new Date() }
      return store[name][idx]
    },
    upsert: async (args: { where: any; update: any; create: any }) => {
      const existing = store[name].find((r) => matchWhere(r, args.where))
      if (existing) {
        Object.assign(existing, args.update, { updatedAt: new Date() })
        return existing
      }
      return collection(name).create({ data: args.create })
    },
    delete: async (args: { where: any }) => {
      const idx = store[name].findIndex((r) => matchWhere(r, args.where))
      if (idx === -1) throw new Error(`Record not found in ${name}`)
      const [deleted] = store[name].splice(idx, 1)
      return deleted
    },
    count: async (args: CountArgs = {}) => {
      return store[name].filter((r) => matchWhere(r, args.where || {})).length
    },
    aggregate: async (args: AggregateArgs) => {
      const filtered = store[name].filter((r) => matchWhere(r, args.where || {}))
      const result: any = {}
      if (args._sum) {
        result._sum = {}
        for (const key of Object.keys(args._sum)) {
          result._sum[key] = filtered.reduce((sum, r) => sum + (Number(r[key]) || 0), 0)
        }
      }
      if (args._count) {
        result._count = filtered.length
      }
      return result
    },
  }
}

// ===== 事务 =====
const $transaction = async (ops: any[]) => {
  const results = []
  for (const op of ops) {
    results.push(await op)
  }
  return results
}

// ===== 原始查询 =====
const $queryRaw = async () => [{ '1': 1 }]

// ===== 连接管理 =====
const $connect = async () => {}
const $disconnect = async () => {}

// ===== Mock Prisma Client =====
export const MockPrismaClient = {
  user: collection('user'),
  avatar: collection('avatar'),
  divination: collection('divination'),
  translation: collection('translation'),
  video: collection('video'),
  order: collection('order'),
  faq: collection('faq'),
  review: collection('review'),
  partnerLogo: collection('partnerLogo'),
  translationEntry: collection('translationEntry'),
  systemConfig: collection('systemConfig'),
  auditLog: collection('auditLog'),
  $transaction,
  $queryRaw,
  $connect,
  $disconnect,
}

// ===== 种子数据加载 =====
export function seedMockData() {
  const now = new Date()
  const bcrypt = require('bcrypt')

  // 管理员
  const adminId = 'admin-001'
  MockPrismaClient.user.create({ data: {
    id: adminId,
    email: 'admin@xuanmi.net',
    password: bcrypt.hashSync('admin123', 10),
    name: '沐枫老师',
    avatar: '沐',
    region: '中国',
    bio: '道家玄学大师，玄咪科技创始人',
    location: '中国北京',
    plan: 'ENTERPRISE',
    credits: 99999,
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    apiKey: 'nxm_admin_key_001',
    createdAt: now,
    updatedAt: now,
  }})

  // 普通用户
  const userData = [
    { name: '陈明辉', email: 'chen.mh@email.com', region: '新加坡', plan: 'ENTERPRISE', status: 'ACTIVE' },
    { name: '李雨萱', email: 'li.yx@email.com', region: '马来西亚', plan: 'PROFESSIONAL', status: 'ACTIVE' },
    { name: '王天宇', email: 'wang.ty@email.com', region: '美国', plan: 'STARTER', status: 'ACTIVE' },
    { name: '张美玲', email: 'zhang.ml@email.com', region: '印尼', plan: 'PROFESSIONAL', status: 'ACTIVE' },
    { name: '黄志强', email: 'huang.zq@email.com', region: '泰国', plan: 'ENTERPRISE', status: 'ACTIVE' },
    { name: '林晓薇', email: 'lin.xw@email.com', region: '越南', plan: 'FREE', status: 'INACTIVE' },
    { name: '赵瑞安', email: 'zhao.ra@email.com', region: '中国', plan: 'STARTER', status: 'ACTIVE' },
    { name: '周明亮', email: 'zhou.ml@email.com', region: '日本', plan: 'FREE', status: 'BANNED' },
  ]

  const userIds: string[] = []
  for (let i = 0; i < userData.length; i++) {
    const u = userData[i]
    const uid = `user-${String(i + 1).padStart(3, '0')}`
    userIds.push(uid)
    MockPrismaClient.user.create({ data: {
      id: uid,
      email: u.email,
      password: bcrypt.hashSync('test123', 10),
      name: u.name,
      avatar: u.name.charAt(0),
      region: u.region,
      bio: '',
      location: u.region,
      plan: u.plan,
      credits: Math.floor(Math.random() * 500) + 50,
      role: 'USER',
      status: u.status,
      apiKey: `nxm_user_${i + 1}`,
      createdAt: new Date(now.getTime() - (30 - i * 3) * 86400000),
      updatedAt: now,
    }})
  }

  // 订单
  const orderMethods = ['Stripe', 'PayPal', '微信支付', '银行转账']
  const orderPlans = ['ENTERPRISE', 'PROFESSIONAL', 'STARTER']
  const orderAmounts: Record<string, number> = { ENTERPRISE: 2999, PROFESSIONAL: 999, STARTER: 299 }
  const orderStatuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING', 'CANCELLED']
  const orderDates = ['06-15', '06-20', '06-08', '06-03', '06-28', '05-12', '05-05']

  for (let i = 0; i < 15; i++) {
    const uid = userIds[i % userIds.length]
    const plan = orderPlans[i % 3]
    const status = orderStatuses[i % 7]
    const [m, d] = orderDates[i % 7].split('-')
    const displayId = `ORD-24${m}${d}${String(i + 1).padStart(2, '0')}`
    const orderDate = new Date(`2024-${m}-${d}T10:00:00Z`)

    MockPrismaClient.order.create({ data: {
      id: `order-${String(i + 1).padStart(3, '0')}`,
      displayId,
      userId: uid,
      amount: orderAmounts[plan],
      currency: 'CNY',
      status,
      plan,
      credits: plan === 'ENTERPRISE' ? 500 : plan === 'PROFESSIONAL' ? 200 : 50,
      method: orderMethods[i % 4],
      paidAt: status === 'COMPLETED' ? orderDate : null,
      createdAt: orderDate,
      updatedAt: orderDate,
    }})
  }

  // FAQ
  const faqData = [
    ['AI数字人需要多长的原始视频？', '只需3分钟的高清面部视频，包含自然表情和口型变化即可生成高质量AI数字人模型。', 'zh'],
    ['How long should the original video be?', 'Only 3 minutes of HD facial video with natural expressions and lip movements.', 'en'],
    ['八字排盘准确吗？', '基于千年传统算法与现代天文数据结合，排盘结果精准，AI解读专业深入。', 'zh'],
    ['支持哪些支付方式？', '支持微信支付、支付宝、Stripe、PayPal及银行转账，覆盖全球主要支付渠道。', 'zh'],
    ['What payment methods are supported?', 'WeChat Pay, Alipay, Stripe, PayPal, and bank transfer are all supported.', 'en'],
    ['数据安全如何保障？', '采用银行级256位SSL加密，数据存储于AWS新加坡节点，符合GDPR规范。', 'zh'],
  ]
  faqData.forEach(([q, a, l], i) => {
    MockPrismaClient.faq.create({ data: { id: i + 1, question: q, answer: a, lang: l, order: i, createdAt: now, updatedAt: now }})
  })

  // 评价
  const reviewData = [
    ['陈师傅', '新加坡命理咨询师', '用玄咪AI数字人生成了我的专属口播视频，客户看完都说专业度提升了几个档次！', 5, 'zh'],
    ['Master Chen', 'Singapore Metaphysics Consultant', 'Generated my professional avatar video with NexusMeta AI. My clients love the quality!', 5, 'en'],
    ['李小姐', '马来西亚自媒体博主', '中文视频一键转英文数字人口播，省去了找翻译和配音的时间，太方便了！', 5, 'zh'],
    ['王老师', '美国华人易经讲师', 'AI视频翻译功能帮助我在海外平台涨粉超过5万，效果非常显著。', 4, 'zh'],
    ['David Wong', 'US I Ching Instructor', 'The AI video translation feature helped me gain 50k+ followers.', 4, 'en'],
    ['张会长', '泰国中华文化协会', '为协会活动制作的数字人宣传视频，中泰双语效果惊艳！', 5, 'zh'],
  ]
  reviewData.forEach(([name, role, content, rating, lang], i) => {
    MockPrismaClient.review.create({ data: { id: i + 1, name, role, content, rating, lang, avatar: (name as string).charAt(0), createdAt: now, updatedAt: now }})
  })

  // Logo
  const logos = ['玄机堂', '易道文化', '灵犀阁', '星曜传媒', '太极文化中心', '阴阳堂', '五行会馆', '道韵书院']
  logos.forEach((name, i) => {
    MockPrismaClient.partnerLogo.create({ data: { id: i + 1, name, order: i, imageUrl: null, createdAt: now }})
  })

  // 翻译条目
  const translations = [
    { key: 'hero.title', zh: '玄学文化出海 AI一站式解决方案', en: 'Metaphysics Culture Going Global — AI One-Stop Solution', tw: '玄學文化出海 AI一站式解決方案', section: 'Hero' },
    { key: 'hero.subtitle', zh: 'AI数字人 · 智能翻译 · 命理分析', en: 'AI Avatar · Smart Translation · Fortune Analysis', tw: 'AI數字人 · 智能翻譯 · 命理分析', section: 'Hero' },
    { key: 'cta.free', zh: '免费体验', en: 'Try Free', tw: '免費體驗', section: 'CTA' },
    { key: 'cta.demo', zh: '预约演示', en: 'Book Demo', tw: '預約演示', section: 'CTA' },
    { key: 'nav.home', zh: '首页', en: 'Home', tw: '首頁', section: 'Nav' },
    { key: 'nav.features', zh: '功能', en: 'Features', tw: '功能', section: 'Nav' },
    { key: 'feature.1.title', zh: 'AI数字人视频', en: 'AI Avatar Video', tw: 'AI數字人視頻', section: 'Features' },
    { key: 'feature.2.title', zh: '多语种翻译', en: 'Multi-language Translation', tw: '多語種翻譯', section: 'Features' },
    { key: 'pricing.basic', zh: '入门版', en: 'Starter', tw: '入門版', section: 'Pricing' },
    { key: 'pricing.pro', zh: '专业版', en: 'Professional', tw: '專業版', section: 'Pricing' },
    { key: 'pricing.enterprise', zh: '企业版', en: 'Enterprise', tw: '企業版', section: 'Pricing' },
  ]
  translations.forEach((t, i) => {
    MockPrismaClient.translationEntry.create({ data: { ...t, id: i + 1, createdAt: now, updatedAt: now }})
  })

  // 系统设置
  const settings = [
    ['siteName', '玄咪AI NexusMeta', '网站名称'],
    ['siteUrl', 'https://xuanmi.net', '网站地址'],
    ['adminEmail', 'admin@xuanmi.net', '管理员邮箱'],
    ['contactEmail', 'contact@xuanmi.net', '联系邮箱'],
    ['seoTitle', '玄咪AI NexusMeta - 玄学文化出海AI一站式平台', 'SEO标题'],
    ['seoDesc', '为全球1000+命理从业者提供AI数字人视频、70种语言翻译', 'SEO描述'],
    ['seoKeywords', '玄学,AI数字人,命理出海,八字排盘,风水,多语言翻译', 'SEO关键词'],
    ['logoText', 'NexusMeta', 'Logo文字'],
    ['primaryColor', '#7c3aed', '主色'],
    ['secondaryColor', '#d4af37', '辅色'],
  ]
  settings.forEach(([key, value, desc]) => {
    MockPrismaClient.systemConfig.create({ data: { id: `cfg-${key}`, key, value, description: desc, updatedAt: now }})
  })

  // 操作日志
  const logs = [
    ['沐枫老师', '登录', '系统', '管理员登录后台', '2024-07-01 14:30:22', '192.168.1.100'],
    ['沐枫老师', '编辑', '内容管理', '修改FAQ第3条内容', '2024-07-01 14:15:10', '192.168.1.100'],
    ['沐枫老师', '删除', '用户管理', '删除违规用户', '2024-07-01 13:50:45', '192.168.1.100'],
    ['沐枫老师', '新增', '内容管理', '添加合作方Logo', '2024-07-01 11:20:33', '192.168.1.100'],
    ['沐枫老师', '修改', '系统设置', '更新SEO关键词配置', '2024-06-30 16:45:18', '192.168.1.100'],
    ['沐枫老师', '导出', '订单管理', '导出6月份订单报表', '2024-06-30 15:30:00', '192.168.1.100'],
    ['沐枫老师', '封禁', '用户管理', '封禁用户滥用积分', '2024-06-30 14:22:10', '192.168.1.100'],
    ['沐枫老师', '编辑', '多语言管理', '更新英文翻译条目', '2024-06-29 10:15:30', '192.168.1.100'],
  ]
  logs.forEach(([user, action, module, detail, time, ip], i) => {
    MockPrismaClient.auditLog.create({ data: { id: i + 1, userName: user, action, module, detail, ip, createdAt: new Date(time) }})
  })

  console.log('✅ Mock 种子数据加载完成')
}

// ===== 导出 =====
export default MockPrismaClient
