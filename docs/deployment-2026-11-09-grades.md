# 2026-11-09 成绩助手数据库迁移与后端部署

## 部署结果

- 服务地址：https://gongchuang-test.chaohuiwan.com.cn
- 健康检查：https://gongchuang-test.chaohuiwan.com.cn/api/health
- 团队：anns-projects-14c3a4b1
- 项目：class-collab-v2-test（prj_AuicRy7kDGszYbTu7Anco6vGyi36）
- 环境与状态：Production / READY，已提升并确认现有服务域名指向本次部署。
- 部署 ID：dpl_HKz2Fdd4YUKBz78KwyradmSecMdU
- 部署 URL：https://class-collab-v2-test-c0zm25z92-anns-projects-14c3a4b1.vercel.app
- 控制台：https://vercel.com/anns-projects-14c3a4b1/class-collab-v2-test/HKz2Fdd4YUKBz78KwyradmSecMdU
- 框架：Next.js 14.2.35。生产构建、类型检查与静态生成通过；Vercel 记录构建 16 秒。
- 构建完成时间：2026-11-09 17:59（Asia/Shanghai）。
- 来源：本地 backend 工作区（包含未提交改动，Git 参考 b094cd2），通过独立暂存目录发布，未提交或推送 Git。暂存目录与源文件逐个 SHA-256 比对一致，明细见 deployment-2026-11-09-grades-manifest.json。

选择此项目的依据是 miniprogram/config/endpoints.js 的 develop/trial/release 当前均指向 gongchuang-test.chaohuiwan.com.cn。backend/.vercel/project.json 仍关联旧版项目，未使用该旧关联发布新版。

## 数据库迁移

在原 Supabase gongchuang 项目 wvmebfesylhvgyyibysj 的 main / PRODUCTION 数据库执行 backend/prisma/hui-grades.sql，事务成功提交。

- 新增成绩学生、工作区、考试、复盘和操作回执共 5 张表，5 张均启用 RLS。
- 匿名可读成绩表数量为 0。
- hui_grades RPC：anon 与 authenticated 均无执行权限，service_role 有执行权限。
- 通过真实 REST RPC 验证：服务角色只读查询成功，匿名密钥被拒绝。
- 原共创聚合状态迁移前后 revision 均为 61，MD5 均为 304fcf5ec8640cd5202aca765f26038c，用户数 3、活动数 4，未改变原账号与活动内容。
- 没有执行旧版权限切换脚本、历史数据认领或创建测试学生/成绩。

## 线上验收

发布以 --prod --skip-domain 构建，READY 后提升至当前新版服务域名。默认 vercel.app 验证地址连接超时，因此最终接口验收使用小程序已配置的自有域名。

scripts/grades-live-check.cjs --base https://gongchuang-test.chaohuiwan.com.cn 已通过：

1. 健康检查 HTTP 200、version 2、database connected。
2. 原有真实微信会话仍有效，账号 ID 与已保存会话一致。
3. 成绩学生列表接口 HTTP 200，已连通新增数据库 RPC。
4. 未登录访问成绩接口返回 401。
5. 不存在或无权访问的学生工作区返回 404。
6. 无效保存请求返回 400，在数据库写入前被拒绝。

上述线上接口检查均为只读或参数拒绝检查，没有新增或修改账号、学生、成绩、活动，也没有调用付费 AI。

Vercel 新部署最近 15 分钟 error 日志查询未发现记录。此为本次发布后的短时检查，不代表持续监控或完整跨设备验收。

## 保留的旧版与回退信息

- 旧版项目 class-collab / gongchuang.chaohuiwan.com.cn 仍指向 dpl_4viUx74vjPV9bBMZXD13F7ATDt6H，未改动。
- 新版上一部署为 dpl_9tyLKANr8vdaQSuTnN9yebkPggKM。如需回退，应在 class-collab-v2-test 项目提升该上一部署，避免误操作旧项目。
- 本次迁移为增量，回退后端时可保留新增表，不需删除成绩数据。
- 本次未上传、提审或发布小程序。后续使用根目录 miniprogram 工程上传整合版，继续验证实际手机登录、游客导入与跨设备同步。
