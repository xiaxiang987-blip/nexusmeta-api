/**
 * 个人中心 Service
 */
import { prisma } from '../config/database'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import type { ProfileData, UpdateProfileInput, ChangePasswordInput } from '../types'
import { AppError } from '../utils/errors'

const roleLabelMap: Record<string, string> = {
  SUPER_ADMIN: '超级管理员',
  ADMIN: '管理员',
  USER: '普通用户',
}

export class ProfileService {
  async getProfile(userId: string): Promise<ProfileData> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new AppError('用户不存在', 404)

    const managedUsers = await prisma.user.count({ where: { role: 'USER' } })

    return {
      name: user.name || '',
      email: user.email,
      bio: user.bio || '',
      role: roleLabelMap[user.role] || user.role,
      joinedAt: user.createdAt.toISOString().slice(0, 10),
      location: user.location || '未知',
      managedUsers,
      avatar: user.avatar || (user.name ? user.name.charAt(0) : 'U'),
    }
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined && { name: input.name, avatar: input.name.charAt(0) }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.bio !== undefined && { bio: input.bio }),
      },
    })
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new AppError('用户不存在', 404)

    const valid = await bcrypt.compare(input.currentPassword, user.password)
    if (!valid) throw new AppError('当前密码不正确', 400)

    const newPassword = await bcrypt.hash(input.newPassword, 10)
    return prisma.user.update({ where: { id: userId }, data: { password: newPassword } })
  }

  async resetApiKey(userId: string) {
    const apiKey = `nxm_${crypto.randomBytes(24).toString('hex')}`
    await prisma.user.update({ where: { id: userId }, data: { apiKey } })
    return { apiKey }
  }

  async clearCache() {
    // 预留缓存清理逻辑
    return { success: true, message: '缓存已清除' }
  }
}

export const profileService = new ProfileService()
