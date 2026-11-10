# 小程序 2.1.1 / 2.3.3 与管理后台兼容性

核验日期：2026-11-10。用户确认微信线上版本为 2.1.1。结论：仓库对应的 2.1.1 上传包与 2.3.3 预览包均兼容当前已部署的 v2 后端，管理后台升级不要求先发布 2.3.3。

## 核验来源

- 2.1.1：`/private/tmp/hui-miniprogram-2.1.1-vftg8T`，140 个文件与 `docs/device-test/release-2.1.1/manifest.json` 的 SHA-256 全部一致。
- 2.3.3：`/private/tmp/hui-miniprogram-2.3.3-U7Au3O`，380 个文件与 `docs/device-test/release-2.3.3/manifest.json` 的 SHA-256 全部一致。
- 后端：部署 `dpl_BjpGmh97GTCAZwPFVHhqEMWBHd7m`，代码提交 `2d3ba4a`，后台版本 `admin-ui-1.1.0`。
- 线上版本号由用户提供；未读取微信公众平台的已发布代码。

## 相同的协议与数据模块

以下文件逐字节相同：`app.js`、`config/endpoints.js`、`utils/auth.js`、`utils/v2.js`、`utils/grades.js`、成绩 `core/types.ts`、`services/account-record.service.ts`、`services/data-source.ts`、`services/dataset.service.ts`。

两个发布包的 develop、trial、release 均指向 `https://gongchuang-test.chaohuiwan.com.cn`，统一使用 `/api/v2/`、Bearer 会话以及 requestId。正式域名切换时保留该既有域名，不对它设置跳转，不强迫已发布小程序改变地址。

成绩同步继续使用 students.list / students.create / workspace.get / workspace.save，学生隔离、expectedRevision、operationId、冲突备份及本机文档格式相同。共创页面通过 TypeScript AST 提取的 44 处 call 表达式（命令及参数）在两个版本中全部一致。

## 超出纯样式的前端变化

- 2.3.3 增加固定科目行和默认满分，保留已有草稿及自定义满分；空白科目不作为 0 分记录提交，实际输入的 0 分仍保留。
- 表单切换菜单时保存草稿，取消登录后的恢复及折叠状态有所调整。
- 未保存文章离开首页增加确认；共创次要字段折叠。
- 成绩列表增加分数显示，趋势图调整坐标留白、日期标签和变动方向的呈现。

这些变化涉及交互和输入整理，不能表述为只改 CSS；但未改变后端接口协议、账户身份、成绩持久化结构或核心位次换算算法，不需要新增数据库迁移。

## 运行验证

分别将既有 `scripts/grades-integration.test.cjs` 的客户端模块解析映射到两个经过哈希核验的冻结目录，后端继续使用当前实际 Next POST 路由、当前成绩校验和本地 PostgreSQL（PGlite）。两个客户端各通过 17 项集成检查，包括登录后保存、重试去重、云端加载、账户/学生隔离、并发冲突、删除墓碑和拒绝越权。

测试隔离运行，无生产账号/成绩写入，无供应商 AI 调用。未将本地测试结果扩大为手机端跨版本升级真机验收；没有重新发布 2.3.3。

## 正式域名结果

`gongchuang.chaohuiwan.com.cn` 已从旧版 class-collab 项目迁移至 class-collab-v2-test 的已验证生产部署。正式 HTTPS 后台 `/manage` 返回 200 并加载 1.1.0 资产，版本接口返回 admin-ui-1.1.0，健康接口返回数据库 connected、version 2。具体项目、部署与回滚路径见 `formal-domain.json`。

此前旧域名上的 v1 API 和 2.1.1 使用的 `/api/v2/` 应区分：当前 v2 后端拒绝 v1 API，不代表拒绝 2.1.1。此次兼容性结论仅涵盖已核验的 2.1.1 / 2.3.3 包，不涵盖更早的 v1 客户端。
