/**
 * OpenAI 命理分析服务
 * 
 * 功能：
 * 1. 八字排盘分析
 * 2. 紫微斗数分析
 * 3. 风水分析
 * 4. 合婚/合盘分析
 * 5. 流年/流月运势分析
 * 
 * 多语言支持：简中、繁中、英语、马来语、印尼语等70种语言
 */

import OpenAI from 'openai'
import { BaziResult, formatBaziForPrompt, calcBazi, judgeDayMasterStrength, calcLuckyElements } from '../utils/bazi'

export interface DivinationRequest {
  type: 'BAZI' | 'ZIWEI' | 'FENGSHUI' | 'COMPATIBILITY' | 'YEARLY_FORTUNE' | 'MONTHLY_FORTUNE'
  name?: string
  gender: 'MALE' | 'FEMALE'
  birthDate: string  // YYYY-MM-DD
  birthTime?: string  // HH:MM or 时辰名称
  birthPlace?: string
  // 合盘用
  partnerName?: string
  partnerGender?: 'MALE' | 'FEMALE'
  partnerBirthDate?: string
  partnerBirthTime?: string
  // 流年用
  targetYear?: number
  targetMonth?: number
  // 查询语言
  language?: string  // 'zh' | 'en' | 'ms' | 'id' | 'yue' | 'th' | 'vi' | 'ja' | 'ko' ...
}

export interface DivinationResponse {
  success: boolean
  data?: {
    bazi?: BaziResult
    analysis: string
    summary: string
    luckyElements: string[]
    weakElements: string[]
    scores: {
      overall: number
      health: number
      wealth: number
      love: number
      career: number
    }
    suggestions: string[]
    // 流年流月
    fortuneTimeline?: Array<{
      period: string
      fortune: string
      score: number
      highlights: string[]
    }>
  }
  error?: string
}

// 支持的语言列表及对应 OpenAI 输出语言指令
const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  'zh': '简体中文',
  'zh-TW': '繁体中文（台湾香港习惯用语）',
  'en': 'English',
  'ms': 'Bahasa Melayu (Malay)',
  'id': 'Bahasa Indonesia (Indonesian)',
  'yue': '粤语（广东话，用繁体字输出）',
  'th': 'ไทย (Thai)',
  'vi': 'Tiếng Việt (Vietnamese)',
  'ja': '日本語 (Japanese)',
  'ko': '한국어 (Korean)',
  'ta': 'தமிழ் (Tamil)',
  'hi': 'हिन्दी (Hindi)',
  'ar': 'العربية (Arabic)',
  'es': 'Español (Spanish)',
  'fr': 'Français (French)',
  'de': 'Deutsch (German)',
  'pt': 'Português (Portuguese)',
  'ru': 'Русский (Russian)',
  'it': 'Italiano (Italian)',
  'tr': 'Türkçe (Turkish)',
  'pl': 'Polski (Polish)',
  'nl': 'Nederlands (Dutch)',
  'sv': 'Svenska (Swedish)',
  'da': 'Dansk (Danish)',
  'no': 'Norsk (Norwegian)',
  'fi': 'Suomi (Finnish)',
  'el': 'Ελληνικά (Greek)',
  'he': 'עברית (Hebrew)',
  'fa': 'فارسی (Persian)',
  'ur': 'اردو (Urdu)',
  'bn': 'বাংলা (Bengali)',
  'pa': 'ਪੰਜਾਬੀ (Punjabi)',
  'te': 'తెలుగు (Telugu)',
  'mr': 'मराठी (Marathi)',
  'gu': 'ગુજરાતી (Gujarati)',
  'ta-LK': 'සිංහල (Sinhala)',
  'my': 'မြန်မာ (Burmese)',
  'km': 'ខ្មែរ (Khmer)',
  'lo': 'ລາວ (Lao)',
  'ka': 'ქართული (Georgian)',
  'hy': 'հայերեն (Armenian)',
  'az': 'Azərbaycan (Azerbaijani)',
  'uz': 'Oʻzbek (Uzbek)',
  'kk': 'Қазақ (Kazakh)',
  'ky': 'Кыргыз (Kyrgyz)',
  'mn': 'Монгол (Mongolian)',
  'ne': 'नेपाली (Nepali)',
  'si': 'සිංහල (Sinhala)',
  'am': 'አማርኛ (Amharic)',
  'sw': 'Kiswahili (Swahili)',
  'yo': 'Yorùbá (Yoruba)',
  'ig': 'Igbo (Igbo)',
  'zu': 'isiZulu (Zulu)',
  'af': 'Afrikaans (Afrikaans)',
  'eu': 'Euskara (Basque)',
  'ca': 'Català (Catalan)',
  'gl': 'Galego (Galician)',
  'cy': 'Cymraeg (Welsh)',
  'ga': 'Gaeilge (Irish)',
  'is': 'Íslenska (Icelandic)',
  'mt': 'Malti (Maltese)',
  'sq': 'Shqip (Albanian)',
  'mk': 'Македонски (Macedonian)',
  'bg': 'Български (Bulgarian)',
  'hr': 'Hrvatski (Croatian)',
  'cs': 'Čeština (Czech)',
  'sk': 'Slovenčina (Slovak)',
  'sl': 'Slovenščina (Slovenian)',
  'et': 'Eesti (Estonian)',
  'lv': 'Latviešu (Latvian)',
  'lt': 'Lietuvių (Lithuanian)',
  'ro': 'Română (Romanian)',
  'hu': 'Magyar (Hungarian)',
}

