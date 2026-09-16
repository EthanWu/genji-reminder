export type ResourceLink = {
  id: string;
  title: string;
  url: string;
  kind: string;
  addedAt: string;
};
export type RecordItem = {
  id: string;
  kind: "resource" | "task";
  name: string;
  type: string;
  business: string;
  priority: string;
  contact: string;
  city: string;
  channel: string;
  opportunity: string;
  owner: string;
  status: string;
  planned: string;
  time: string;
  category: string;
  attendees: string;
  topic: string;
  deadline: string;
  resourceId: string;
  source: string;
  verified: boolean;
  notes: { text: string; at: string; by: string }[];
  links: ResourceLink[];
  revision: number;
};
export const types = [
  "投融资",
  "政府客户",
  "政企客户",
  "企业品牌",
  "政府领导",
  "城市资源",
  "教育院校",
  "合作伙伴",
];
export const businesses = [
  "内容商单",
  "知识付费",
  "文旅大客户",
  "教育产品",
  "数据服务",
  "品牌文化 / 行政",
  "投融资",
];
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const fresh = (kind: "resource" | "task"): RecordItem => ({
  id: crypto.randomUUID(),
  kind,
  name: "",
  type: "合作伙伴",
  business: "内容商单",
  priority: "P2",
  contact: "",
  city: "",
  channel: "",
  opportunity: "",
  owner: "我",
  status: kind === "resource" ? "待联系" : "待处理",
  planned: "",
  time: "",
  category: kind === "resource" ? "其他事项" : "其他事项",
  attendees: "",
  topic: "",
  deadline: "",
  resourceId: "",
  source: "手动录入",
  verified: true,
  notes: [],
  links: [],
  revision: 0,
});
