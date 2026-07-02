/**
 * 内容管理 Controller
 */
import { Request, Response, NextFunction } from 'express'
import { contentService } from '../services/content.service'
import { success } from '../utils/response'
import { logService } from '../services/log.service'

function log(opts: { req: Request; action: string; detail: string }) {
  return logService.create({
    userId: (opts.req as any).user?.userId,
    userName: (opts.req as any).user?.name,
    action: opts.action,
    module: '内容管理',
    detail: opts.detail,
    ip: opts.req.ip || undefined,
  }).catch(() => {})
}

export class ContentController {
  // ===== FAQ =====
  async listFaqs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await contentService.listFaqs(req.query.lang as string)
      res.json(success(data))
    } catch (err) { next(err) }
  }

  async createFaq(req: Request, res: Response, next: NextFunction) {
    try {
      const faq = await contentService.createFaq(req.body)
      log({ req, action: '新增', detail: `新增FAQ: ${faq.question.slice(0, 30)}` })
      res.status(201).json(success(faq, 'FAQ创建成功'))
    } catch (err) { next(err) }
  }

  async updateFaq(req: Request, res: Response, next: NextFunction) {
    try {
      const faq = await contentService.updateFaq(Number(req.params.id), req.body)
      log({ req, action: '编辑', detail: `编辑FAQ #${req.params.id}` })
      res.json(success(faq, 'FAQ更新成功'))
    } catch (err) { next(err) }
  }

  async deleteFaq(req: Request, res: Response, next: NextFunction) {
    try {
      await contentService.deleteFaq(Number(req.params.id))
      log({ req, action: '删除', detail: `删除FAQ #${req.params.id}` })
      res.json(success(null, 'FAQ已删除'))
    } catch (err) { next(err) }
  }

  // ===== 客户评价 =====
  async listReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await contentService.listReviews(req.query.lang as string)
      res.json(success(data))
    } catch (err) { next(err) }
  }

  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await contentService.createReview(req.body)
      log({ req, action: '新增', detail: `新增评价: ${review.name}` })
      res.status(201).json(success(review, '评价创建成功'))
    } catch (err) { next(err) }
  }

  async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await contentService.updateReview(Number(req.params.id), req.body)
      log({ req, action: '编辑', detail: `编辑评价 #${req.params.id}` })
      res.json(success(review, '评价更新成功'))
    } catch (err) { next(err) }
  }

  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      await contentService.deleteReview(Number(req.params.id))
      log({ req, action: '删除', detail: `删除评价 #${req.params.id}` })
      res.json(success(null, '评价已删除'))
    } catch (err) { next(err) }
  }

  // ===== Logo =====
  async listLogos(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await contentService.listLogos()
      res.json(success(data))
    } catch (err) { next(err) }
  }

  async createLogo(req: Request, res: Response, next: NextFunction) {
    try {
      const logo = await contentService.createLogo(req.body)
      log({ req, action: '新增', detail: `新增合作方: ${logo.name}` })
      res.status(201).json(success(logo, '合作方添加成功'))
    } catch (err) { next(err) }
  }

  async deleteLogo(req: Request, res: Response, next: NextFunction) {
    try {
      await contentService.deleteLogo(Number(req.params.id))
      log({ req, action: '删除', detail: `删除合作方 #${req.params.id}` })
      res.json(success(null, '合作方已删除'))
    } catch (err) { next(err) }
  }
}

export const contentController = new ContentController()
