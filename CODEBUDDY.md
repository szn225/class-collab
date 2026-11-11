# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

> 文档整理提示（2026-11-11）：本文含旧版架构、命令与部署经验。当前工程入口、接口地址配置和版本状态以 [项目 README](README.md)、[文档索引](docs/README.md) 和 [版本状态](docs/STATUS.md) 为准；旧版步骤应先核对适用范围。

## 项目概述

"班级共创"是一个微信小程序，用于班级活动素材收集和 AI 自动生成微信公众号文章。用户通过邀请码加入活动主题，提交文字/图片/语音素材，管理员触发 DeepSeek AI 基于素材自动生成适合微信公众平台发布的 HTML 文章。

## 常用命令

### 后端 (backend/)

```bash
cd backend
npm install                     # 安装依赖
cp .env.example .env.local     # 配置环境变量（首次）
npm run dev                     # 本地启动 Next.js 开发服务器 (localhost:3000)
npm run build                   # 生产构建
npm run start                   # 启动生产服务器
npm run db:generate             # 生成 Prisma Client（修改 schema 后执行）
npm run db:push                 # 推送 Prisma schema 到 Supabase
npm run db:studio               # 打开 Prisma Studio 浏览器管理数据库
```

### 小程序 (miniprogram/)

小程序无构建命令，直接用微信开发者工具打开 `miniprogram/` 目录即可编译和预览。修改 `miniprogram/utils/api.js` 中的 `baseUrl` 可切换后端地址。

## 技术架构

### 整体架构

```
微信小程序 (原生框架)
    ↓ wx.request
Vercel (Next.js 14 App Router, API Routes)
    ↓ fetch (Supabase REST API)
Supabase (PostgreSQL + Storage)
    ↓
DeepSeek AI API (文章生成)
```

### 后端：Next.js 14 + TypeScript

后端是一个纯 API 项目（`class-collab-backend`），部署在 Vercel，不使用 Supabase JS SDK，而是通过 `src/lib/supabase.ts` 直接调用 Supabase REST API（fetch 封装）。Prisma 仅作为 schema 参考文档，实际建表通过 Supabase SQL Editor 执行 `prisma/` 目录下的 SQL 文件。

**核心库文件 (`src/lib/`)：**

- **`supabase.ts`** — 轻量 Supabase 客户端。提供 `select`、`insert`、`update`、`del`、`count`、`rawQuery`、`uploadFile`、`getPublicUrl` 八个函数。认证使用 `SUPABASE_SERVICE_ROLE_KEY`（服务端全权限）或 `SUPABASE_ANON_KEY`。所有操作通过 fetch 调用 Supabase REST API，使用 URLSearchParams 构建 PostgREST 查询参数（eq、in、order、limit 等）。文件上传走 `/storage/v1/object/` 端点，插入到 `materials` bucket，路径格式 `{userId}/{timestamp}_{random}.{ext}`。

- **`deepseek.ts`** — DeepSeek AI 集成。`callDeepSeek()` 调用 `deepseek-chat` 模型，非流式输出，temperature 默认 0.7，max_tokens 默认 4096。`buildArticlePrompt()` 将素材列表构建为 system + user 消息：system prompt 要求 AI 扮演班级公众号编辑，按 8 条规范（吸引人的标题、逻辑分段插入 `[图片:N]` 占位、积极语气、800-1500 字等）输出 Markdown 格式文章。图片标记正则必须与 prompt 格式同步：`/[图片[：:]\s*(?:素材\s*)?(\d+)\s*\]/g`。

- **`template.ts`** — Markdown 转微信 HTML。`markdownToWeChatHTML()` 将 Markdown 转换为带内联样式（字体、行高、缩进 `text-indent:2em`）的 HTML 片段，图片占位 `[图片:N]` 替换为 `<img>` 标签。`buildWeChatHTML()` 组装完整 HTML 文档（含 DOCTYPE、meta viewport）。微信小程序 `rich-text` 组件不能渲染完整 HTML 文档，需在前端剥离 DOCTYPE/html/head/body 标签。

**数据模型 (`src/types.ts`)：**

5 个接口对应 5 张表：`User`（id/name/role）、`Topic`（含 inviteCode/status/memberCount/materialCount）、`Material`（含 userName/userAvatar 聚合字段）、`Article`（content 为 Markdown，html 为微信 HTML）、`ApiResponse<T>`（统一 `{ok, data?, error?}` 响应）。User.role 为 `'admin' | 'member'`，Topic.status 为 `'active' | 'closed' | 'generated'`。

**API 路由 (`src/app/api/`)：**

所有路由使用 Next.js App Router Route Handler 模式（`route.ts` 导出 async 函数）。统一响应格式 `ApiResponse<T>`。

| 路由 | 方法 | 核心逻辑 |
|------|------|---------|
| `/api/auth` | POST | 登录/注册。首个用户自动设为 admin。 |
| `/api/topics` | GET/POST | GET 查询用户参与的主题（含 memberCount/materialCount 聚合）。POST 仅 admin，自动生成 6 位邀请码（排除 0/O/1/I/L），将创建者自动加入。 |
| `/api/topics/[id]` | GET/PATCH | 获取/更新单个主题。 |
| `/api/topics/join` | POST | 通过邀请码加入，检查主题状态（closed/generated 不可加入），防重复。 |
| `/api/materials` | GET/POST | GET 通过 rawQuery 做 Supabase JOIN（users!Material_userId_fkey）获取 userName。POST 验证用户是成员。 |
| `/api/members` | GET/DELETE | 成员列表和移除。 |
| `/api/upload` | POST | FormData 上传图片到 Supabase Storage。校验类型（JPEG/PNG/WebP/GIF）和大小（≤10MB）。 |
| `/api/generate` | POST | 核心流程：验证 admin → 获取主题+素材 → buildArticlePrompt → callDeepSeek → 提取标题+收集图片 URL → markdownToWeChatHTML → buildWeChatHTML → 插入/更新 Article → 更新 Topic 状态为 generated。 |
| `/api/article` | GET | 按 topicId 获取文章。 |

