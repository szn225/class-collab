# 2.5.2 AI 排版联调修复

已更新共用服务并生成匹配测试码 phone-preview.png。微信编译成功，总包939770字节。测试包路径 /private/tmp/hui-miniprogram-2.5.2-eVWr91。

修复根因：旧后端把 kind=layout 请求误当普通生成，因缺少普通生成 mode 字段而报“选材方式无效”。新前端先探测服务能力，旧服务返回明确的版本提示；选材 mode 也规范化为 smart/specified。

新增计费协议只对明确请求新协议或 AI 排版的任务使用按量整数点数；旧客户端沿用既有计费。没有修改全局运营配置或给账户调点。

用户明确授权更新共用服务后：生产修复部署 dpl_Ezr5PGyRrXKiGV5FSsGCn5jaGjsN 构建 READY，随后提升，三个域名映射 completed。服务域名 https://gongchuang-test.chaohuiwan.com.cn 与 https://gongchuang.chaohuiwan.com.cn 已使用修复版。

原部署/回退候选：dpl_BjpGmh97GTCAZwPFVHhqEMWBHd7m。预览部署：dpl_2hWMoQPwqA3bdYPCbA6B1VnbF6xt。构建源为 /private/tmp/hui-v2-device-test，不包含凭据。

实际服务验证：health build=2.5.2、database=connected；旧微信会话仍有效；service.capabilities 返回 aiLayout；普通、附带排版、单独排版三项报价通过，整数价格与正确任务种类匹配。验证前后余额/冻结点数一致，没有启动任务或真实模型调用。接口报价检查创建了三条临时报价记录。

完整付费生成的手机操作仍待用户确认报价后验收，尚未上传小程序开发版本、提审或发布。
