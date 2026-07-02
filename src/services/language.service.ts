/**
 * 多语言管理 Service
 */
import { prisma } from '../config/database'
import type { TranslationItem, TranslationsResponse } from '../types'

export class LanguageService {
  async getAllTranslations(): Promise<TranslationsResponse> {
    const entries = await prisma.translationEntry.findMany({
      orderBy: [{ section: 'asc' }, { key: 'asc' }],
    })

    const sections: string[] = [...new Set(entries.map((e: { section: string }) => e.section))] as string[]

    return {
      sections,
      translations: entries.map((e: { key: string; zh: string; en: string; tw: string; section: string }) => ({
        key: e.key,
        zh: e.zh,
        en: e.en,
        tw: e.tw,
        section: e.section,
      })),
    }
  }

  async batchUpdate(translations: TranslationItem[]) {
    const ops = translations.map((t) =>
      prisma.translationEntry.upsert({
        where: { key: t.key },
        update: {
          zh: t.zh,
          en: t.en,
          tw: t.tw,
          section: t.section,
        },
        create: {
          key: t.key,
          zh: t.zh,
          en: t.en,
          tw: t.tw,
          section: t.section,
        },
      })
    )

    await prisma.$transaction(ops)
  }
}

export const languageService = new LanguageService()
