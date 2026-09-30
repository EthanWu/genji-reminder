# Vercel Migration Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline.

**Goal:** Deploy the existing workspace to Vercel with persistent records, AI Gateway and single-email OTP login.
**Architecture:** Standard Next.js App Router, Marketplace Neon Postgres, Marketplace Clerk email code authentication; preserve current client API shapes.
**Tech Stack:** Next.js, Neon serverless driver, Clerk, Vercel AI SDK.
**Spec:** ../specs/2026-09-30-vercel-migration-design.md

## Global Constraints
- Only verified primary email jiajia@taowhale.com may access business pages and APIs.
- No password login requirement, public data access, keys in Git or automatic paid-plan upgrades.
- Preserve records and optimistic revision updates; migrate verified local data, not assumed latest online data.

## Review Focus
- Unauthenticated API access must return 401; another verified email must return 403.
- Same-origin checks must reject cross-origin writes.
- Concurrent saves must produce one winner and one revision conflict.
- AI errors must preserve existing input and expose no credentials.
- Repeated bootstrap must not duplicate or reset records.

### Task 1: Next.js and PostgreSQL
Files: package.json, tsconfig.json, db/index.ts, db/schema.ts, app/api/records/route.ts, app/api/bootstrap/route.ts, scripts/migrate-db.mjs, tests/access.test.ts.
- [x] Preserve local D1 backup and export.
- [x] Replace Cloudflare runtime with Next.js and Neon SQL; retain revision-conditional writes and validation.
- [x] Provision a Vercel project and free Marketplace database, apply schema, import local export without overwrites.
- [x] Verify record create/read/update/conflict/delete and idempotent bootstrap.

### Task 2: Email OTP and AI Gateway
Files: lib/access.ts, lib/auth.ts, app/page.tsx, app/workspace.tsx, app/sign-in/[[...sign-in]]/page.tsx, app/layout.tsx, proxy.ts, app/api/ai/route.ts.
- [x] Write and run access tests for missing session, unverified/wrong email, correct normalized email, and cross-origin writes.
- [x] Provision Clerk through Marketplace; enable email codes and create the single account. Verify server-side identity on every business API/page.
- [x] Replace Ark calls with AI SDK Gateway calls; preserve the ask/draft response contracts and bounded archive retrieval.
- [x] Verify real Gateway ask/draft requests, plus failures and invalid inputs.

### Task 3: Deploy and verify
Files: vercel.json, README.md, .env.example.
- [x] Run typecheck, relevant tests and Next.js build; fix existing build-blocking types.
- [x] Configure server-side environment and deploy to Taowhale.
- [x] Check unauthenticated page/API protection and responsive login in browser; only user can complete delivery of a real email code.
- [x] Verify authenticated database and Gateway where possible, clean temporary records, deliver URL and explicit unresolved requirements.

## 验证结果及边界
Next.js 构建、TypeScript、8 项单元测试通过。Neon 真实 JSON 持久化、并发 revision 冲突、删除保护通过，临时记录清理后 10 条。Gateway 真实简短文本和纯合成结构化输出通过。部署 dpl_F4r1TD59sUwVWZXWVffq8XUCvzRL 为 READY。未登录首页重定向 /sign-in，资源 API 返回401。用户尚未通过收件箱完成验证码登录，因此应用内完整 authenticated API 与 AI 流程仍待验收；此项未标记为已实测。正式身份实例按用户要求延期。
