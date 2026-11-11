---
name: miniprogram-ui-redesign
overview: 将小程序前端全面重写，采用温暖活泼设计风格、紫色渐变配色方案，新增骨架屏加载状态，替换 tabBar 为更精致的图标。覆盖全部 5 个页面及全局样式。
design:
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 20px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#7C3AED"
      - "#A855F7"
    background:
      - "#F3F0FF"
      - "#FFFFFF"
    text:
      - "#1F2937"
      - "#6B7280"
    functional:
      - "#F59E0B"
      - "#10B981"
      - "#EF4444"
todos:
  - id: generate-tabbar-icons
    content: 生成新的 tabBar 图标（4个81x81px PNG文件）并放置到 miniprogram/images/ 目录
    status: completed
  - id: update-global-config
    content: 修改 app.json 更新 tabBar 图标路径，修改 app.wxss 定义新配色方案和全局样式类
    status: completed
    dependencies:
      - generate-tabbar-icons
  - id: redesign-index-topics
    content: 重写登录页和主题列表页的 WXML/WXSS，采用新设计风格
    status: completed
    dependencies:
      - update-global-config
  - id: redesign-topic-article
    content: 重写主题详情页和文章预览页的 WXML/WXSS，采用新设计风格
    status: completed
    dependencies:
      - update-global-config
  - id: redesign-admin-page
    content: 重写管理页的 WXML/WXSS，采用新设计风格
    status: completed
    dependencies:
      - update-global-config
  - id: create-skeleton-components
    content: 创建骨架屏组件，并在各页面中集成骨架屏加载状态
    status: completed
    dependencies:
      - redesign-index-topics
      - redesign-topic-article
      - redesign-admin-page
---

## 产品概述

班级共创小程序前端界面全面重设计，采用温暖活泼风格，适配班级场景，提升用户体验和视觉吸引力。

## 核心功能

- 采用紫色渐变主色调（#7C3AED → #A855F7）替代原微信绿色（#07c160）
- 界面风格改为温暖活泼风，使用大圆角（16px+）、渐变背景、卡片式布局
- 添加骨架屏加载状态，替代简单的"加载中..."文字提示
- 重新设计 tabBar 图标，使用更精致的风格（适合班级场景的图标）
- 优化各页面的视觉层次和交互反馈

## 技术栈

- 微信原生小程序（WXML/WXSS/JS）
- 无额外 UI 框架或组件库（保持轻量）

## 实现方案

### 整体策略

采用渐进式改造方案，先建立新的设计系统和全局样式，再逐页面重写 UI，最后添加骨架屏组件。

### 关键技术决策

1. **配色方案实现**：在 `app.wxss` 中定义 CSS 变量（通过 class 或 page 级样式），确保所有页面使用统一的配色方案。
2. **渐变实现**：使用 `linear-gradient` 实现紫色渐变背景，主要用于页面头部、按钮等重要元素。
3. **大圆角设计**：统一使用 16px 圆角用于卡片，20px 用于按钮，12px 用于输入框。
4. **骨架屏实现**：创建独立的 skeleton 组件，使用 `@keyframes` 动画实现闪烁效果（小程序支持有限的关键帧动画）。
5. **图标生成**：生成 4 个新的 tabBar 图标（81x81px PNG），风格为线性图标 + 圆润线条，与主色调协调。

### 性能考虑

- 骨架屏使用纯 CSS 动画，不依赖 JavaScript，性能开销小
- 渐变背景使用 CSS 实现，避免图片资源
- 图标文件大小控制在 10KB 以内，避免影响加载速度

### 文件修改清单

**修改文件：**

- `miniprogram/app.wxss` - 全局样式，定义新配色和通用类
- `miniprogram/app.json` - 更新 tabBar 图标路径
- `miniprogram/pages/index/index.wxss` - 登录页样式
- `miniprogram/pages/index/index.wxml` - 登录页结构（可能需要微调）
- `miniprogram/pages/topics/topics.wxss` - 主题列表页样式
- `miniprogram/pages/topics/topics.wxml` - 主题列表页结构（可能需要微调）
- `miniprogram/pages/topic/topic.wxss` - 主题详情页样式
- `miniprogram/pages/topic/topic.wxml` - 主题详情页结构（可能需要微调）
- `miniprogram/pages/article/article.wxss` - 文章预览页样式
- `miniprogram/pages/article/article.wxml` - 文章预览页结构（可能需要微调）
- `miniprogram/pages/admin/admin.wxss` - 管理页样式
- `miniprogram/pages/admin/admin.wxml` - 管理页结构（可能需要微调）

**新增文件：**

- `miniprogram/images/topics-active.png` - 新主题图标（选中态）
- `miniprogram/images/topics.png` - 新主题图标（未选中态）
- `miniprogram/images/admin-active.png` - 新管理图标（选中态）
- `miniprogram/images/admin.png` - 新管理图标（未选中态）
- `miniprogram/components/skeleton/skeleton.wxml` - 骨架屏组件
- `miniprogram/components/skeleton/skeleton.wxss` - 骨架屏样式
- `miniprogram/components/skeleton/skeleton.js` - 骨架屏逻辑
- `miniprogram/components/skeleton/skeleton.json` - 骨架屏配置

## 设计风格

采用温暖活泼风格，适合班级场景。使用大圆角（16px+）、渐变背景、卡片式布局。主色调为紫色渐变，辅助色为橙色，整体氛围友好、轻松、有活力。

## 页面设计

### 1. 登录页（pages/index/index）

**布局结构：**

