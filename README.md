# 班级共创 - 微信公众号文章协作小程序

班级活动素材收集 + AI 自动生成公众号文章。

## 项目结构

```
backend/          # Next.js 后端 (部署到 Vercel)
  ├── src/app/api/   # API 路由
  ├── src/lib/       # 核心库 (Supabase, DeepSeek, HTML模板)
  └── prisma/        # 数据库 Schema + SQL
miniprogram/      # 微信小程序前端
  ├── pages/         # 页面 (登录/主题列表/详情/文章/管理)
  └── utils/         # API 封装
```

## 部署步骤

### 1. 注册微信小程序
1. 打开 https://mp.weixin.qq.com 注册小程序账号（个人主体免费）
2. 获取 AppID，填入 `miniprogram/project.config.json` 的 `appid` 字段

### 2. 设置 Supabase 数据库
1. 在 https://supabase.com 注册并创建项目（免费 Starter 计划）
2. 进入项目 → SQL Editor，粘贴运行 `backend/prisma/supabase-schema.sql`
3. 创建 Storage bucket: Project Settings → Storage → Create bucket `materials`，设为 public
4. 获取 Project URL 和 anon key (Project Settings → API)

### 3. 获取 DeepSeek API Key
1. 打开 https://platform.deepseek.com 注册账号
2. 创建 API Key

### 4. 部署后端到 Vercel
1. 登录 https://vercel.com
2. 导入 `backend/` 目录
3. 设置环境变量 (见下方)
4. 部署成功后获得域名如 `your-app.vercel.app`

### 5. 环境变量

在 Vercel 项目 Settings → Environment Variables 中添加：

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
| `DEEPSEEK_API_KEY` | DeepSeek API Key |

### 6. 配置小程序
1. 打开微信开发者工具，导入 `miniprogram/` 目录
2. 修改 `miniprogram/utils/api.js` 中的 `baseUrl` 为 Vercel 域名
3. 在微信小程序后台 → 开发 → 开发设置 → 服务器域名，添加 Vercel 域名

### 7. 本地开发

```bash
# 启动后端 (backend/)
npm install
cp .env.example .env.local  # 填入配置
npm run dev

# 小程序在微信开发者工具中打开 miniprogram/ 目录即可
```

## 使用流程

1. 第一位用户注册 → 自动成为管理员
2. 管理员创建主题 → 系统生成6位邀请码
3. 管理员将邀请码分享到班级群
4. 班级成员输入姓名登录 → 输入邀请码加入主题
5. 活动过程中，成员提交文字/语音/图片素材
6. 活动结束，管理员点击"生成文章"
7. AI 基于所有素材自动生成公众号文章
8. 管理员复制 HTML → 粘贴到微信公众平台编辑器 → 发布

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth | 登录/注册 |
| GET | /api/topics?userId=xxx | 获取用户主题列表 |
| POST | /api/topics | 创建主题 (管理员) |
| GET | /api/topics/:id | 获取主题详情 |
| PATCH | /api/topics/:id | 更新主题 |
| POST | /api/topics/join | 通过邀请码加入主题 |
| GET | /api/materials?topicId=xxx | 获取素材列表 |
| POST | /api/materials | 提交素材 |
| POST | /api/upload | 上传图片 |
| GET | /api/members?topicId=xxx | 获取成员列表 |
| DELETE | /api/members | 移除成员 |
| POST | /api/generate | AI 生成文章 (管理员) |
| GET | /api/article?topicId=xxx | 获取生成的文章 |