**预览页面 (`src/app/view/[topicId]/page.tsx`)：**

一个独立的 Next.js 页面（非 API route），直接通过 fetch 从 Supabase 读取文章 HTML，渲染为带样式的文章预览页。引导用户 `Cmd+A` / `Cmd+C` 复制全文后粘贴到微信公众平台编辑器。

**环境变量（必需）：**

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase 匿名密钥（JWT 格式，从 Supabase 后台 Project Settings → API 获取）
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase 服务角色密钥（服务端全权限）
- `DEEPSEEK_API_KEY` — DeepSeek API 密钥

### 前端：微信原生小程序

**全局状态 (`app.js`)：**

`globalData.userInfo` 存储当前登录用户，通过 `wx.setStorageSync`/`wx.getStorageSync` 持久化。`baseUrl` 指向后端 API 地址。`logout()` 清除存储并重定向到登录页。

**导航结构：**

首屏为登录页（`pages/index/index`），登录后进入 tabBar 页面。底部两个 tab：**主题**（`pages/topics/topics`）和 **管理**（`pages/admin/admin`）。主题详情页和文章页通过 `wx.navigateTo` 从主题列表跳转。

**API 封装 (`utils/api.js`)：**

`request()` 函数封装 `wx.request`，自动拼接 baseUrl，解析 `ApiResponse` 格式（`res.data.ok` 判断成功），失败时 `wx.showToast`。`api` 对象导出所有接口方法：`login`、`getTopics`、`createTopic`、`joinTopic`、`getMaterials`、`addMaterial`、`uploadImage`（使用 `wx.uploadFile`）、`generateArticle`、`getArticle`、`getMembers`、`removeMember`。

**页面职责：**

- **index（登录页）** — 输入姓名 → `api.login()` → 存储 userInfo → `wx.switchTab` 到主题页。
- **topics（主题列表）** — 展示用户参与的主题卡片（主题标题、邀请码、状态），支持下拉刷新和输入邀请码加入。
- **topic（主题详情）** — 素材时间线展示（文字/图片/语音）、文字输入发送、图片 URL 输入添加、语音录制（使用 `wx.getRecorderManager`，当前为 MVP 模式仅发 `[语音消息]` 占位）。`statusText()` 映射状态文字。
- **article（文章预览）** — 加载 `api.getArticle()` 获取 HTML，剥离 DOCTYPE/html/head/body 标签后通过 `<rich-text nodes="{{displayHtml}}">` 渲染。提供复制预览 URL 和跳转到浏览器预览页的功能。
- **admin（管理页）** — 仅 admin 可见。创建主题（输入标题+描述）、管理成员列表、关闭主题（patch status='closed'）、触发 AI 生成文章（`api.generateArticle`）。显示当前用户姓名和退出登录。

**全局样式 (`app.wxss`)：**

主题色 `#07c160`（微信绿）。提供可复用工具类：`.card`、`.btn-primary`、`.btn-small`、`.input-field`、`.empty-state`、`.loading`。

### 数据库 (Supabase PostgreSQL)

5 张表，关系如下：
- **User** 1→N **Topic** (createdBy) / 1→N **Material** (userId)
- **Topic** 1→N **Member** / 1→N **Material** / 1→1 **Article**
- **Member** 是 User-Topic 多对多关系表，`@@unique([topicId, userId])`

建表 SQL 在 `prisma/deploy-sql.sql` 和 `prisma/supabase-schema.sql`（内容一致），在 Supabase SQL Editor 中执行。补充：需额外创建 Storage bucket `materials` 设为 public。

### 已知踩坑（来自部署总结）

1. **Supabase Key 必须是 JWT 格式**（`eyJ...` 开头），从 Supabase 后台 Project Settings → API 获取，不要使用 `sb_publishable_xxx` 格式。
2. **id 字段必须有默认值** — 建表 SQL 必须为所有主键 `id` 设置 `DEFAULT gen_random_uuid()`。
3. **环境变量要先配置再部署** — Vercel 修改环境变量后必须重新部署才能生效。
4. **微信隐私协议** — 新基础库（3.x）强制隐私合规，`chooseImage`、`chooseMedia`、`setClipboardData` 会被拦截。需在微信公众平台配置隐私协议。当前图片上传使用 URL 输入方式临时绕过。
5. **`<input model:value>` 不可靠** — 建议使用 `value="{{xxx}}" bindinput="onInput"` 代替。
6. **AI 图片标记格式** — prompt 和正则必须同步设计。当前正则 `/[图片[：:]\s*(?:素材\s*)?(\d+)\s*\]/g` 兼容 `[图片:3]` 和 `[图片：素材3]`。
7. **`rich-text` 只接受片段** — 不能渲染完整 HTML 文档（含 DOCTYPE/html/head/body），需在前端剥离。
8. **Next.js 14 App Router 页面路由需要根布局** — 非 API 路由需 `app/layout.tsx`。
