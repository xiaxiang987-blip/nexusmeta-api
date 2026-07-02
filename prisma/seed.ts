/**
 * 种子数据脚本
 *
 * 填充所有模块的演示数据，用于开发和测试
 * 运行: npx ts-node prisma/seed.ts
 */

import { PrismaClient, PlanType, UserStatus, UserRole, OrderStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始填充种子数据...\n')

  // ===== 1. 管理员 =====
  const adminPwd = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@xuanmi.net' },
    update: {},
    create: {
      email: 'admin@xuanmi.net',
      password: adminPwd,
      name: '沐枫老师',
      avatar: '沐',
      region: '中国',
      bio: '道家玄学大师，玄咪科技创始人，专注AI+玄学出海赛道10+年',
      location: '中国北京',
      plan: 'ENTERPRISE',
      credits: 99999,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  })
  console.log('✅ 管理员:', admin.email)

  // ===== 2. 普通用户 =====
  const userPwd = await bcrypt.hash('test123', 10)
  const regions = ['新加坡', '马来西亚', '美国', '印尼', '泰国', '越南', '日本', '韩国']
  const plans: PlanType[] = ['ENTERPRISE', 'PROFESSIONAL', 'STARTER', 'FREE']
  const userStatuses: UserStatus[] = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE', 'BANNED']

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

  const users: Array<{ id: string; name: string; email: string; region: string }> = []
  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: userPwd,
        name: u.name,
        avatar: u.name.charAt(0),
        region: u.region,
        plan: u.plan as PlanType,
        status: u.status as UserStatus,
        credits: Math.floor(Math.random() * 500) + 50,
        location: u.region,
        role: 'USER',
        apiKey: `nxm_${crypto.randomBytes(16).toString('hex')}`,
      },
    })
    users.push({ id: user.id, name: user.name!, email: user.email, region: user.region! })
  }
  console.log(`✅ 普通用户: ${users.length} 个`)

  // ===== 3. 订单 =====
  const orderMethods = ['Stripe', 'PayPal', '微信支付', '银行转账']
  const orderPlans: PlanType[] = ['ENTERPRISE', 'PROFESSIONAL', 'STARTER']
  const orderAmounts: Record<string, number> = { ENTERPRISE: 2999, PROFESSIONAL: 999, STARTER: 299 }
  const orderStatuses: OrderStatus[] = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING', 'CANCELLED']

  const monthDays = [15, 20, 8, 3, 28, 12, 5]
  const months = ['06', '06', '06', '06', '05', '05', '05']

  let orderCount = 0
  for (let i = 0; i < 15; i++) {
    const user = users[i % users.length]
    const plan = orderPlans[i % 3]
    const status = orderStatuses[i % 7]
    const month = months[i % 7]
    const day = monthDays[i % 7]
    const displayId = `ORD-24${month}${String(day).padStart(2, '0')}${String(i + 1).padStart(2, '0')}`

    await prisma.order.upsert({
      where: { displayId },
      update: {},
      create: {
        displayId,
        userId: user.id,
        amount: orderAmounts[plan],
        currency: 'CNY',
        status,
        plan,
        credits: plan === 'ENTERPRISE' ? 500 : plan === 'PROFESSIONAL' ? 200 : 50,
        method: orderMethods[i % 4],
        paidAt: status === 'COMPLETED' ? new Date(`2024-${month}-${day}T10:00:00Z`) : null,
        createdAt: new Date(`2024-${month}-${day}T10:00:00Z`),
      },
    })
    orderCount++
  }
  console.log(`✅ 订单: ${orderCount} 条`)

  // ===== 4. FAQ =====
  const faqData = [
    { q: 'AI数字人需要多长的原始视频？', a: '只需3分钟的高清面部视频，包含自然表情和口型变化即可生成高质量AI数字人模型。', lang: 'zh' },
    { q: 'How long should the original video be?', a: 'Only 3 minutes of HD facial video with natural expressions and lip movements.', lang: 'en' },
    { q: '八字排盘准确吗？', a: '基于千年传统算法与现代天文数据结合，排盘结果精准，AI解读专业深入。', lang: 'zh' },
    { q: '支持哪些支付方式？', a: '支持微信支付、支付宝、Stripe、PayPal及银行转账，覆盖全球主要支付渠道。', lang: 'zh' },
    { q: 'What payment methods are supported?', a: 'WeChat Pay, Alipay, Stripe, PayPal, and bank transfer are all supported.', lang: 'en' },
    { q: '数据安全如何保障？', a: '采用银行级256位SSL加密，数据存储于AWS新加坡节点，符合GDPR规范。', lang: 'zh' },
    { q: 'How is data security guaranteed?', a: 'Bank-grade 256-bit SSL encryption, AWS Singapore hosting, GDPR compliant.', lang: 'en' },
    { q: '可以批量生成视频吗？', a: '企业版支持批量流水线处理，可同时生成多达50个数字人视频。', lang: 'zh' },
  ]

  let faqCount = 0
  for (const f of faqData) {
    await prisma.faq.create({ data: { question: f.q, answer: f.a, lang: f.lang, order: faqCount } })
    faqCount++
  }
  console.log(`✅ FAQ: ${faqCount} 条`)

  // ===== 5. 客户评价 =====
  const reviewData = [
    { name: '陈师傅', role: '新加坡命理咨询师', content: '用玄咪AI数字人生成了我的专属口播视频，客户看完都说专业度提升了几个档次！', rating: 5, lang: 'zh' },
    { name: 'Master Chen', role: 'Singapore Metaphysics Consultant', content: 'Generated my professional avatar video with NexusMeta AI. My clients love the quality!', rating: 5, lang: 'en' },
    { name: '李小姐', role: '马来西亚自媒体博主', content: '中文视频一键转英文数字人口播，省去了找翻译和配音的时间，太方便了！', rating: 5, lang: 'zh' },
    { name: '王老师', role: '美国华人易经讲师', content: 'AI视频翻译功能帮助我在海外平台涨粉超过5万，效果非常显著。', rating: 4, lang: 'zh' },
    { name: 'David Wong', role: 'US I Ching Instructor', content: 'The AI video translation feature helped me gain 50k+ followers on overseas platforms.', rating: 4, lang: 'en' },
    { name: '张会长', role: '泰国中华文化协会', content: '为协会活动制作的数字人宣传视频，中泰双语效果惊艳！', rating: 5, lang: 'zh' },
  ]

  let reviewCount = 0
  for (const r of reviewData) {
    await prisma.review.create({ data: { ...r, avatar: r.name.charAt(0) } })
    reviewCount++
  }
  console.log(`✅ 客户评价: ${reviewCount} 条`)

  // ===== 6. 合作方 Logo =====
  const logos = ['玄机堂', '易道文化', '灵犀阁', '星曜传媒', '太极文化中心', '阴阳堂', '五行会馆', '道韵书院']
  let logoCount = 0
  for (const name of logos) {
    await prisma.partnerLogo.create({ data: { name, order: logoCount } })
    logoCount++
  }
  console.log(`✅ 合作方 Logo: ${logoCount} 个`)

  // ===== 7. 翻译条目 =====
  const translationData = [
    { key: 'hero.title', zh: '玄学文化出海 AI一站式解决方案', en: 'Metaphysics Culture Going Global — AI One-Stop Solution', tw: '玄學文化出海 AI一站式解決方案', section: 'Hero' },
    { key: 'hero.subtitle', zh: 'AI数字人 · 智能翻译 · 命理分析', en: 'AI Avatar · Smart Translation · Fortune Analysis', tw: 'AI數字人 · 智能翻譯 · 命理分析', section: 'Hero' },
    { key: 'cta.free', zh: '免费体验', en: 'Try Free', tw: '免費體驗', section: 'CTA' },
    { key: 'cta.demo', zh: '预约演示', en: 'Book Demo', tw: '預約演示', section: 'CTA' },
    { key: 'nav.home', zh: '首页', en: 'Home', tw: '首頁', section: 'Nav' },
    { key: 'nav.features', zh: '功能', en: 'Features', tw: '功能', section: 'Nav' },
    { key: 'nav.pricing', zh: '定价', en: 'Pricing', tw: '定價', section: 'Nav' },
    { key: 'nav.contact', zh: '联系我们', en: 'Contact', tw: '聯繫我們', section: 'Nav' },
    { key: 'feature.1.title', zh: 'AI数字人视频', en: 'AI Avatar Video', tw: 'AI數字人視頻', section: 'Features' },
    { key: 'feature.2.title', zh: '多语种翻译', en: 'Multi-language Translation', tw: '多語種翻譯', section: 'Features' },
    { key: 'feature.3.title', zh: '命理分析', en: 'Fortune Analysis', tw: '命理分析', section: 'Features' },
    { key: 'feature.4.title', zh: '口型同步', en: 'Lip Sync', tw: '口型同步', section: 'Features' },
    { key: 'pricing.basic', zh: '入门版', en: 'Starter', tw: '入門版', section: 'Pricing' },
    { key: 'pricing.pro', zh: '专业版', en: 'Professional', tw: '專業版', section: 'Pricing' },
    { key: 'pricing.enterprise', zh: '企业版', en: 'Enterprise', tw: '企業版', section: 'Pricing' },
  ]

  let transCount = 0
  for (const t of translationData) {
    await prisma.translationEntry.upsert({
      where: { key: t.key },
      update: { zh: t.zh, en: t.en, tw: t.tw, section: t.section },
      create: t,
    })
    transCount++
  }
  console.log(`✅ 翻译条目: ${transCount} 条`)

  // ===== 8. 系统配置 =====
  const settings = [
    { key: 'siteName', value: '玄咪AI NexusMeta', description: '网站名称' },
    { key: 'siteUrl', value: 'https://xuanmi.net', description: '网站地址' },
    { key: 'adminEmail', value: 'admin@xuanmi.net', description: '管理员邮箱' },
    { key: 'contactEmail', value: 'contact@xuanmi.net', description: '联系邮箱' },
    { key: 'seoTitle', value: '玄咪AI NexusMeta - 玄学文化出海AI一站式平台', description: 'SEO标题' },
    { key: 'seoDesc', value: '为全球1000+命理从业者提供AI数字人视频、70种语言翻译、命理解盘等一站式出海解决方案', description: 'SEO描述' },
    { key: 'seoKeywords', value: '玄学,AI数字人,命理出海,八字排盘,风水,多语言翻译,文化出海', description: 'SEO关键词' },
    { key: 'logoText', value: 'NexusMeta', description: 'Logo文字' },
    { key: 'primaryColor', value: '#7c3aed', description: '主色' },
    { key: 'secondaryColor', value: '#d4af37', description: '辅色' },
  ]

  for (const s of settings) {
    await prisma.systemConfig.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    })
  }
  console.log(`✅ 系统配置: ${settings.length} 项`)

  // ===== 9. 操作日志 =====
  const logs = [
    { user: '沐枫老师', action: '登录', module: '系统', detail: '管理员登录后台', time: '2024-07-01 14:30:22', ip: '192.168.1.100' },
    { user: '沐枫老师', action: '编辑', module: '内容管理', detail: '修改FAQ第3条内容', time: '2024-07-01 14:15:10', ip: '192.168.1.100' },
    { user: '沐枫老师', action: '删除', module: '用户管理', detail: '删除违规用户 zhou.ml@email.com', time: '2024-07-01 13:50:45', ip: '192.168.1.100' },
    { user: '沐枫老师', action: '新增', module: '内容管理', detail: '添加合作方Logo"五行会馆"', time: '2024-07-01 11:20:33', ip: '192.168.1.100' },
    { user: '沐枫老师', action: '修改', module: '系统设置', detail: '更新SEO关键词配置', time: '2024-06-30 16:45:18', ip: '192.168.1.100' },
    { user: '沐枫老师', action: '导出', module: '订单管理', detail: '导出6月份订单报表', time: '2024-06-30 15:30:00', ip: '192.168.1.100' },
    { user: '沐枫老师', action: '封禁', module: '用户管理', detail: '封禁用户 zhou.ml@email.com 滥用积分', time: '2024-06-30 14:22:10', ip: '192.168.1.100' },
    { user: '沐枫老师', action: '编辑', module: '多语言管理', detail: '更新英文翻译条目 hero.title', time: '2024-06-29 10:15:30', ip: '192.168.1.100' },
  ]

  let logCount = 0
  for (const l of logs) {
    await prisma.auditLog.create({
      data: {
        userName: l.user,
        action: l.action,
        module: l.module,
        detail: l.detail,
        ip: l.ip,
        createdAt: new Date(l.time + ':00'),
      },
    })
    logCount++
  }
  console.log(`✅ 操作日志: ${logCount} 条`)

  console.log('\n🎉 种子数据填充完成！')
  console.log('  管理员: admin@xuanmi.net / admin123')
  console.log('  用户: chen.mh@email.com / test123')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据填充失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
