export type ResourceLink = {
  id: string;
  title: string;
  url: string;
  kind: string;
  addedAt: string;
};
export type RecordItem = {
  id: string;
  kind: "resource" | "task" | "schedule" | "project";
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
  resourceIds: string[];
  scheduleIds: string[];
  source: string;
  verified: boolean;
  notes: { text: string; at: string; by: string; url?: string; title?: string; consensus?: string; questions?: string }[];
  links: ResourceLink[];
  hiddenFields?: string[];
  fieldLabels?: Record<string,string>;
  sourceResourceId?: string;
  flightNumber?: string;
  endTime?: string;
  destinationCity?: string;
  travelMode?: string;
  tentative?: boolean;
  internalContact?: boolean;
  projectEnabled?: boolean;
  customFields?: { id: string; label: string; value: string }[];
  contactGroup?: string;
  overviewUrl?: string;
  projectRank?: number;
  revision: number;
};
export const types = ["合作伙伴", "教育院校", "政府国企", "企业品牌", "投融资"];
export const resourceType = (type:string) => (["政府客户","政企客户","政府领导"].includes(type) ? "政府国企" : type === "城市资源" ? "合作伙伴" : type);
export const contactGroup = (r:RecordItem) => r.contactGroup || (r.internalContact ? "内部联系人" : "Genji");
export const projectState = (r:RecordItem) => ["已关闭","已完成"].includes(r.status) ? "已关闭" : ["卡点","停滞"].includes(r.status) ? "卡点" : "正常";
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
export const fresh = (kind: "resource" | "task" | "schedule" | "project"): RecordItem => ({
  id: crypto.randomUUID(),
  kind,
  name: "",
  type: kind === "schedule" ? "日程" : "合作伙伴",
  business: "内容商单",
  priority: "P2",
  contact: "",
  city: "",
  channel: "",
  opportunity: "",
  owner: kind === "schedule" ? "老板" : "我",
  status: kind === "resource" ? "待联系" : "待处理",
  planned: "",
  time: "",
  category: kind === "resource" ? "其他事项" : "其他事项",
  attendees: "",
  topic: "",
  deadline: "",
  resourceId: "",
  resourceIds: [],
  scheduleIds: [],
  source: "手动录入",
  verified: true,
  notes: [],
  links: [],
  revision: 0,
});
