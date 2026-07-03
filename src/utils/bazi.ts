/**
 * 八字排盘计算引擎
 * 
 * 功能：
 * 1. 公历 → 农历转换
 * 2. 计算年柱、月柱、日柱、时柱
 * 3. 计算日主（日干）和五行强弱
 * 4. 计算十神关系
 * 5. 判断喜用神和忌神
 */

import { Solar, Lunar } from 'lunar-javascript'

// ===== 天干地支基础数据 =====

export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 天干五行
export const GAN_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
}

// 地支五行
export const ZHI_WUXING: Record<string, string> = {
  '子': '水', '丑': '土',
  '寅': '木', '卯': '木',
  '辰': '土', '巳': '火',
  '午': '火', '未': '土',
  '申': '金', '酉': '金',
  '戌': '土', '亥': '水',
}

// 地支对应时辰
export const ZHI_SHICHEN: Record<string, string> = {
  '子': '23:00-01:00', '丑': '01:00-03:00',
  '寅': '03:00-05:00', '卯': '05:00-07:00',
  '辰': '07:00-09:00', '巳': '09:00-11:00',
  '午': '11:00-13:00', '未': '13:00-15:00',
  '申': '15:00-17:00', '酉': '17:00-19:00',
  '戌': '19:00-21:00', '亥': '21:00-23:00',
}

// 时辰对应地支
export const SHICHEN_ZHI: Record<string, string> = {
  '23': '子', '0': '子', '1': '丑',
  '2': '丑', '3': '寅', '4': '寅',
  '5': '卯', '6': '卯', '7': '辰',
  '8': '辰', '9': '巳', '10': '巳',
  '11': '午', '12': '午', '13': '未',
  '14': '未', '15': '申', '16': '申',
  '17': '酉', '18': '酉', '19': '戌',
  '20': '戌', '21': '亥', '22': '亥',
}

// 十神对应关系（日主天干 → 其他天干）
// 十神：比肩、劫财、食神、伤官、偏财、正财、七杀、正官、偏印、正印
const SHISHEN_MAP: Record<string, string[]> = {
  '甲': ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'],
  '乙': ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'],
  '丙': ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'],
  '丁': ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'],
  '戊': ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'],
  '己': ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'],
  '庚': ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'],
  '辛': ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'],
  '壬': ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'],
  '癸': ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'],
}

// 天干阴阳（阳=1，阴=0）
const GAN_YINYANG: Record<string, number> = {
  '甲': 1, '乙': 0, '丙': 1, '丁': 0, '戊': 1,
  '己': 0, '庚': 1, '辛': 0, '壬': 1, '癸': 0,
}

// ===== 核心计算函数 =====

/**
 * 计算年柱
 * 以立春为界（约公历2月4日前后）
 */
export function calcYearPillar(year: number, month: number, day: number): string {
  // 简化：以立春（2月4日）为界
  let ganYear = year
  if (month < 2 || (month === 2 && day < 4)) {
    ganYear = year - 1
  }
  
  const ganIndex = (ganYear - 4) % 10
  const zhiIndex = (ganYear - 4) % 12
  
  return TIAN_GAN[(ganIndex + 10) % 10] + DI_ZHI[(zhiIndex + 12) % 12]
}

/**
 * 计算月柱
 * 以节气为分界
 */
export function calcMonthPillar(year: number, month: number): string {
  // 月柱地支：寅月（立春-惊蛰）→ 丑月（小寒-立春）
  // 简化计算：月干 = (年干序号 * 2 + 月支序号) % 10
  const yearGanIndex = (year - 4) % 10
  const monthZhiIndex = (month + 1) % 12 // 简化：1月=丑，2月=寅...
  
  const ganIndex = (yearGanIndex * 2 + monthZhiIndex) % 10
  const adjustedGanIndex = ganIndex < 0 ? ganIndex + 10 : ganIndex
  
  return TIAN_GAN[adjustedGanIndex] + DI_ZHI[monthZhiIndex]
}

/**
 * 计算日柱
 * 使用蔡勒公式变体
 */
export function calcDayPillar(year: number, month: number, day: number): string {
  // 使用lunar-javascript库计算（更准确）
  const solar = Solar.fromYmd(year, month, day)
  const lunar = solar.getLunar()
  
  // 日柱需要通过公式计算
  // 简化：使用已知基准日计算
  const baseDate = new Date(1900, 0, 1) // 1900年1月1日 甲子日
  const targetDate = new Date(year, month - 1, day)
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
  
  const ganIndex = ((diffDays % 10) + 10) % 10
  const zhiIndex = ((diffDays % 12) + 12) % 12
  
  return TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex]
}

