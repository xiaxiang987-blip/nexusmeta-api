/**
 * 系统设置 Service
 */
import { prisma } from '../config/database'
import type { SiteConfig } from '../types'

const DEFAULT_CONFIG: SiteConfig = {
  siteName: '玄咪AI NexusMeta',
  siteUrl: 'https://xuanmi.net',
  adminEmail: 'admin@xuanmi.net',
  contactEmail: 'contact@xuanmi.net',
  seoTitle: '玄咪AI NexusMeta - 玄学文化出海AI一站式平台',
  seoDesc: '',
  seoKeywords: '',
  logoText: 'NexusMeta',
  primaryColor: '#7c3aed',
  secondaryColor: '#d4af37',
}

export class SettingsService {
  async getSettings(): Promise<SiteConfig> {
    const rows = await prisma.systemConfig.findMany()
    const map = new Map(rows.map((r: { key: string; value: string }) => [r.key, r.value]))
    const config: any = { ...DEFAULT_CONFIG }
    for (const key of Object.keys(DEFAULT_CONFIG)) {
      if (map.has(key)) {
        config[key] = map.get(key)
      }
    }
    return config as SiteConfig
  }

  async updateSettings(input: Partial<SiteConfig>) {
    const ops = Object.entries(input)
      .filter(([_, v]) => v !== undefined)
      .map(([key, value]) =>
        prisma.systemConfig.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value), description: `${key} 配置` },
        })
      )

    await prisma.$transaction(ops)
    return this.getSettings()
  }
}

export const settingsService = new SettingsService()
