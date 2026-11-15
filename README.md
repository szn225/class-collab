# 慧共创

慧共创是微信原生小程序，提供活动素材共创与初三成绩追踪两个入口，共用微信登录与账号体系。共创支持资料收集、选材、AI 写作、文章编辑和分享；成绩模块支持多学生档案、成绩定位、趋势、复盘和云端同步。

## 当前状态

截至 2026-11-15，仓库小程序版本为 **2.5.9**，包含本轮交互优化及头像昵称授权排查；最近手机预览为 **2.5.8**，微信开发版最近上传记录为 **2.5.5**。本轮未提交小程序代码审核或正式发布；用户隐私保护指引已补齐并提交，提交后显示审核中。详细依据和验收边界统一见 [版本状态](docs/STATUS.md)。

## 工程结构

| 路径 | 用途 |
| --- | --- |
| `miniprogram/` | 正式小程序工程；首页 `pages/home/index`，共创 `pages/co-create/index` |
| `miniprogram/packages/grades/` | 成绩助手分包，含页面、业务服务与换算内核 |
| `backend/` | Next.js 14 + TypeScript 后端，v2 API、文章分享页与管理后台 |
| `backend/prisma/` | 数据库增量 SQL 与旧版迁移资料 |
| `scripts/` | 回归检查、设备验收与发布打包脚本 |
| `docs/` | 开发指南、版本状态、验收证据和历史归档 |
| `ui-preview/` | 早期浏览器交互原型，仅供设计参考 |


## 本地开发

使用 Node.js 22.12+（22 系列）或 24+（24 系列）；本次验证环境为 Node.js 24.16.0。首次准备后端依赖，在仓库根目录运行：

```sh
npm --prefix backend install
```

本地首次配置：将 `backend/.env.example` 复制为 `backend/.env.local` 并填写环境变量；已有配置时沿用。配置与迁移说明见 [v2 开发与联调](docs/慧共创-v2-开发与联调.md)。

```sh
npm --prefix backend run dev
```

使用微信开发者工具打开 `miniprogram/`。接口地址统一配置在 `miniprogram/config/endpoints.js`，当前 develop、trial、release 均指向 `https://gongchuang-test.chaohuiwan.com.cn`。本机后端联调需使用设备可访问的地址，并核对微信域名及隐私配置。

## 常用检查

以下命令在仓库根目录运行，具体覆盖范围见各开发指南：

```sh
npm --prefix backend test
npm --prefix backend run test:grades:unit
npm --prefix backend run typecheck:mini
npm --prefix backend run build
```

`test:grades:unit` 独立运行主工程成绩内核与本地数据源测试，无需旧成绩助手目录。成绩数据库联调另见 [成绩助手开发与验收](docs/慧共创-成绩助手开发与验收.md)；该检查需要额外的本地测试依赖。

旧独立工程已移出本仓库，作为外部历史备份；当前成绩代码和测试均在本仓库独立维护。

## 文档与服务入口

- [完整文档索引](docs/README.md)
- [当前版本、发布与验收状态](docs/STATUS.md)
- [管理后台](https://gongchuang.chaohuiwan.com.cn/manage)
- [历史资料与归档规则](docs/archive/README.md)

旧版项目介绍、部署步骤和 v1 API 清单已归入 [旧版 README](docs/archive/legacy/README-v1.md)。