/**
 * 计算时柱
 */
export function calcHourPillar(dayGan: string, hour: number): string {
  const dayGanIndex = TIAN_GAN.indexOf(dayGan)
  // 时干 = (日干序号 * 2 + 时支序号) % 10
  const hourZhi = getHourZhi(hour)
  const hourZhiIndex = DI_ZHI.indexOf(hourZhi)
  const hourGanIndex = (dayGanIndex * 2 + hourZhiIndex) % 10
  
  return TIAN_GAN[hourGanIndex] + hourZhi
}

/**
 * 根据小时获取地支
 */
function getHourZhi(hour: number): string {
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

/**
 * 获取某一柱的五行
 */
export function getPillarWuxing(pillar: string): string {
  const gan = pillar[0]
  const zhi = pillar[1]
  // 综合天干五行和地支五行（以天干为主）
  return GAN_WUXING[gan] || ZHI_WUXING[zhi] || '未知'
}

/**
 * 计算四柱完整八字
 */
export interface BaziResult {
  yearPillar: string
  monthPillar: string
  dayPillar: string
  hourPillar: string
  dayMaster: string       // 日主（日干）
  dayMasterElement: string // 日主五行
  pillars: string[]       // 四柱数组
  allGans: string[]      // 所有天干
  allZhis: string[]      // 所有地支
  wuxingCount: Record<string, number>  // 五行统计
  shishen: string[]      // 十神关系
}

export function calcBazi(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender: 'MALE' | 'FEMALE' | 'OTHER'
): BaziResult {
  // 使用 lunar-javascript 精确计算
  const solar = Solar.fromYmd(year, month, day)
  const lunar = solar.getLunar()
  
  // 获取精确的八字
  const yearPillar = lunar.getYearInGanZhi()
  const monthPillar = lunar.getMonthInGanZhi()
  const dayPillar = lunar.getDayInGanZhi()
  const dayGan = dayPillar[0]
  const hourPillar = calcHourPillar(dayGan, hour)
  
  const dayMaster = dayGan
  const dayMasterElement = GAN_WUXING[dayMaster]
  
  const allGans = [
    yearPillar[0], monthPillar[0], dayPillar[0], hourPillar[0]
  ]
  const allZhis = [
    yearPillar[1], monthPillar[1], dayPillar[1], hourPillar[1]
  ]
  
  // 统计五行数量
  const wuxingCount: Record<string, number> = {
    '木': 0, '火': 0, '土': 0, '金': 0, '水': 0
  }
  
  allGans.forEach(gan => {
    const wx = GAN_WUXING[gan]
    if (wx) wuxingCount[wx] = (wuxingCount[wx] || 0) + 1
  })
  allZhis.forEach(zhi => {
    const wx = ZHI_WUXING[zhi]
    if (wx) wuxingCount[wx] = (wuxingCount[wx] || 0) + 1
  })
  
  // 计算十神
  const shishen = allGans.map(gan => {
    return calcShishen(dayMaster, gan)
  })
  
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
    shishen,
  }
}

/**
 * 计算十神关系
 */
export function calcShishen(dayMaster: string, otherGan: string): string {
  const dmIndex = TIAN_GAN.indexOf(dayMaster)
  const ogIndex = TIAN_GAN.indexOf(otherGan)
  
  // 判断阴阳异同
  const dmYy = GAN_YINYANG[dayMaster]
  const ogYy = GAN_YINYANG[otherGan]
  
  // 五行关系
  const dmWx = GAN_WUXING[dayMaster]
  const ogWx = GAN_WUXING[otherGan]
  
  // 同我（日主与其他干五行相同）
  if (dmWx === ogWx) {
    return dmYy === ogYy ? '比肩' : '劫财'
  }
  
  // 我生（日主五行生其他干五行）
  const shengMap: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  if (shengMap[dmWx] === ogWx) {
    return dmYy === ogYy ? '食神' : '伤官'
  }
  
  // 我克（日主五行克其他干五行）
  const keMap: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' }
  if (keMap[dmWx] === ogWx) {
    return dmYy === ogYy ? '偏财' : '正财'
  }
  
  // 克我
  const beKeMap: Record<string, string> = { '木': '金', '火': '水', '土': '木', '金': '火', '水': '土' }
  if (beKeMap[dmWx] === ogWx) {
    return dmYy === ogYy ? '七杀' : '正官'
  }
  
  // 生我
  const beShengMap: Record<string, string> = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' }
  if (beShengMap[dmWx] === ogWx) {
    return dmYy === ogYy ? '偏印' : '正印'
  }
  
  return '未知'
}

