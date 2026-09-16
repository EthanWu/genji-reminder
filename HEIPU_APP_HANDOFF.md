# 嘿噗 · 资源与日程：应用交接与优化说明

## 1. 应用定位

“嘿噗”是一个私人工作空间，用于统一管理外部合作资源、资源跟进、老板待办、个人待办和日程。核心目标是把零散的自然语言记录沉淀为可检索、可编辑、可持续跟进的工作档案。

线上地址：<https://qingyu-resource-workspace.super-jelly-9940.chatgpt.site/>

当前站点为私人访问。应用名称已经从早期名称改为“嘿噗 · 资源与日程”。

## 2. 已实现功能

### 资源库

- 资源/公司名称
- 资源类型：投融资、政府客户、政企客户、企业品牌、政府领导、城市资源、教育院校、合作伙伴
- 业务板块：内容商单、知识付费、文旅大客户、教育产品、数据服务、品牌文化/行政、投融资
- 对接人、城市、来源渠道、负责人
- 最初合作点与合作契机
- 优先级：P0、P1、P2、P3
- 跟进状态与信息核实标记
- 搜索及按类型、业务、优先级筛选
- 资源列表中的查看、编辑、删除

### 资源详情页

每条资源都有独立详情页，包含：

- 完整档案信息
- “编辑全部字段”入口
- 跟进时间线，可追加日期、记录人和反馈
- 关联待办列表
- 外部资料链接，可记录会议纪要、方案文档、合同/报价、聊天记录、网盘资料等
- 外部链接可打开、删除
- 删除资源前二次确认

### 待办与日历

- 老板待办与我的待办分开记录
- 计划日期、硬截止日期、完成状态
- 待办可以关联资源
- 未完成的计划事项会在今日视图继续提示
- 保留原计划日期和硬截止日期，不直接篡改历史数据
- 日历按天展示当前任务

### 自然语言录入

- 可直接输入对话、会议记录、资源线索或任务
- 支持 TXT/MD 文本读取
- AI 先生成待核对草稿，再由用户确认录入
- AI 可以基于相关档案回答问题
- 原始输入保留，模型结果不应被视为已核实事实

## 3. 技术结构

项目采用 React、Vinext、TypeScript、Drizzle ORM 和 Cloudflare D1/Workers。

主要文件：

```text
app/page.tsx              主界面、资源库、详情页、待办、日历、设置
app/globals.css           纪念碑谷风格的蓝绿色视觉与响应式样式
app/api/records/route.ts  资源和待办的增删改查接口
app/api/bootstrap/route.ts首次初始化历史资源
app/api/ai/route.ts       火山方舟自然语言整理和问答接口
lib/model.ts              RecordItem、ResourceLink、类型和业务枚举
lib/validation.ts         Zod 数据校验
lib/seeds.ts              初始历史资源线索
lib/utils.ts               通用工具
```

## 4. 数据模型

资源和待办共用 `RecordItem`：

```ts
type RecordItem = {
  id: string;
  kind: "resource" | "task";
  name: string;
  type: string;
  business: string;
  priority: "P0" | "P1" | "P2" | "P3";
  contact: string;
  city: string;
  channel: string;
  opportunity: string;
  owner: string;
  status: string;
  planned: string;       // YYYY-MM-DD
  deadline: string;      // YYYY-MM-DD
  resourceId: string;    // 待办关联的资源 ID
  source: string;
  verified: boolean;
  notes: { text: string; at: string; by: string }[];
  links: ResourceLink[];
  revision: number;
};

type ResourceLink = {
  id: string;
  title: string;
  url: string;
  kind: string;
  addedAt: string;
};
```

`revision` 用于并发编辑冲突检查。`links` 只接受 `http://` 或 `https://` 链接。

## 5. 火山方舟 API 接入

服务端接口位于 `app/api/ai/route.ts`，调用：

```text
POST https://ark.cn-beijing.volces.com/api/v3/chat/completions
Authorization: Bearer ${ARK_API_KEY}
```

服务端环境变量：

```text
ARK_API_KEY=火山方舟 API Key
ARK_MODEL=已开通的模型 ID 或 ep- 推理接入点 ID
```

密钥只应配置在 Sites 服务端环境变量中，不应写入网页代码、Git、Markdown 备份或 JSON 导出。

当前自然语言录入已经通过真实调用验证成功。后续如果更换模型，只需要修改 `ARK_MODEL`，不需要把密钥暴露到前端。

注意：火山控制台的 AccessKey ID/Secret 是云服务签名凭证，和方舟模型调用使用的 Bearer API Key 不是同一种凭证。

## 6. 接口约定

```text
GET    /api/records       获取资源和待办
POST   /api/records       新建记录
PUT    /api/records       更新记录，需要匹配 revision
DELETE /api/records?id=   删除记录
POST   /api/bootstrap     首次空库初始化历史资源
GET    /api/ai            查看 AI 配置状态
POST   /api/ai            自然语言整理或问答
```

AI 请求体示例：

```json
{
  "text": "明天下午联系某品牌讨论合作",
  "mode": "organize"
}
```

`mode` 可以是 `organize` 或 `ask`。整理结果只进入“待核对”区域，用户确认后才写入正式记录。

## 7. 本地运行与检查

```bash
npm install
npm run dev
npx tsc --noEmit
npm run build
```

生产站点由 Sites 管理。当前发布版本已经通过 TypeScript 检查、生产构建和线上 UI 验收。

## 8. 适合下一平台继续优化的方向

1. 将资源、待办、跟进、外部链接拆成关系型表，支持更强的筛选和统计。
2. 增加字段自定义功能，让用户自行增加资源类型、业务板块、状态和优先级。
3. 增加批量导入、批量编辑、CSV/Excel 导入导出。
4. 增加多人协作、操作日志、角色权限和字段级修改记录。
5. 接入飞书、腾讯会议纪要、Notion、Google Calendar 或企业微信。
6. 增加重复任务、提醒时间、小时级日程和逾期自动提醒。
7. 为 AI 增加向量检索或全文检索，替代当前有限关键词检索。
8. 增加“自然语言修改已有资源”的能力，例如“把南山合作改为 P0，并追加今天的跟进结果”。
9. 增加资源关系图，展示人与公司、城市、业务和待办之间的关联。
10. 增加备份恢复、回收站和删除后的可恢复机制。

## 9. 迁移时的注意事项

- 不要把生产密钥复制到这个文档或公开代码仓库。
- 初始资源来自历史工作记录，部分联系人、城市和状态仍需要人工核实。
- AI 输出是辅助整理结果，涉及人名、关系、合作进度和日期时必须人工确认。
- 迁移到其他平台时，优先保留 `id`、`resourceId`、`revision`、`notes` 和 `links` 字段，避免资源与待办关联丢失。

