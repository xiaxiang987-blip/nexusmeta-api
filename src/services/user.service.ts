/**
 * 用户管理 Service
 */
import { prisma } from '../config/database'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import type { CreateUserInput, UpdateUserInput, UpdateUserStatusInput, UserItem } from '../types'

const planMap: Record<string, string> = {
  FREE: '免费版',
  STARTER: '入门版',
  PROFESSIONAL: '专业版',
  ENTERPRISE: '企业版',
}

const statusMap: Record<string, 'active' | 'inactive' | 'banned'> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BANNED: 'banned',
}

export class UserService {
  async list(params: {
    search?: string
    page: number
    limit: number
    status?: string
    plan?: string
  }): Promise<{ data: UserItem[]; total: number; page: number; limit: number }> {
    const where: any = { role: 'USER' }

    if (params.status) where.status = params.status
    if (params.plan) where.plan = params.plan
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { email: { contains: params.search } },
        { region: { contains: params.search } },
      ]
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return {
      data: users.map((u: { id: string; name: string | null; email: string; region: string | null; plan: string; status: string; createdAt: Date; avatar: string | null; credits: number }) => ({
        id: u.id,
        name: u.name || '',
        email: u.email,
        region: u.region || '未知',
        plan: planMap[u.plan] || u.plan,
        status: statusMap[u.status],
        regDate: u.createdAt.toISOString().slice(0, 10),
        avatar: u.avatar || (u.name ? u.name.charAt(0) : 'U'),
        credits: u.credits,
      })),
      total,
      page: params.page,
      limit: params.limit,
    }
  }

  async getById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  }

  async create(input: CreateUserInput) {
    const password = await bcrypt.hash(input.password, 10)
    return prisma.user.create({
      data: {
        email: input.email,
        password,
        name: input.name,
        avatar: input.name.charAt(0),
        region: input.region || '未知',
        plan: (input.plan as any) || 'FREE',
        status: 'ACTIVE',
        role: 'USER',
        credits: 100,
        apiKey: `nxm_${crypto.randomBytes(16).toString('hex')}`,
      },
    })
  }

  async update(id: string, input: UpdateUserInput) {
    return prisma.user.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name, avatar: input.name.charAt(0) }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.region !== undefined && { region: input.region }),
        ...(input.plan !== undefined && { plan: input.plan as any }),
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.location !== undefined && { location: input.location }),
      },
    })
  }

  async delete(id: string) {
    return prisma.user.delete({ where: { id } })
  }

  async updateStatus(id: string, input: UpdateUserStatusInput) {
    return prisma.user.update({ where: { id }, data: { status: input.status } })
  }
}

export const userService = new UserService()
