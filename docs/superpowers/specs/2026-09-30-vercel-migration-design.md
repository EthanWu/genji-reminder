# 嘿噗工作台迁移到 Vercel

## 用户目标
将现有项目迁移并部署到 Vercel，模型调用使用 Vercel AI Gateway；单用户使用邮箱验证码登录，唯一允许邮箱为 jiajia@taowhale.com。保留资源、待办、日程、跟进、导入导出和并发版本检查的现有业务行为。

## 推荐架构
- Next.js App Router：将 Vinext/Cloudflare Workers 运行时改为标准 Next.js，使用 Vercel Functions 执行现有 API。
- 数据库：通过 Vercel Marketplace 管理的 Neon Postgres。数据库由 Neon 提供，属于 Vercel 集成生态，并非 Vercel 自研数据库。保持 records 的现有字段和 revision 条件更新语义。
- 登录：Vercel Marketplace 的 Clerk 邮箱验证码登录。只有经过验证的主邮箱 jiajia@taowhale.com 可访问；服务端对页面和 API 均实施邮箱白名单校验。没有密码、公开注册入口或 Vercel 账号登录要求。生产域名通过应用级身份认证保护；预览保留 Vercel 默认部署保护。
- AI：Vercel AI SDK，通过 AI Gateway 生成自然语言草稿及档案问答。部署使用 Vercel OIDC；本地使用拉取的短期 OIDC 或服务端 AI_GATEWAY_API_KEY。模型通过 AI_GATEWAY_MODEL 配置，实施时选择 Gateway 实际可用的文本模型。
- 部署团队：已连接的 Taowhale。新项目名称优先 genji-reminder；如已存在同名项目，先核对所属仓库，避免覆盖其他项目。

## 替代方案及取舍
1. 推荐：Marketplace Neon + Clerk 邮箱验证码。保留 SQL 并发更新能力，登录按用户最新要求限制单邮箱。
2. Marketplace 数据库 + 应用级登录：适合成员不使用 Vercel 账号的场景，但需要额外身份提供方、账号白名单和会话管理，超出现阶段的必要改动。
3. Vercel Blob 保存 JSON：虽为 Vercel 自研存储，但不能直接替代当前 SQL 条件更新与并发语义，本次不采用。

## 实施边界
保留页面布局和功能，仅替换部署、数据和 AI 依赖。清理当前执行路径中的 Cloudflare/Sites/Netlify 部署耦合。替换火山方舟文案及不准确的密钥/模型状态提示。修复阻止标准 Next.js 构建的现有 TypeScript 错误。

所有 API 验证 Clerk 会话与服务端单邮箱白名单；写入 API 检查同源请求。删除依赖客户端可伪造的 oai-authenticated-user 请求头的旧鉴权方式。发布前验证未登录跳转登录页，API 返回 401；已登录非白名单邮箱返回 403。登录页是公开页面，其余业务数据受保护。此边界必须记录在部署文档中。

## 数据迁移
本地 D1 当前仅有首次初始化的 10 条历史线索；仓库另含 2026-09-17 导出的 15 条历史记录，不视为最新线上数据。迁移前备份本地数据库，按当前本地数据库迁移并核对数量和内容；旧导出保留，避免未经核对自动导入并混合数据。无法访问旧线上数据库时明确不声称已迁移线上最新数据。

## 配置和费用
服务端数据库连接字符串由 Marketplace 注入，密钥不入 Git、网页或导出文件。优先选择可用免费数据库套餐，不开启自动充值或升级付费套餐；若平台要求付费购买或额外条款确认，报告具体步骤。AI 调用通过现有团队额度结算，实际验证只做必要的少量请求。

## 验收标准
1. TypeScript、必要的数据库/并发和输入验证测试、Next.js 生产构建通过。
2. 本地浏览器资源/待办/日程页面可用，创建和刷新后持久化，临时测试数据清理。
3. 真实 Gateway 问答和结构化草稿调用成功，错误时保留用户输入；未成功则明确报告，不将配置状态视作验证成功。
4. Vercel 部署达到 Ready；未登录访问业务页面和 API 被保护；通过授权验证数据读写。
5. 交付生产地址、配置/运行说明、迁移数量及明确的未验证项。

## 分阶段顺序
先替换运行时并建立 Postgres 数据访问及回归验证，再接入 Gateway；最后配置 Vercel 项目、数据库和单邮箱验证码登录，部署并验收。不改动旧线上部署。

## 用户后续确认
用户于本次会话确认先使用 Vercel 地址预览，正式域名及 Clerk 正式身份实例稍后配置。当前使用开发实例邮箱验证码登录，服务端邮箱白名单不变。

用户追加授权 wulijun@taowhale.com。最终邮箱名单为 jiajia@taowhale.com,wulijun@taowhale.com，两者共享原工作台，其他邮箱拒绝访问。