// 命理分析系统 Prompt 模板
const SYSTEM_PROMPT_BAZI = (language: string) => `你是一位精通中国传统命理学的资深命理师，通晓八字（四柱预测学）、紫微斗数、风水学等玄学体系。

你需要用专业而通俗的语言，结合传统命理学理论和现代人生指导，为用户提供有价值的命理分析。

## 分析要求
1. 基于用户提供的八字信息，进行全面深入的命理分析
2. 分析包含：性格特质、事业运势、财运分析、感情婚姻、健康状况、流年运势
3. 给出具体可行的建议，而非空泛的预测
4. 保持客观理性，强调"命由天定，运由己造"的理念
5. 对敏感话题（健康、人生重大抉择）给出提醒，建议咨询专业人士

## 输出格式（JSON）
请以JSON格式输出，包含以下字段：
- analysis: 完整分析（2000字以上，分段落，用\\n分隔）
- summary: 一句话摘要（50字以内）
- scores: 各维度评分（0-100的整数）
  - overall: 综合运势
  - health: 健康
  - wealth: 财运
  - love: 感情
  - career: 事业
- suggestions: 建议列表（数组，每条50字以内）
- luckyElements: 喜用神数组
- weakElements: 忌神数组

## 语言要求
请用${LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS['en']}输出所有内容。`

// 创建 OpenAI 客户端
let openaiClient: OpenAI | null = null

export function initOpenAI(apiKey: string, baseURL?: string): OpenAI {
  openaiClient = new OpenAI({
    apiKey,
    baseURL: baseURL || undefined,
  })
  return openaiClient
}

export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Call initOpenAI() first.')
  }
  return openaiClient
}

/**
 * 八字排盘分析
 */
// 默认模型（由外层 initOpenAI 配置决定，这里作为 fallback）
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'deepseek-chat'

export async function analyzeBazi(
  req: DivinationRequest,
  model: string = DEFAULT_MODEL
): Promise<DivinationResponse> {
  try {
    // 1. 计算八字
    const [year, month, day] = req.birthDate.split('-').map(Number)
    const hour = req.birthTime ? parseInt(req.birthTime.split(':')[0]) : 12
    const bazi = calcBazi(year, month, day, hour, req.gender)
    const strength = judgeDayMasterStrength(bazi)
    const elements = calcLuckyElements(bazi)
    
    // 2. 构造 Prompt
    const baziInfo = formatBaziForPrompt(bazi, req.gender, req.name)
    const language = req.language || 'zh'
    const langInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS['en']
    
    const userPrompt = `
${baziInfo}

## 额外信息
- 出生地点：${req.birthPlace || '未知'}
- 用户希望了解：整体命运走势、事业发展方向、财运状况、感情婚姻、健康注意事项

请给出全面专业的八字分析报告。
`.trim()
    
    // 3. 调用 OpenAI
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_BAZI(language) },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })
    
    const content = completion.choices[0]?.message?.content || '{}'
    const result = JSON.parse(content)
    
    return {
      success: true,
      data: {
        bazi,
        analysis: result.analysis || '分析生成失败',
        summary: result.summary || '',
        luckyElements: result.luckyElements || elements.luckyElements,
        weakElements: result.weakElements || elements.weakElements,
        scores: result.scores || {
          overall: 75,
          health: 70,
          wealth: 75,
          love: 70,
          career: 75,
        },
        suggestions: result.suggestions || [],
      },
    }
  } catch (error: any) {
    console.error('Bazi analysis error:', error)
    return {
      success: false,
      error: error.message || '命理分析失败，请稍后重试',
    }
  }
}

