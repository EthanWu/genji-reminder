# 嘿噗 · 资源与日程

预览地址：https://genji-reminder.vercel.app

当前身份服务使用 Clerk 开发实例，按用户要求先用 Vercel 地址预览；正式身份实例需要后续配置自有域名和 DNS。

私人资源与行动工作台，Next.js + Vercel Functions + Vercel Marketplace Neon Postgres。

- 资源、待办、Genji 日程、跟进时间线、JSON 导入和完整备份导出。
- 数据保存到 Postgres，使用 revision 条件更新处理并发冲突。
- 自然语言草稿和档案问答通过 Vercel AI SDK / AI Gateway 调用，结果需要人工核对。
- 单邮箱验证码登录：Clerk 验证会话，服务端只允许 ALLOWED_EMAIL 对应的已验证主邮箱。每个页面及 API 均校验权限。没有密码登录或公开注册入口。

## Vercel 配置

Vercel 项目：Taowhale / genji-reminder。Neon、Clerk 是 Vercel Marketplace 合作方服务，数据库和身份服务并非 Vercel 自研产品。

1. 将项目连接 Marketplace Neon 和 Clerk。
2. 创建 jiajia@taowhale.com 用户；应用登录页只展示邮箱验证码流程，未提供密码、社交登录或注册入口。正式发布时在 Clerk 中禁用其他登录策略。不需要购买 Clerk 白名单功能，应用自身执行邮箱白名单。
3. 设置服务端 ALLOWED_EMAIL=jiajia@taowhale.com 和 AI_GATEWAY_MODEL=openai/gpt-5-mini。
4. 数据库及 Clerk 环境变量由集成提供。AI Gateway 使用 Vercel OIDC，或服务端 AI_GATEWAY_API_KEY；不使用火山方舟密钥。
5. 拉取环境变量后运行迁移，再构建部署。

```sh
npm ci
npx vercel env pull .env.local --yes --scope taowhale
npm run db:migrate
npm run dev
npm run typecheck
npm test
npm run build
npx vercel --prod --scope taowhale
```

本地地址为 http://localhost:5173（与 Clerk 的回环地址规范化一致）。首次数据迁移可用 `npm run db:migrate -- outputs/local-records-backup.json`；按 ID 跳过已存在记录，不覆盖线上数据。`outputs` 是忽略目录，含迁移前备份，不能上传到公开仓库。

真实数据库验证：`node --env-file=.env.local tests/database.integration.mjs`。

## 边界

本次迁移使用本地 D1 的 10 条初始化资源，不代表旧线上数据库最新状态。仓库中的 data/records-export.json 是旧导出，不自动混入。

桌面通知只在用户点击时发送，未提供关闭网页后的定时推送。日历以天为单位，无重复日程和第三方同步。AI 检索最多 24 条相关档案，不能视作遍历全部档案。

邮箱送达及真正验证码登录必须使用收件箱验证；自动化测试不能替代真实用户验证。
