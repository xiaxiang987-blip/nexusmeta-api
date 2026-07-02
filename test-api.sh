# 玄咪AI NexusMeta - API 测试脚本
# 使用方法：
# 1. 启动后端服务：npm run dev
# 2. 运行此脚本：bash test-api.sh

BASE_URL="http://localhost:3001"

echo "══════════════════════════════════════"
echo "  玄咪AI NexusMeta API 测试"
echo "══════════════════════════════════════"
echo ""

# ===== 1. 健康检查 =====
echo "📡 [1/7] 健康检查..."
curl -s "$BASE_URL/health" | python -m json.tool
echo ""

# ===== 2. API 信息 =====
echo "📋 [2/7] API 信息..."
curl -s "$BASE_URL/api" | python -m json.tool
echo ""

# ===== 3. 用户注册 =====
echo "📝 [3/7] 用户注册..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "测试用户"
  }')

echo "$REGISTER_RESPONSE" | python -m json.tool

# 提取 Token
TOKEN=$(echo "$REGISTER_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('token', ''))")

if [ -z "$TOKEN" ]; then
  echo "⚠️  注册失败，尝试登录..."
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "test123456"
    }')
  TOKEN=$(echo "$LOGIN_RESPONSE" | python -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('token', ''))")
fi

echo "Token: ${TOKEN:0:20}..."
echo ""

# ===== 4. 获取用户信息 =====
if [ -n "$TOKEN" ]; then
  echo "👤 [4/7] 获取用户信息..."
  curl -s -X GET "$BASE_URL/api/auth/profile" \
    -H "Authorization: Bearer $TOKEN" | python -m json.tool
  echo ""
fi

# ===== 5. 免费八字排盘（无需登录）=====
echo "☯️  [5/7] 免费八字排盘（体验版）..."
curl -s -X POST "$BASE_URL/api/divination/bazi/free" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "gender": "MALE",
    "birthDate": "1990-05-15",
    "birthTime": "14:30",
    "birthPlace": "北京",
    "language": "zh"
  }' | python -m json.tool 2>/dev/null || curl -s -X POST "$BASE_URL/api/divination/bazi/free" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "gender": "MALE",
    "birthDate": "1990-05-15",
    "birthTime": "14:30",
    "birthPlace": "北京",
    "language": "zh"
  }'
echo ""

# ===== 6. 命理术语查询 =====
echo "📚 [6/7] 命理术语查询..."
curl -s "$BASE_URL/api/divination/knowledge/天干?language=zh" | python -m json.tool
echo ""

curl -s "$BASE_URL/api/divination/knowledge/五行?language=en" | python -m json.tool
echo ""

# ===== 7. 需要登录的接口（如果有 Token）=====
if [ -n "$TOKEN" ]; then
  echo "🔐 [7/7] 完整八字排盘分析（需登录）..."
  curl -s -X POST "$BASE_URL/api/divination/analyze" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "type": "BAZI",
      "name": "张三",
      "gender": "MALE",
      "birthDate": "1990-05-15",
      "birthTime": "14:30",
      "birthPlace": "北京",
      "language": "zh"
    }' | python -m json.tool 2>/dev/null || echo "分析请求已发送（需要 OpenAI API Key）"
  echo ""
fi

echo "══════════════════════════════════════"
echo "  测试完成！"
echo "══════════════════════════════════════"

# ===== 手动测试命令 =====
echo ""
echo "📌 手动测试命令："
echo ""
echo "# 管理员登录"
echo "curl -X POST $BASE_URL/api/auth/admin/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"admin@xuanmi.net\",\"password\":\"admin123\"}'"
echo ""
echo "# 八字排盘（完整版）"
echo "curl -X POST $BASE_URL/api/divination/analyze \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "  -d '{\"type\":\"BAZI\",\"name\":\"张三\",\"gender\":\"MALE\",\"birthDate\":\"1990-05-15\",\"birthTime\":\"14:30\"}'"
echo ""
echo "# 查看更多接口文档："
echo "  $BASE_URL/api"
