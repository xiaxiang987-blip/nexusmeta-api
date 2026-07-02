# 玄咪AI NexusMeta - 命理解盘后端服务

> 玄学文化出海一站式 AI 内容创作平台 - 命理分析 API 服务

---

## 功能特性

### 命理分析能力
- **八字排盘** - 精确计算年柱、月柱、日柱、时柱，分析日主强弱、五行平衡
- **紫微斗数** - 命宫、身宫、十二宫位分析（开发中）
- **风水分析** - 家居/办公/户型风水分析
- **合婚合盘** - 双人八字合盘分析
- **流年运势** - 年度/月度运势预测

### AI 能力
- 接入 OpenAI GPT-4o 进行深度命理分析
- 支持 **70种语言** 输出（简中、繁中、英语、马来语、印尼语、粤语等）
- 专业命理 Prompt 工程，确保分析专业性和准确性

### 用户系统
- JWT 认证
- 积分制计费
- 历史记录查询
- 多语言术语库

---

## 快速开始

### 1. 安装依赖

```bash
cd nexusmeta-server
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填写必要配置：

```bash
cp .env.example .env
```

**必填项：**
- `OPENAI_API_KEY` - 你的 OpenAI API Key（获取地址：https://platform.openai.com/api-keys）
- `DATABASE_URL` - PostgreSQL 数据库连接串

### 3. 初始化数据库

```bash
# 创建数据库
createdb nexusmeta

# 运行迁移
npm run prisma:migrate

# 生成 Prisma Client
npm run prisma:generate
```

### 4. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build
npm start
```

服务启动后访问：`http://localhost:3001`

---

## API 文档

### 基础信息
- **Base URL**: `http://localhost:3001/api`
- **认证方式**: JWT Token（Header: `Authorization: Bearer <token>`）
- **响应格式**: JSON

---

### 认证接口

#### 注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "张三"
}
```

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 管理员快捷登录
```http
POST /api/auth/admin/login
Content-Type: application/json

{
  "email": "admin@xuanmi.net",
  "password": "admin123"
}
```

---

### 命理分析接口

#### 八字排盘分析（需登录）
```http
POST /api/divination/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "BAZI",
  "name": "张三",
  "gender": "MALE",
  "birthDate": "1990-05-15",
  "birthTime": "14:30",
  "birthPlace": "北京",
  "language": "zh"
}
```

#### 免费体验（无需登录）
```http
POST /api/divination/bazi/free
Content-Type: application/json

{
  "name": "张三",
  "gender": "MALE",
  "birthDate": "1990-05-15",
  "birthTime": "14:30",
  "language": "zh"
}
```

#### 合婚分析
```http
POST /api/divination/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "COMPATIBILITY",
  "name": "张三",
  "gender": "MALE",
  "birthDate": "1990-05-15",
  "birthTime": "14:30",
  "partnerName": "李四",
  "partnerGender": "FEMALE",
  "partnerBirthDate": "1992-08-20",
  "partnerBirthTime": "09:00"
}
```

#### 流年运势分析
```http
POST /api/divination/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "YEARLY_FORTUNE",
  "name": "张三",
  "gender": "MALE",
  "birthDate": "1990-05-15",
  "birthTime": "14:30",
  "targetYear": 2026
}
```

#### 查询历史记录
```http
GET /api/divination/history?page=1&limit=10&type=BAZI
Authorization: Bearer <token>
```

#### 命理术语查询
```http
GET /api/divination/knowledge/天干?language=zh
```

---

### 响应示例

**成功响应：**
```json
{
  "success": true,
  "data": {
    "bazi": {
      "yearPillar": "庚午",
      "monthPillar": "辛巳",
      "dayPillar": "丙戌",
      "hourPillar": "乙未",
      "dayMaster": "丙",
      "dayMasterElement": "火"
    },
    "analysis": "根据您的八字排盘...（详细分析）",
    "summary": "日主丙火偏旺，喜金水为用神",
    "luckyElements": ["金", "水"],
    "weakElements": ["火", "木"],
    "scores": {
      "overall": 78,
      "health": 72,
      "wealth": 80,
      "love": 75,
      "career": 82
    },
    "suggestions": [
      "事业宜向西方或北方发展",
      "适合从事金融、水利、物流等行业",
      "注意心脏、血压方面的健康"
    ]
  }
}
```

**错误响应：**
```json
{
  "success": false,
  "error": "错误信息"
}
```

---

## 支持的语言代码

| 代码 | 语言 | 代码 | 语言 |
|------|------|------|------|
| `zh` | 简体中文 | `en` | English |
| `zh-TW` | 繁体中文 | `ms` | Bahasa Melayu |
| `id` | Bahasa Indonesia | `yue` | 粤语 |
| `th` | ไทย | `vi` | Tiếng Việt |
| `ja` | 日本語 | `ko` | 한국어 |
| `es` | Español | `fr` | Français |
| `de` | Deutsch | `pt` | Português |

（共支持 70 种语言，详见 `src/services/openai.ts` 中的 `LANGUAGE_INSTRUCTIONS`）

---

## 积分消耗

| 分析类型 | 消耗积分 |
|----------|----------|
| 八字排盘 | 10 积分 |
| 紫微斗数 | 15 积分 |
| 风水分析 | 20 积分 |
| 合婚合盘 | 25 积分 |
| 流年运势 | 15 积分 |
| 流月运势 | 10 积分 |

---

## 部署

### 本地部署
```bash
npm run build
npm start
```

### 云端部署（推荐）

#### Vercel（最简便）
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

#### Render
1. 连接 GitHub 仓库
2. 设置环境变量
3. 部署

#### Docker
```bash
docker build -t nexusmeta-server .
docker run -p 3001:3001 --env-file .env nexusmeta-server
```

---

## 技术栈

- **运行时**: Node.js 20+
- **框架**: Express 4
- **语言**: TypeScript 5
- **数据库**: PostgreSQL + Prisma ORM
- **AI**: OpenAI GPT-4o
- **认证**: JWT + bcrypt
- **农历计算**: lunar-javascript

---

## 项目结构

```
nexusmeta-server/
├── src/
│   ├── index.ts           # 主入口
│   ├── config/
│   │   └── env.ts        # 环境配置
│   ├── routes/
│   │   ├── auth.ts       # 认证路由
│   │   └── divination.ts # 命理分析路由
│   ├── services/
│   │   └── openai.ts    # OpenAI 服务
│   ├── utils/
│   │   └── bazi.ts      # 八字计算引擎
│   ├── middleware/
│   │   └── auth.ts      # JWT 中间件
│   └── models/           # 数据模型（待实现）
├── prisma/
│   └── schema.prisma    # 数据库 Schema
├── .env                  # 环境变量（不提交）
├── package.json
└── tsconfig.json
```

---

## 下一步开发计划

- [ ] 接入真实 PostgreSQL 数据库
- [ ] 实现积分扣减逻辑
- [ ] 接入 Stripe 支付
- [ ] 实现数字人视频生成接口
- [ ] 实现多语言翻译接口
- [ ] 实现风水图像分析接口
- [ ] 添加限流和防盗刷
- [ ] 添加 API 使用统计
- [ ] 部署到生产环境

---

## 联系方式

- 官网：https://xuanmi.net
- 邮箱：admin@xuanmi.net
- GitHub：https://github.com/xiaxiang987-blip/xuanmi.net

---

## License

MIT