- **顶部区域（渐变背景）**：占据屏幕上半部分 40%，使用紫色渐变背景（#7C3AED → #A855F7），显示应用 Logo（可以用文字图标 "📝" 或自定义图标）和应用名称 "班级共创"
- **中间区域（登录表单）**：白色圆角卡片（圆角 20px），包含：
- 应用标语 "一起记录我们的班级故事"（灰色文字，居中）
- 姓名输入框（圆角 12px，浅灰色背景，无边框，内边距 16px）
- 登录按钮（紫色渐变背景，圆角 20px，白色文字，加粗）
- **底部区域**：提示文字 "首次使用自动注册，第一位用户默认为管理员"（浅灰色，小号字体）

**交互效果：**

- 输入框获取焦点时，边框颜色变为紫色（#7C3AED）
- 登录按钮点击时有轻微缩放效果（active 状态）

### 2. 主题列表页（pages/topics/topics）

**布局结构：**

- **顶部区域（加入主题卡片）**：白色圆角卡片，包含：
- 输入框（圆角 12px，提示文字 "输入6位邀请码加入主题"）
- 加入按钮（紫色背景，白色文字，圆角 8px）
- **中间区域（主题列表）**：
- 每个主题显示为一张白色圆角卡片（圆角 16px，阴影效果）
- 卡片内容：主题标题（加粗）、主题描述（灰色，可选）、状态标签（彩色标签，圆角 10px）、参与人数和素材数量（灰色小字）
- 状态标签颜色：active（绿色）、closed（灰色）、generated（蓝色）
- **空状态**：紫色渐变图标 + "暂无主题" 文字 + 提示文字

**交互效果：**

- 主题卡片点击时有轻微透明度变化（active 状态）
- 下拉刷新时使用小程序原生动画（已在代码中实现）

### 3. 主题详情页（pages/topic/topic）

**布局结构：**

- **顶部区域（主题信息头部）**：紫色渐变背景（#7C3AED → #A855F7），包含：
- 主题标题（白色，大号字体，加粗）
- 主题描述（白色，半透明）
- 邀请码和状态标签（白色，小号字体）
- **中间区域（素材时间线）**：
- 每条素材显示为左侧头像 + 右侧内容卡片
- 头像：紫色圆形背景，白色文字（用户名首字母）
- 内容卡片：白色背景，圆角 12px，阴影效果
- 卡片内容：用户名（加粗）、时间（灰色小字）、素材内容（文字/图片/语音）
- 图片素材：圆角 8px，宽度 100%
- 语音素材：橙色背景，紫色文字
- **底部区域（输入栏）**：固定底部，白色背景，包含：
- 文字输入框（圆角 20px，浅灰色背景）
- 发送按钮（紫色背景，白色文字，圆角 20px）
- 图片和录音按钮（灰色背景，圆角 8px）
- **文章入口**：如果文章已生成，显示蓝色卡片 "📄 查看生成的文章"

**交互效果：**

- 图片点击预览（已在代码中实现）
- 录音按钮点击时变为红色背景（recording 状态）

### 4. 文章预览页（pages/article/article）

**布局结构：**

- **顶部区域（文章信息卡片）**：白色圆角卡片，包含：
- 文章标题（居中，加粗，大号字体）
- 元信息（灰色小字，居中）："由 AI 基于 N 条素材生成"、"生成时间: ...")
- **中间区域（文章内容）**：白色圆角卡片，富文本渲染（使用 `<rich-text>` 组件）
- **底部区域（操作按钮）**：
- "📋 获取预览链接" 按钮（紫色背景，白色文字，圆角 8px）
- 预览链接显示区域（蓝色背景卡片，可选中复制）
- 发布步骤提示（灰色背景卡片，列表形式）

**交互效果：**

- 按钮点击时有轻微缩放效果

### 5. 管理页（pages/admin/admin）

**布局结构：**

- **顶部区域（用户信息卡片）**：白色圆角卡片，包含：
- 用户头像（紫色圆形背景，白色文字）
- 用户名（加粗）
- 角色标签（"管理员" 绿色标签，或 "成员" 灰色标签）
- 退出按钮（灰色边框，圆角 6px）
- **中间区域（功能模块）**：
- 创建主题卡片：白色圆角卡片，包含标题、描述输入框、创建按钮
- 管理主题卡片：白色圆角卡片，列出所有主题，每个主题显示标题、元信息、操作按钮（关闭/生成文章/查看）
- 成员列表卡片：白色圆角卡片，列出所有成员，显示头像、姓名、角色标签
- **空状态**：如果非管理员，显示 "只有管理员可以使用管理功能"

**交互效果：**

- 按钮点击时有轻微缩放效果
- 主题卡片点击时有轻微透明度变化

### 6. 骨架屏设计

**组件结构：**

- 创建独立的 `skeleton` 组件，可在多个页面复用
- 骨架屏样式：浅灰色背景（#F3F0FF），闪烁动画（@keyframes 实现）
- 不同页面使用不同的骨架屏布局：
- 主题列表骨架屏：顶部输入框骨架 + 3 个主题卡片骨架
- 主题详情骨架屏：顶部头部骨架 + 5 条素材骨架
- 文章预览骨架屏：标题骨架 + 3 行内容骨架

**动画效果：**

- 使用 `@keyframes skeleton-blink` 实现闪烁动画（透明度从 0.6 到 1）
- 动画持续时间 1.5s，无限循环（infinite）

## 响应式设计

- 所有页面使用 `rpx` 单位，适配不同屏幕尺寸
- 卡片宽度使用百分比（100%），内边距使用 `rpx`
- 字体大小使用 `rpx`（24rpx ≈ 12px）