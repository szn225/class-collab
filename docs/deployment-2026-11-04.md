# 2026-11-04 上线记录

- Vercel 团队：anns-projects-14c3a4b1
- 项目：class-collab（prj_4Qscf5gVh1oq7MnZ3Hjg2ujP47jn）
- 正式域名：https://gongchuang.chaohuiwan.com.cn
- 原 Vercel 默认域名：https://class-collab-five.vercel.app
- 部署 ID：dpl_4viUx74vjPV9bBMZXD13F7ATDt6H
- 文章预览：https://gongchuang.chaohuiwan.com.cn/view/{topicId}
- 健康检查：https://gongchuang.chaohuiwan.com.cn/api/health
- 原 Vercel 项目已不在团队中，新项目使用现有本地源码；未提交或推送 Git。
- Supabase 项目 wvmebfesylhvgyyibysj 已从暂停状态恢复，保留原数据；五张业务表与 materials 存储桶检查通过。
- 四项现有环境变量以加密形式同步至 Vercel Production；密钥未写入源码或部署说明。
- 生产环境数据库故障返回503，不再回退至内存演示数据。回归命令：node scripts/production-database.test.cjs。
- 小程序后端地址已改为上述正式域名。微信端仍需完成域名与隐私配置、版本上传、体验验收和提交审核，以后台结果为准。

## 已完成结果

- Vercel 构建 READY，已执行正式域名提升；通过浏览器确认正式域名的 /api/health 返回 {"ok":true,"database":"connected"}。
- DeepSeek 余额只读接口返回200且 is_available=true，未调用文章生成。
- 微信开发者工具登录正常，预览编译通过。
- AppID wxfd53c8b15bc8fa51 的开发版本 1.1.0 已上传成功，代码包141154字节；尚未提交审核或发布正式版。
- 前端10项回归和生产数据库故障10项回归通过。

## 等待微信后台配置

- request合法域名：https://class-collab-five.vercel.app
- uploadFile合法域名：https://class-collab-five.vercel.app
- downloadFile合法域名：https://wvmebfesylhvgyyibysj.supabase.co
- 若微信后台拒绝上述域名，需要根据实际报错处理或接入用户自有域名，不能通过关闭校验作为正式版方案。
- 开发版本1.1.0设为体验版，并完成真机登录、选图、上传、生成文章与复制验收。
- 检查用户隐私保护指引是否覆盖所用图片选择/上传能力，再完成审核和正式发布。

## 手机网络问题与新域名接入进度

- 用户确认原服务器域名和体验版已设置，但手机浏览器仍无法打开原后端健康检查地址。
- 模拟器健康检查200、登录参数校验400；浏览器使用现有用户验证登录返回200，无新建账号。
- 用户选定 gongchuang.chaohuiwan.com.cn，新域名已绑定 class-collab 项目，所有权验证通过。
- 权威DNS仍在阿里云。待新增 CNAME：主机 gongchuang，记录值 e8b99b2cfcbbb7f9.vercel-dns-017.com，默认线路及TTL。
- 必须在 DNS、HTTPS 及用户手机可达性验证后，才将小程序 baseUrl 改至新域名并上传新版。当前代码仍使用原后端地址，1.1.0体验版未变更。
- 登录页已在本地修正错误反馈，区分域名未生效、超时、安全连接与HTTP错误。回归命令：node scripts/network-errors.test.cjs。

## 自有域名验证与1.1.1修复版

- 用户已在阿里云添加 CNAME；Vercel确认 configuredBy=CNAME、misconfigured=false，无DNS冲突。
- 已为 gongchuang.chaohuiwan.com.cn 签发TLS证书，标准证书校验通过。
- 新域名 /api/health 返回HTTP200、ok=true、database=connected。
- 用户使用此前失败的同一手机确认新域名健康检查正常。
- 小程序 baseUrl 现已切换至 https://gongchuang.chaohuiwan.com.cn，文章预览链接同步使用新域名。
- 本地开发者工具重新启用域名校验，避免模拟器绕过配置而掩盖手机端问题。
- 1.1.1同时包含更准确的登录网络/HTTP错误提示；版本上传及体验版验证结果将在后续补充。
- 微信后台request与uploadFile需添加新域名，旧域名暂保留作过渡；downloadFile仍使用原Supabase域名。

## 1.1.1实际上传结果

- 微信CLI确认1.1.1已上传成功，代码包141774字节。
- 新域名HTTPS证书校验通过，/api/health返回200；使用现有用户通过新域名调用登录接口返回200、ok=true，未创建测试账号。
- 用户已确认微信后台request与uploadFile添加新域名。
- 本轮9项网络错误处理检查与10项原有前端回归通过。
- 当前等待用户将1.1.1设为体验版、完全退出后重新扫码，验证手机登录、文字提交与图片上传。尚未提交正式版审核。

## 1.1.2 多图上传

- 用户已确认1.1.1手机登录、文字提交、单图上传及重新进入后的持久化正常。
- 按用户反馈将单次选图上限改为6张，待提交队列总数限制6张；逐张上传及保存，部分失败不影响其他图片。
- 失败图片保留预览与错误，可移除或重试；已上传但保存失败时复用URL；已成功保存的图片从队列移除，重试不再提交。
- 提交期间锁定选图、移除和重复重试；详情页图片队列可滚动，适配底部输入区。
- 14项前端交互回归、9项网络错误回归以及主题详情WXML/WXSS编译通过。
- 隐私指引状态由用户确认为已填写、正在审核。正式版尚未提审。
