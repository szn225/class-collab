# 2.5.4 加载状态修正

日期：2026-11-13。手机测试包 /private/tmp/hui-miniprogram-2.5.4-SWXfBS，二维码 phone-preview.png；尚未提审或正式发布小程序。

将首次加载 loading 与后台更新 refreshing 分开。已有活动列表、资料、文章、成员、账户信息或已加载的空结果时，不再显示整页顶部“正在加载”。数据继续刷新，成功、失败、切页、账号切换、页面隐藏均按作用域结束相应状态。没有数据的首次进入保留加载提示。

验证：5 组性能/时序检查通过；原有 35 项业务测试通过；小程序 TypeScript 检查通过。微信原生预览编译成功，包 945777 字节；模拟器确认已有文章后台刷新时 loading=false、refreshing=true、原文章保留、顶部加载元素不存在；刷新结束后 refreshing=false。资料、文章、管理三页检查与截图见本目录。模拟器使用静态隔离响应，不能代替手机网络测速。

## 服务端诊断与候选

新增请求隔离的 Server-Timing：database、image_sign、grades、app。计时不含正文、身份或凭据。健康检查使用相同数据库计时，诊断构建 2.5.4。并发计时隔离测试及后端构建通过。

两份相同源码预览，共用同一数据库，三次健康检查均为 HTTP 200：

| 函数区域 | database 耗时毫秒 | app 耗时毫秒 |
| --- | --- | --- |
| iad1 | 1764.4、1341.0、1329.9 | 1766.1、1341.4、1330.3 |
| sin1 | 370.0、114.9、144.8 | 371.5、115.4、145.2 |

本样本的服务端处理主要耗于跨区数据库读取，新加坡显著缩短这部分等待；不是手机整页耗时或生产 P95，仍有客户端到服务的网络时间。

美国对照：[预览](https://class-collab-v2-test-820a1194z-anns-projects-14c3a4b1.vercel.app)，dpl_BN1ap1FzcYQwRNCJcSc5V4ooc4hi，READY/iad1。

新加坡预览：[预览](https://class-collab-v2-test-8iryob6l5-anns-projects-14c3a4b1.vercel.app)，dpl_5ecqzKr64NXpcKJuH9Zw4utkoA4H，READY/sin1。该预览用于对比，后续生产使用独立构建（见下文）。数据库无需迁移。本次未调用付费模型、未写入生产业务数据。

原生产回退候选 dpl_Ezr5PGyRrXKiGV5FSsGCn5jaGjsN。不得以健康检查代替完整付费生成验收。

受保护预览的本机 vercel curl 曾连接超时，故没有用该失败结果推断速度；区域对比来自 MCP 返回的 Server-Timing，原始汇总见 ../../performance-2026-11-13/regional-health-timing.json。

## 共用服务切换完成

用户明确允许切换共用后端到新加坡。平台拒绝直接提升 preview（422）后，另建 production/skip-domain 候选，避免未经验证替换域名。新生产构建 dpl_oLKMbdGUHyYyBQN4md4tCkueT5xR（sin1）READY，健康检查 200、数据库已连接、build=2.5.4，随后成功提升。

生产部署：[构建地址](https://class-collab-v2-test-rhuct54ib-anns-projects-14c3a4b1.vercel.app)。两个自有域名及项目默认域名映射均 completed；现网响应 x-vercel-id 确认为 sin1::sin1。backend/vercel.json 已固定 regions=[sin1]，防止下次构建回到美国默认区域。

实际服务复验通过：旧会话身份、余额和冻结点数与切换前一致；两个域名健康；AI 排版能力接口；活动列表、详情、素材、文章、成绩学生列表均返回 200。未创建报价、未启动模型或付费任务。业务响应内容及会话凭据未写入报告。

切换后本机完整请求耗时：活动列表 577ms、详情 653ms、素材 1260ms、文章 663ms、成绩学生列表 1272ms、最后一次 me 1275ms。首次 me 为 5225ms，但其应用处理仅 162.4ms；首次连接/网络链路的长尾仍存在。以上是本机小样本，不是手机结果或 P95，也不能把应用内耗时缩短等同于整页每次都能在 1 秒内打开。

原始现网计时见 ../../performance-2026-11-13/production-sin1-verification.json。Server-Timing 中 image_sign 是各并行签名的累计工作耗时，app 是请求内经过时间，二者不可直接相加。