/**
 * 判断日主强弱
 */
export function judgeDayMasterStrength(bazi: BaziResult): {
  strength: '强' | '偏弱' | '中和' | '偏强' | '弱'
  description: string
} {
  const { dayMasterElement, wuxingCount, allZhis } = bazi
  
  // 统计生扶日主的力量
  const shengWo = {
    '木': (wuxingCount['水'] || 0) + (wuxingCount['木'] || 0),
    '火': (wuxingCount['木'] || 0) + (wuxingCount['火'] || 0),
    '土': (wuxingCount['火'] || 0) + (wuxingCount['土'] || 0),
    '金': (wuxingCount['土'] || 0) + (wuxingCount['金'] || 0),
    '水': (wuxingCount['金'] || 0) + (wuxingCount['水'] || 0),
  }
  
  const keWo = {
    '木': (wuxingCount['金'] || 0) + (wuxingCount['土'] || 0), // 金克木，木克土（耗）
    '火': (wuxingCount['水'] || 0) + (wuxingCount['金'] || 0),
    '土': (wuxingCount['木'] || 0) + (wuxingCount['水'] || 0),
    '金': (wuxingCount['火'] || 0) + (wuxingCount['木'] || 0),
    '水': (wuxingCount['土'] || 0) + (wuxingCount['火'] || 0),
  }
  
  const support = (shengWo as Record<string, number>)[dayMasterElement] || 0
  const oppose = (keWo as Record<string, number>)[dayMasterElement] || 0
  const ratio = support / Math.max(oppose, 1)
  
  if (ratio >= 2.5) return { strength: '强', description: '日主得令得势，身强有力，喜克泄耗' }
  if (ratio >= 1.5) return { strength: '偏强', description: '日主偏旺，需适当克制或泄秀' }
  if (ratio >= 0.8) return { strength: '中和', description: '日主中和，五行相对平衡，吉凶看组合' }
  if (ratio >= 0.5) return { strength: '偏弱', description: '日主偏弱，需生扶帮身' }
  return { strength: '弱', description: '日主衰弱，急需生扶，忌克泄耗' }
}

/**
 * 计算喜用神和忌神
 */
export function calcLuckyElements(bazi: BaziResult): {
  luckyElements: string[]   // 喜用神（对日主有益的五行）
  weakElements: string[]    // 忌神（对日主有害的五行）
  description: string
} {
  const { dayMasterElement, wuxingCount } = bazi
  const strength = judgeDayMasterStrength(bazi)
  
  const shengMap: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const keMap: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' }
  const beShengMap: Record<string, string> = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' }
  
  let luckyElements: string[] = []
  let weakElements: string[] = []
  
  if (strength.strength === '强' || strength.strength === '偏强') {
    // 身强：喜克（官杀）、泄（食伤）、耗（财星）
    luckyElements = [
      keMap[dayMasterElement],      // 官杀（克我）
      shengMap[dayMasterElement],   // 食伤（我生）
      keMap[beShengMap[dayMasterElement]], // 财星（我克）
    ]
    weakElements = [
      dayMasterElement,             // 比劫（同我）
      beShengMap[dayMasterElement], // 印星（生我）
    ]
  } else {
    // 身弱：喜生（印星）、扶（比劫）
    luckyElements = [
      beShengMap[dayMasterElement], // 印星（生我）
      dayMasterElement,              // 比劫（同我）
    ]
    weakElements = [
      keMap[dayMasterElement],      // 官杀（克我）
      shengMap[dayMasterElement],   // 食伤（我生）
      keMap[beShengMap[dayMasterElement]], // 财星（我克）
    ]
  }
  
  // 去重
  luckyElements = [...new Set(luckyElements)]
  weakElements = [...new Set(weakElements)]
  
  const desc = `日主${dayMasterElement}，${strength.description}。喜用神为${luckyElements.join('、')}，忌神为${weakElements.join('、')}。`
  
  return { luckyElements, weakElements, description: desc }
}

/**
 * 格式化八字结果用于 AI Prompt
 */
export function formatBaziForPrompt(bazi: BaziResult, gender: 'MALE' | 'FEMALE' | 'OTHER', name?: string): string {
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