/**
 * 紫微斗数分析
 */
export async function analyzeZiwei(
  req: DivinationRequest,
  model: string = DEFAULT_MODEL
): Promise<DivinationResponse> {
  // 紫微斗数需要计算命宫、身宫、十二宫
  // 这里先用 GPT-4o 模拟（真实紫微需要复杂的排盘计算）
  const language = req.language || 'zh'
  
  try {
    const prompt = `
## 用户信息
- 姓名：${req.name || '匿名'}
- 性别：${req.gender === 'MALE' ? '男' : '女'}
- 公历生日：${req.birthDate}
- 出生时辰：${req.birthTime || '未知'}
- 出生地点：${req.birthPlace || '未知'}

请作为紫微斗数命理师，分析用户的命盘。
需要包含：命宫主星、身宫、十二宫位分析、大运流年分析。

请用${LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS['en']}输出，格式同八字分析（JSON）。
`.trim()
    
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_BAZI(language) },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })
    
    const content = completion.choices[0]?.message?.content || '{}'
    const result = JSON.parse(content)
    
    return {
      success: true,
      data: {
        analysis: result.analysis || '分析生成失败',
        summary: result.summary || '',
        luckyElements: result.luckyElements || [],
        weakElements: result.weakElements || [],
        scores: result.scores || {
          overall: 75,
          health: 70,
          wealth: 75,
          love: 70,
          career: 75,
        },
        suggestions: result.suggestions || [],
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * 风水分析
 */
export async function analyzeFengshui(
  description: string,
  analysisType: 'home' | 'office' | 'burial' | 'layout',
  language: string = 'zh',
  model: string = DEFAULT_MODEL
): Promise<DivinationResponse> {
  try {
    const prompt = `
## 风水分析请求
- 分析类型：${analysisType === 'home' ? '家居风水' : analysisType === 'office' ? '办公风水' : analysisType === 'burial' ? '阴宅风水' : '户型布局'}
- 用户描述：${description}

请从玄空飞星、八宅风水、峦头派等角度分析，给出具体改善建议。

请用${LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS['en']}输出，JSON格式。
`.trim()
    
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: '你是资深风水师，精通玄空飞星、八宅风水、峦头派等风水学派。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    })
    
    const content = completion.choices[0]?.message?.content || '{}'
    const result = JSON.parse(content)
    
    return {
      success: true,
      data: {
        analysis: result.analysis || '风水分析生成失败',
        summary: result.summary || '',
        luckyElements: result.luckyElements || [],
        weakElements: result.weakElements || [],
        scores: result.scores || {
          overall: 70,
          health: 70,
          wealth: 70,
          love: 70,
          career: 70,
        },
        suggestions: result.suggestions || [],
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * 合婚/合盘分析
 */
export async function analyzeCompatibility(
  person1: DivinationRequest,
  person2: DivinationRequest,
  language: string = 'zh',
  model: string = DEFAULT_MODEL
): Promise<DivinationResponse> {
  try {
    const [y1, m1, d1] = person1.birthDate.split('-').map(Number)
    const h1 = person1.birthTime ? parseInt(person1.birthTime.split(':')[0]) : 12
    const bazi1 = calcBazi(y1, m1, d1, h1, person1.gender)
    
    const [y2, m2, d2] = person2.birthDate!.split('-').map(Number)
    const h2 = person2.birthTime ? parseInt(person2.birthTime.split(':')[0]) : 12
    const bazi2 = calcBazi(y2, m2, d2, h2, person2.gender)
    
    const prompt = `
## 合婚分析
### 命主1（${person1.name || '匿名'}）
${formatBaziForPrompt(bazi1, person1.gender, person1.name)}

### 命主2（${person2.name || '匿名'}）
${formatBaziForPrompt(bazi2, person2.gender, person2.name)}

请从八字合婚角度，分析两人的：
1. 天干地支相合/相冲情况
2. 五行互补情况
3. 性格契合度
4. 感情运势匹配
5. 婚姻建议

请用${LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS['en']}输出。
`.trim()
    
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_BAZI(language) },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3500,
      response_format: { type: 'json_object' },
    })
    
    const content = completion.choices[0]?.message?.content || '{}'
    const result = JSON.parse(content)
    
    return {
      success: true,
      data: {
        analysis: result.analysis || '合盘分析生成失败',
        summary: result.summary || '',
        luckyElements: result.luckyElements || [],
        weakElements: result.weakElements || [],
        scores: result.scores || {
          overall: 75,
          health: 70,
          wealth: 75,
          love: 70,
          career: 75,
        },
        suggestions: result.suggestions || [],
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * 流年/流月运势分析
 */
export async function analyzeYearlyFortune(
  req: DivinationRequest,
  targetYear: number,
  targetMonth?: number,
  language: string = 'zh',
  model: string = DEFAULT_MODEL
): Promise<DivinationResponse> {
  try {
    const [year, month, day] = req.birthDate.split('-').map(Number)
    const hour = req.birthTime ? parseInt(req.birthTime.split(':')[0]) : 12
    const bazi = calcBazi(year, month, day, hour, req.gender)
    
    const prompt = `
## 流年运势分析
### 命主八字
${formatBaziForPrompt(bazi, req.gender, req.name)}

### 分析目标
- 目标年份：${targetYear}年
${targetMonth ? `- 目标月份：${targetMonth}月` : ''}

请分析该${targetMonth ? '月' : '年'}的：
1. 整体运势走向
2. 各方面运势（事业、财运、感情、健康）
3. 需要注意的月份/时段
4. 开运建议

请用${LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS['en']}输出。
`.trim()
    
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_BAZI(language) },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3500,
      response_format: { type: 'json_object' },
    })
    
    const content = completion.choices[0]?.message?.content || '{}'
    const result = JSON.parse(content)
    
    return {
      success: true,
      data: {
        analysis: result.analysis || '流年分析生成失败',
        summary: result.summary || '',
        luckyElements: result.luckyElements || [],
        weakElements: result.weakElements || [],
        scores: result.scores || {
          overall: 75,
          health: 70,
          wealth: 75,
          love: 70,
          career: 75,
        },
        suggestions: result.suggestions || [],
        fortuneTimeline: result.fortuneTimeline || [],
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * 通用命理分析入口
 */
export async function analyzeDivination(
  req: DivinationRequest
): Promise<DivinationResponse> {
  switch (req.type) {
    case 'BAZI':
      return analyzeBazi(req)
    case 'ZIWEI':
      return analyzeZiwei(req)
    case 'FENGSHUI':
      return analyzeFengshui(req.birthPlace || '', 'home', req.language)
    case 'COMPATIBILITY':
      if (!req.partnerBirthDate) {
        return { success: false, error: '合盘分析需要提供双方出生信息' }
      }
      return analyzeCompatibility(req, {
        type: 'COMPATIBILITY',
        name: req.partnerName,
        gender: req.partnerGender!,
        birthDate: req.partnerBirthDate,
        birthTime: req.partnerBirthTime,
      }, req.language)
    case 'YEARLY_FORTUNE':
      return analyzeYearlyFortune(req, req.targetYear || new Date().getFullYear())
    case 'MONTHLY_FORTUNE':
      return analyzeYearlyFortune(req, req.targetYear || new Date().getFullYear(), req.targetMonth)
    default:
      return { success: false, error: '不支持的分析类型' }
  }
}
