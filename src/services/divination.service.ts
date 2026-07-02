/**
 * 命理记录数据服务（内存 Mock → 替换为 Prisma）
 */

interface DivinationRecord {
  id: string
  userId: string
  type: string
  request: any
  result: any
  createdAt: string
}

const store: DivinationRecord[] = []

export const divinationService = {
  async create(
    userId: string,
    type: string,
    request: any,
    result: any
  ): Promise<DivinationRecord> {
    // TODO: prisma.divination.create({ data: { ... } })
    const record: DivinationRecord = {
      id: `div-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      userId,
      type,
      request,
      result,
      createdAt: new Date().toISOString(),
    }
    store.push(record)
    return record
  },

  async getHistory(
    userId: string,
    page: number,
    limit: number,
    type?: string
  ): Promise<{ items: DivinationRecord[]; total: number }> {
    // TODO: prisma.divination.findMany({ where: { userId, ...(type && { type }) }, skip, take, orderBy })
    let filtered = store.filter(r => r.userId === userId)
    if (type) filtered = filtered.filter(r => r.type === type)

    const total = filtered.length
    const start = (page - 1) * limit
    const items = filtered.slice(start, start + limit)

    return { items, total }
  },

  async getById(id: string, userId: string): Promise<DivinationRecord | null> {
    // TODO: prisma.divination.findFirst({ where: { id, userId } })
    return store.find(r => r.id === id && r.userId === userId) || null
  },
}
