/**
 * 内容管理 Service
 */
import { prisma } from '../config/database'
import type { CreateFaqInput, CreateReviewInput, CreateLogoInput } from '../types'

export class ContentService {
  // ===== FAQ =====
  async listFaqs(lang?: string): Promise<any[]> {
    return prisma.faq.findMany({
      where: lang ? { lang } : undefined,
      orderBy: { order: 'asc' },
    })
  }

  async createFaq(input: CreateFaqInput) {
    return prisma.faq.create({ data: input })
  }

  async updateFaq(id: number, input: Partial<CreateFaqInput>) {
    return prisma.faq.update({ where: { id }, data: input })
  }

  async deleteFaq(id: number) {
    return prisma.faq.delete({ where: { id } })
  }

  // ===== 客户评价 =====
  async listReviews(lang?: string): Promise<any[]> {
    return prisma.review.findMany({
      where: lang ? { lang } : undefined,
      orderBy: { createdAt: 'desc' },
    })
  }

  async createReview(input: CreateReviewInput) {
    return prisma.review.create({ data: { ...input, avatar: input.name.charAt(0) } })
  }

  async updateReview(id: number, input: Partial<CreateReviewInput>) {
    return prisma.review.update({ where: { id }, data: input })
  }

  async deleteReview(id: number) {
    return prisma.review.delete({ where: { id } })
  }

  // ===== 合作方 Logo =====
  async listLogos() {
    return prisma.partnerLogo.findMany({ orderBy: { order: 'asc' } })
  }

  async createLogo(input: CreateLogoInput) {
    return prisma.partnerLogo.create({ data: input })
  }

  async deleteLogo(id: number) {
    return prisma.partnerLogo.delete({ where: { id } })
  }
}

export const contentService = new ContentService()
