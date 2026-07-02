/**
 * 认证控制器
 * 
 * 处理用户注册、登录、信息获取、密码修改
 */

import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import { success, created } from '../utils/response'
import { AppError, ConflictError, AuthError, NotFoundError } from '../utils/errors'
import { generateToken } from '../middleware/auth'

// ---- 内存 Mock 用户存储（数据库就绪后替换为 Prisma） ----

interface UserRecord {
  id: string
  email: string
  password: string
  name: string | null
  plan: string
  credits: number
  role: string
  createdAt: string
}

const users: UserRecord[] = [
  {
    id: 'admin-001',
    email: 'admin@xuanmi.net',
    password: bcrypt.hashSync('admin123', 10),
    name: '沐枫老师',
    plan: 'ENTERPRISE',
    credits: 999999,
    role: 'SUPER_ADMIN',
    createdAt: new Date().toISOString(),
  },
]

const SALT_ROUNDS = 10

// ===== 控制器方法 =====

export const authController = {
  /** POST /api/auth/register — 用户注册 */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body

      // 检查邮箱是否已注册
      const existing = users.find(u => u.email === email)
      if (existing) {
        throw new ConflictError('该邮箱已被注册')
      }

      // 创建用户
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
      const newUser: UserRecord = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        email,
        password: hashedPassword,
        name: name || null,
        plan: 'FREE',
        credits: 100,
        role: 'USER',
        createdAt: new Date().toISOString(),
      }
      users.push(newUser)

      // 生成 Token
      const token = generateToken(newUser.id, newUser.email, newUser.role)

      res.status(201).json(created({
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          plan: newUser.plan,
          credits: newUser.credits,
          role: newUser.role,
        },
        token,
      }, '注册成功'))
    } catch (err) {
      next(err)
    }
  },

  /** POST /api/auth/login — 用户登录 */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body

      // 查找用户
      const user = users.find(u => u.email === email)
      if (!user) {
        throw new AuthError('邮箱或密码错误')
      }

      // 验证密码
      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        throw new AuthError('邮箱或密码错误')
      }

      // 生成 Token
      const token = generateToken(user.id, user.email, user.role)

      res.json(success({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          credits: user.credits,
          role: user.role,
        },
        token,
      }, '登录成功'))
    } catch (err) {
      next(err)
    }
  },

  /** GET /api/auth/profile — 获取用户信息 */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as any).user

      const user = users.find(u => u.id === userId)
      if (!user) {
        throw new NotFoundError('用户不存在')
      }

      res.json(success({
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        credits: user.credits,
        role: user.role,
        createdAt: user.createdAt,
      }))
    } catch (err) {
      next(err)
    }
  },

  /** POST /api/auth/admin/login — 管理员快捷登录 */
  async adminLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body

      // 硬编码管理员登录
      if (email !== 'admin@xuanmi.net' || password !== 'admin123') {
        throw new AuthError('管理员账号或密码错误')
      }

      const admin = users.find(u => u.email === 'admin@xuanmi.net')!
      const token = generateToken(admin.id, admin.email, admin.role)

      res.json(success({
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          plan: admin.plan,
          credits: admin.credits,
          role: admin.role,
        },
        token,
      }, '管理员登录成功'))
    } catch (err) {
      next(err)
    }
  },

  /** PUT /api/auth/profile — 更新用户信息 */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = (req as any).user
      const { name, avatar, phone } = req.body

      const user = users.find(u => u.id === userId)
      if (!user) {
        throw new NotFoundError('用户不存在')
      }

      if (name !== undefined) user.name = name
      // avatar 和 phone 暂存（实际应存入数据库）

      res.json(success({
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        credits: user.credits,
        role: user.role,
      }, '信息更新成功'))
    } catch (err) {
      next(err)
    }
  },
}
