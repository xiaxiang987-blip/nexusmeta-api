/**
 * 全量 API 测试脚本
 * 运行：node dist/test-api.js
 */
const https = require('http')

const BASE = 'http://localhost:3002/api'
let adminToken = ''
let userToken = ''

function request(method, path, body = null, token = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) })
        } catch {
          resolve({ status: res.statusCode, body: data })
        }
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function run() {
  let passed = 0
  let failed = 0

  const test = async (name, fn) => {
    try {
      await fn()
      console.log(`  ✅ ${name}`)
      passed++
    } catch (err) {
      console.log(`  ❌ ${name}: ${err.message}`)
      failed++
    }
  }

  console.log('\n=========================================')
  console.log('  玄咪AI NexusMeta API 全量测试')
  console.log('=========================================\n')

  // ===== 1. 认证 =====
  console.log('📦 1. 认证模块 (Auth)')

  await test('管理员登录', async () => {
    const res = await request('POST', '/auth/admin/login', {
      email: 'admin@xuanmi.net',
      password: 'admin123',
    })
    if (!res.body.success) throw new Error(res.body.error || '登录失败')
    adminToken = res.body.data.token
    if (!adminToken) throw new Error('未返回 Token')
  })

  await test('管理员获取个人信息', async () => {
    const res = await request('GET', '/auth/profile', null, adminToken)
    if (!res.body.success || res.body.data.role !== 'SUPER_ADMIN') throw new Error('角色不正确')
  })

  await test('用户注册', async () => {
    const res = await request('POST', '/auth/register', {
      email: 'test-api@xuanmi.net',
      password: 'test123',
      name: 'API测试用户',
    })
    if (!res.body.success) throw new Error(res.body.error || '注册失败')
  })

  await test('用户登录', async () => {
    const res = await request('POST', '/auth/login', {
      email: 'test-api@xuanmi.net',
      password: 'test123',
    })
    if (!res.body.success) throw new Error(res.body.error || '登录失败')
    userToken = res.body.data.token
  })

  await test('登录验证失败', async () => {
    const res = await request('POST', '/auth/login', {
      email: 'test-api@xuanmi.net',
      password: 'wrong',
    })
    if (res.body.success) throw new Error('应该返回错误')
  })

  // ===== 2. 仪表盘 =====
  console.log('\n📦 2. 仪表盘模块 (Dashboard)')

  await test('获取统计指标', async () => {
    const res = await request('GET', '/dashboard/stats', null, adminToken)
    if (!res.body.success) throw new Error(res.body.error)
    const d = res.body.data
    if (!d.totalUsers || !d.monthlyOrders || !d.monthlyRevenue) throw new Error('统计数据不完整')
  })

  await test('获取营收趋势', async () => {
    const res = await request('GET', '/dashboard/revenue-trend', null, adminToken)
    if (!res.body.success || !Array.isArray(res.body.data)) throw new Error('数据格式错误')
  })

  await test('获取地区分布', async () => {
    const res = await request('GET', '/dashboard/user-regions', null, adminToken)
    if (!res.body.success) throw new Error(res.body.error)
  })

  await test('获取最近订单', async () => {
    const res = await request('GET', '/dashboard/recent-orders', null, adminToken)
    if (!res.body.success) throw new Error(res.body.error)
  })

  // ===== 3. 用户管理 =====
  console.log('\n📦 3. 用户管理模块 (Users)')

  await test('获取用户列表', async () => {
    const res = await request('GET', '/users?page=1&limit=10', null, adminToken)
    if (!res.body.success || !res.body.data) throw new Error('列表为空')
  })

  await test('搜索用户', async () => {
    const res = await request('GET', '/users?search=陈', null, adminToken)
    if (!res.body.success) throw new Error('搜索失败')
  })

  await test('按状态筛选', async () => {
    const res = await request('GET', '/users?status=BANNED', null, adminToken)
    if (!res.body.success) throw new Error('筛选失败')
  })

  let testUserId = 'user-001'
  await test('获取用户详情', async () => {
    const res = await request('GET', `/users/${testUserId}`, null, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '未找到用户')
  })

  await test('创建用户', async () => {
    const res = await request('POST', '/users', {
      name: '测试用户',
      email: 'created-test@xuanmi.net',
      password: 'test123',
      region: '测试地区',
    }, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '创建失败')
  })

  await test('更新用户', async () => {
    const res = await request('PUT', `/users/${testUserId}`, { region: '新加坡测试' }, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '更新失败')
  })

  await test('修改用户状态', async () => {
    const res = await request('PATCH', `/users/${testUserId}/status`, { status: 'BANNED' }, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '状态修改失败')
    // 恢复状态
    await request('PATCH', `/users/${testUserId}/status`, { status: 'ACTIVE' }, adminToken)
  })

  await test('验证非管理员拒绝', async () => {
    const res = await request('GET', '/users', null, userToken)
    if (res.body.success) throw new Error('普通用户不应能访问用户管理')
  })

  // ===== 4. 内容管理 =====
  console.log('\n📦 4. 内容管理模块 (Content)')

  await test('获取FAQ列表', async () => {
    const res = await request('GET', '/content/faqs', null, adminToken)
    if (!res.body.success || !Array.isArray(res.body.data)) throw new Error('FAQ列表为空')
  })

  await test('创建FAQ', async () => {
    const res = await request('POST', '/content/faqs', {
      question: '测试问题',
      answer: '测试答案内容',
      lang: 'zh',
    }, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '创建失败')
  })

  await test('更新FAQ', async () => {
    const res = await request('PUT', '/content/faqs/1', { question: '更新后的问题' }, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '更新失败')
  })

  await test('删除FAQ', async () => {
    const res = await request('DELETE', '/content/faqs/6', null, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '删除失败')
  })

  await test('获取评价列表', async () => {
    const res = await request('GET', '/content/reviews', null, adminToken)
    if (!res.body.success || !Array.isArray(res.body.data)) throw new Error('评价列表为空')
  })

  await test('创建评价', async () => {
    const res = await request('POST', '/content/reviews', {
      name: '测试用户',
      role: '测试身份',
      content: '这是一条测试评价',
      rating: 5,
      lang: 'zh',
    }, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '创建失败')
  })

  await test('更新评价', async () => {
    const res = await request('PUT', '/content/reviews/1', { rating: 4 }, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '更新失败')
  })

  await test('删除评价', async () => {
    const res = await request('DELETE', '/content/reviews/6', null, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '删除失败')
  })

  await test('获取Logo列表', async () => {
    const res = await request('GET', '/content/logos', null, adminToken)
    if (!res.body.success || !Array.isArray(res.body.data)) throw new Error('Logo列表为空')
  })

  await test('创建Logo', async () => {
    const res = await request('POST', '/content/logos', { name: '测试合作方' }, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '创建失败')
  })

  await test('删除Logo', async () => {
    const res = await request('DELETE', '/content/logos/8', null, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '删除失败')
  })

  // ===== 5. 订单管理 =====
  console.log('\n📦 5. 订单管理模块 (Orders)')

  await test('获取订单列表', async () => {
    const res = await request('GET', '/orders?page=1&limit=10', null, adminToken)
    if (!res.body.success) throw new Error(res.body.error)
    if (!res.body.summary) throw new Error('缺少汇总数据')
  })

  await test('按状态筛选订单', async () => {
    const res = await request('GET', '/orders?status=COMPLETED', null, adminToken)
    if (!res.body.success) throw new Error('筛选失败')
  })

  await test('获取订单详情', async () => {
    const res = await request('GET', '/orders/order-001', null, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '订单不存在')
  })

  await test('更新订单状态', async () => {
    const res = await request('PATCH', '/orders/order-001/status', { status: 'CANCELLED' }, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '状态更新失败')
    // 恢复
    await request('PATCH', '/orders/order-001/status', { status: 'COMPLETED' }, adminToken)
  })

  await test('导出订单CSV', async () => {
    const res = await request('GET', '/orders/export', null, adminToken)
    if (res.status !== 200) throw new Error('导出失败')
  })

  // ===== 6. 多语言管理 =====
  console.log('\n📦 6. 多语言管理模块 (Languages)')

  await test('获取翻译条目', async () => {
    const res = await request('GET', '/languages/translations', null, adminToken)
    if (!res.body.success || !res.body.data.sections) throw new Error('翻译数据不完整')
  })

  await test('批量更新翻译', async () => {
    const res = await request('PUT', '/languages/translations', {
      translations: [
        { key: 'hero.title', zh: '测试标题', en: 'Test Title', tw: '測試標題', section: 'Hero' },
      ],
    }, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '更新失败')
  })

  // ===== 7. 系统设置 =====
  console.log('\n📦 7. 系统设置模块 (Settings)')

  await test('获取系统设置', async () => {
    const res = await request('GET', '/settings', null, adminToken)
    if (!res.body.success || !res.body.data.siteName) throw new Error('设置数据不完整')
  })

  await test('更新系统设置', async () => {
    const res = await request('PUT', '/settings', { siteName: '玄咪AI测试' }, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '更新失败')
  })

  // ===== 8. 操作日志 =====
  console.log('\n📦 8. 操作日志模块 (Logs)')

  await test('获取操作日志', async () => {
    const res = await request('GET', '/logs?page=1&limit=10', null, adminToken)
    if (!res.body.success || !res.body.data) throw new Error('日志列表为空')
  })

  await test('按动作筛选日志', async () => {
    const res = await request('GET', '/logs?action=登录', null, adminToken)
    if (!res.body.success) throw new Error('筛选失败')
  })

  await test('导出日志CSV', async () => {
    const res = await request('GET', '/logs/export', null, adminToken)
    if (res.status !== 200) throw new Error('导出失败')
  })

  // ===== 9. 个人中心 =====
  console.log('\n📦 9. 个人中心模块 (Profile)')

  await test('获取个人信息', async () => {
    const res = await request('GET', '/profile', null, adminToken)
    if (!res.body.success || !res.body.data.name) throw new Error('信息不完整')
  })

  await test('更新个人信息', async () => {
    const res = await request('PUT', '/profile', { name: '沐枫老师测试' }, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '更新失败')
  })

  await test('修改密码', async () => {
    const res = await request('PUT', '/profile/change-password', {
      currentPassword: 'admin123',
      newPassword: 'admin123',
      confirmPassword: 'admin123',
    }, adminToken)
    if (!res.body.success) throw new Error(res.body.error || '密码修改失败')
  })

  await test('重置API Key', async () => {
    const res = await request('POST', '/profile/reset-api-key', {}, adminToken)
    if (!res.body.success || !res.body.data.apiKey) throw new Error('重置失败')
  })

  await test('清除缓存', async () => {
    const res = await request('POST', '/profile/clear-cache', {}, adminToken)
    if (!res.body.success) throw new Error('清除失败')
  })

  // ===== 防护测试 =====
  console.log('\n📦 10. 安全防护')

  await test('未认证访问拒绝', async () => {
    const res = await request('GET', '/users', null, '')
    if (res.body.success) throw new Error('未认证应被拒绝')
  })

  await test('普通用户访问管理接口拒绝', async () => {
    const res = await request('GET', '/settings', null, userToken)
    if (res.body.success) throw new Error('普通用户不应能访问管理设置')
  })

  await test('Zod验证 - 缺字段', async () => {
    const res = await request('POST', '/users', { name: 'Test' }, adminToken)
    if (res.body.success) throw new Error('缺少必填字段应被拒绝')
  })

  await test('Zod验证 - 格式错误', async () => {
    const res = await request('POST', '/users', { name: 'Test', email: 'bad-email', password: '123' }, adminToken)
    if (res.body.success) throw new Error('格式错误应被拒绝')
  })

  await test('404 路由', async () => {
    const res = await request('GET', '/nonexistent-route', null, '')
    if (res.status !== 404) throw new Error('应返回404')
  })

  console.log(`\n=========================================`)
  console.log(`  测试完成: ${passed} 通过 / ${failed} 失败`)
  console.log(`=========================================\n`)
}

run().catch(console.error)
