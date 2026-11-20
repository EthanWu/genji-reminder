"use client";
import { useEffect, useState } from "react";
import { WorkspaceHome } from "@/components/workspace-home";
import { ResourceEditor, ResourceFacts } from "@/components/resource-editor";
import { ProjectBoard } from "@/components/project-board";
import {
  LayoutDashboard,
  Layers3,
  CalendarDays,
  ListTodo,
  Sparkles,
  Plus,
  Search,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Download,
  Upload,
  Clock3,
  Bell,
  Flag,
  Building2,
  Trash2,
  Pencil,
  ExternalLink,
  Link2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RecordItem, fresh, today, types, businesses } from "@/lib/model";
import { seeds } from "@/lib/seeds";
import { statutoryHolidays } from "@/lib/holidays";
import {cityColor, cityForDate, categoryColor as categoryTint} from "@/lib/schedule-colors";
import {contactGroup,resourceType,projectState} from "@/lib/model";
import {localDrafts} from "@/lib/local-capture";
const nav = [
  ["总览", LayoutDashboard],
  ["待办事项", ListTodo],
  ["资源库", Layers3],
  ["Genji日程", Clock3],
  ["项目跟进", Flag],
  ["设置与数据", Settings2],
] as const;
function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (s: string) => void;
  options: string[];
}) {
  return (
    <NativeSelect value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((s) => (
        <NativeSelectOption key={s} value={s}>
          {s || "未指定"}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
function NavButton({
  active,
  go,
  children,
}: {
  active: boolean;
  go: () => void;
  children: React.ReactNode;
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenuButton
      isActive={active}
      onClick={() => {
        go();
        setOpenMobile(false);
      }}
    >
      {children}
    </SidebarMenuButton>
  );
}
function Priority({ p }: { p: string }) {
  return (
    <Badge className={"priority " + p}>
      {p} {p === "P0" ? "最高" : p === "P1" ? "高" : p === "P2" ? "普通" : "低"}
    </Badge>
  );
}
export default function Home() {
  const [view, setView] = useState("总览"),
    [items, setItems] = useState<RecordItem[]>([]),
    [loading, setLoading] = useState(true),
    [err, setErr] = useState(""),
    [toast, setToast] = useState(""),
    [query, setQuery] = useState(""),
    [type, setType] = useState("全部类型"),
    [business, setBusiness] = useState("全部业务"),
    [owner, setOwner] = useState("全部"),
    [priority, setPriority] = useState("全部优先级"),
    [edit, setEdit] = useState<RecordItem | null>(null),
    [detail, setDetail] = useState<RecordItem | null>(null),
    [deleteItem, setDeleteItem] = useState<RecordItem | null>(null),
    [busy, setBusy] = useState(false),
    [note, setNote] = useState(""),
    [followupText, setFollowupText] = useState(""),
    [linkTitle, setLinkTitle] = useState(""),
    [linkUrl, setLinkUrl] = useState(""),
    [linkKind, setLinkKind] = useState("会议纪要"),
    [date, setDate] = useState(today()),
    [month, setMonth] = useState(today().slice(0, 7)),
    [text, setText] = useState(""),
    [drafts, setDrafts] = useState<RecordItem[]>([]),
    [apiReady, setApiReady] = useState(false),
    [aiAnswer, setAiAnswer] = useState(""),
    [who, setWho] = useState("我");
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [sideOpen, setSideOpen] = useState(false);
  const [contactScope, setContactScope] = useState("全部联系人");
  const [addedGroups,setAddedGroups]=useState<string[]>([]);
  const [groupName,setGroupName]=useState<string|null>(null);
  useEffect(()=>{try{const value=JSON.parse(localStorage.getItem("heipu-contact-groups")||"[]");if(Array.isArray(value))setAddedGroups(value.filter(v=>typeof v==="string"))}catch{}},[]);
  const [taskMode, setTaskMode] = useState("list");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const day = today();
  function notify(s: string) {
    setToast(s);
    setTimeout(() => setToast(""), 5000);
  }
  const normalize = (item: RecordItem): RecordItem => ({
    ...item,
    notes: item.notes || [],
    links: item.links || [],
    time: item.time || "",
    category: item.category || "其他事项",
    attendees: item.attendees || "",
    topic: item.topic || "",
    resourceIds: item.resourceIds || (item.resourceId ? [item.resourceId] : []),
    scheduleIds: item.scheduleIds || [],
  });
  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch("/api/records");
      const d = (await r.json()) as { error: string; records: RecordItem[] };
      if (!r.ok) throw Error(d.error);
      setItems(d.records.map(normalize));
      setErr("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetch("/api/bootstrap", { method: "POST" })
      .then(() => refresh())
      .catch(() => refresh());
    fetch("/api/ai")
      .then((r) => r.json() as Promise<{ ready: boolean }>)
      .then((d) => setApiReady(d.ready))
      .catch(() => {});
    const timer = setInterval(() => refresh(), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    setNotificationPermission(Notification.permission);
  }, []);
  const resources = items.filter((i) => i.kind === "resource"),
    tasks = items.filter((i) => i.kind === "task"),
    schedules = items.filter((i) => i.kind === "schedule");
  const groups=[...new Set(["Genji",...addedGroups,...resources.map(contactGroup)])];
  useEffect(() => {
    if (notificationPermission !== "granted") return;
    const check = () => {
      const now = Date.now();
      schedules.forEach((s) => {
        if (!s.planned || !s.time || s.status === "已完成" || s.status === "已取消") return;
        const start = new Date(`${s.planned}T${s.time}:00+08:00`).getTime();
        const remaining = start - now;
        if (remaining <= 30 * 60 * 1000 && remaining > 0) {
          const key = `heipu-schedule-notified:${s.id}:${s.planned}:${s.time}`;
          if (localStorage.getItem(key)) return;
          localStorage.setItem(key, "1");
          new Notification(`Genji日程将在${Math.max(1, Math.round(remaining / 60000))}分钟后开始`, {
            body: `${s.name}${s.city ? ` · ${s.city}` : ""}`,
            tag: key,
          });
        }
      });
    };
    check();
    const timer = window.setInterval(check, 30000);
    return () => window.clearInterval(timer);
  }, [schedules, notificationPermission]);
  async function enableNotifications() {
    if (!("Notification" in window)) {
      notify("当前浏览器不支持桌面通知");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    notify(permission === "granted" ? "桌面通知已开启" : "未获得桌面通知权限");
  }
  const scheduleGroups = Object.entries(
    schedules.reduce<Record<string, RecordItem[]>>((groups, schedule) => {
      const key = schedule.planned || "未安排日期";
      (groups[key] ||= []).push(schedule);
      return groups;
    }, {}),
  ).sort(([a], [b]) => {
    if (a === "未安排日期") return 1;
    if (b === "未安排日期") return -1;
    return a.localeCompare(b);
  });
  const effective = (t: RecordItem) =>
    t.status !== "已完成" && (!t.planned || t.planned < day) ? day : t.planned;
  const activeTasks = tasks.filter((t) => t.status !== "已完成");
  const due = activeTasks.filter(
    (t) => effective(t) === day || (t.deadline && t.deadline <= day),
  );
  const filtered = resources
    .filter(
      (r) =>
        (contactScope === "全部联系人" || contactGroup(r) === contactScope) &&
        (!query ||
          JSON.stringify(r).toLowerCase().includes(query.toLowerCase())) &&
        (type === "全部类型" || resourceType(r.type) === type) &&
        (business === "全部业务" || r.business === business) &&
        (priority === "全部优先级" || r.priority === priority),
    )
    .sort((a, b) => a.priority.localeCompare(b.priority));
  async function save(item: RecordItem, close = true) {
    setBusy(true);
    try {
      const clean = normalize(item);
      const r = await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clean),
        }),
        d = (await r.json()) as { error: string; record: RecordItem };
      if (!r.ok) throw Error(d.error);
      const saved = normalize(d.record);
      setItems((prev) => [saved, ...prev.filter((i) => i.id !== item.id)]);
      if (detail?.id === item.id) setDetail(saved);
      if (item.kind === "resource" && item.projectEnabled) await refresh();
      if (close) setEdit(null);
      notify("已保存");
      return true;
    } catch (e) {
      notify((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function remove(item: RecordItem) {
    setBusy(true);
    try {
      const r = await fetch("/api/records", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, revision: item.revision }),
        }),
        d = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(d.error || "删除失败");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (detail?.id === item.id) {
        setDetail(null);
        setView(
          item.kind === "resource"
            ? "资源库"
            : item.kind === "schedule"
              ? "Genji日程"
              : "待办事项",
        );
      }
      setDeleteItem(null);
      notify("已删除");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function openResource(r: RecordItem) {
    setDetail(normalize(r));
    setNote("");
    setLinkTitle("");
    setLinkUrl("");
    setView("资源详情");
  }
  async function addLink() {
    if (!detail || detail.kind !== "resource") return;
    let parsed: URL;
    try {
      parsed = new URL(linkUrl);
    } catch {
      notify("请输入完整的 http 或 https 链接");
      return;
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      notify("仅支持 http 或 https 链接");
      return;
    }
    const title = linkTitle.trim() || parsed.hostname;
    const updated = {
      ...detail,
      links: [
        ...(detail.links || []),
        {
          id: crypto.randomUUID(),
          title,
          url: parsed.toString(),
          kind: linkKind,
          addedAt: new Date().toISOString(),
        },
      ],
    };
    if (await save(updated, false)) {
      setLinkTitle("");
      setLinkUrl("");
    }
  }
  async function addHistory() {
    setBusy(true);
    let n = 0;
    for (const s of seeds.filter((s) => !items.some((i) => i.id === s.id))) {
      if (await save(s, false)) n++;
      else break;
    }
    setBusy(false);
    notify(`已导入 ${n} 条待核实资源`);
  }
  function createTask(r?: RecordItem) {
    setEdit({
      ...fresh("task"),
      resourceId: r?.id || "",
      business: r?.business || "内容商单",
      priority: r?.priority || "P2",
      planned: day,
    });
  }
  function moveMonth(delta: number) {
    const d = new Date(month + "-01T12:00:00");
    d.setMonth(d.getMonth() + delta);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  async function ai(mode = "extract") {
    if(!apiReady && mode==="extract"){setDrafts(localDrafts(text,day));return}

    setBusy(true);
    setAiAnswer("");
    try {
      const r = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, mode }),
        }),
        d = (await r.json()) as {
          error: string;
          answer: string;
          records: Partial<RecordItem>[];
        };
      if (!r.ok) throw Error(d.error);
      if (mode === "ask") setAiAnswer(d.answer);
      else
        setDrafts(
          d.records.map((x: Partial<RecordItem>) => ({
            ...fresh(
              x.kind === "task"
                ? "task"
                : x.kind === "schedule"
                  ? "schedule"
                  : "resource",
            ),
            ...x,
            id: crypto.randomUUID(),
            revision: 0,
            verified: false,
            source: "自然语言输入 · " + day,
            notes: [
              {
                text: "原始输入：" + text,
                at: new Date().toISOString(),
                by: who || "我",
              },
            ],
          })),
        );
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          { version: 1, exportedAt: new Date().toISOString(), records: items },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "嘿噗备份-" + day + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 3000000) throw Error("请选择 3MB 以内的文件");
      const content = await file.text();
      if (file.name.endsWith(".json")) {
        const data = JSON.parse(content);
        const list = Array.isArray(data) ? data : data.records;
        if (!Array.isArray(list)) throw Error("文件需包含 records 数组");
        setDrafts(
          list.slice(0, 100).map((x) => ({
            ...fresh(
              x.kind === "task"
                ? "task"
                : x.kind === "schedule"
                  ? "schedule"
                  : "resource",
            ),
            ...x,
            id: crypto.randomUUID(),
            revision: 0,
            verified: false,
            source: "文件导入 · " + file.name,
          })),
        );
        notify("已读取为草稿，核对后保存");
      } else {
        setText(content);
        notify("已读取文本，可交给火山方舟整理");
      }
      setView("总览");
    } catch (e) {
      notify((e as Error).message);
    }
  }
  const taskRows = (list: RecordItem[]) =>
    list.length ? (
      <div className="tasklist">
        {[...list]
          .sort(
            (a, b) =>
              ({ P0: 0, P1: 1, P2: 2, P3: 3 }[a.priority] ?? 9) -
                ({ P0: 0, P1: 1, P2: 2, P3: 3 }[b.priority] ?? 9) ||
              (a.time ? 0 : 1) - (b.time ? 0 : 1) ||
              a.time.localeCompare(b.time),
          )
          .map((t) => (
            <div
              className={
                "taskrow " + (t.status === "已完成" ? "completed" : "")
              }
              key={t.id}
            >
              <Checkbox
                aria-label={"完成 " + t.name}
                checked={t.status === "已完成"}
                disabled={busy}
                onCheckedChange={(c) =>
                  save({ ...t, status: c ? "已完成" : "待处理" }, false)
                }
              />
              <button
                className="taskname"
                onClick={() => {
                  setDetail(t);
                  setNote("");
                }}
              >
                <strong>
                  {t.time ? `${t.time} ` : "待定 "}
                  {t.name}
                </strong>
                <div className="taskmeta">
                  <span>
                    {t.owner === "老板"
                      ? "Genji"
                      : t.owner === "乔伊"
                        ? "乔伊"
                        : "珈珈"}{" "}
                    · {t.category || "其他事项"}
                    {t.time && ` · ${t.time}`}
                  </span>
                  {t.topic && (
                    <span>
                      <b>议题</b>：{t.topic}
                    </span>
                  )}
                  {t.attendees && (
                    <span>
                      <b>参会人员</b>：{t.attendees}
                    </span>
                  )}
                  {(t.resourceIds?.length || t.resourceId) && (
                    <span><b>关联资源</b>：{(t.resourceIds?.length ? t.resourceIds : [t.resourceId]).map((id) => resources.find((r) => r.id === id)?.name).filter(Boolean).join("、")}</span>
                  )}
                  {t.scheduleIds?.length > 0 && (
                    <span><b>关联日程</b>：{t.scheduleIds.map((id) => schedules.find((s) => s.id === id)?.name).filter(Boolean).join("、")}</span>
                  )}
                  {t.deadline && (
                    <span className={t.deadline < day ? "late" : ""}>
                      截止 {t.deadline}
                    </span>
                  )}
                  {t.planned && t.planned < day && t.status !== "已完成" && (
                    <span className="late">已顺延至今天</span>
                  )}
                </div>
              </button>
              <Priority p={t.priority} />
              <Button
                variant="ghost"
                size="icon"
                className="task-delete"
                aria-label={`删除 ${t.name}`}
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteItem(t);
                }}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
      </div>
    ) : (
      <div className="empty">
        这里还没有待办
        <Button variant="outline" onClick={() => createTask()}>
          <Plus size={16} /> 添加一件事
        </Button>
      </div>
    );
  return (
    <SidebarProvider>
      <main className={`app-main studio-shell ${view === "总览" ? "is-home" : ""}`}>
        <header className="topbar">
          <div className="top-crumb">
            <button className="studio-brand" onClick={()=>setView("总览")}><span>◈</span> 嘿噗 <small>HEIPU</small></button>
          </div>
          <nav className="studio-nav">{nav.filter(([n])=>n!=="总览").map(([n])=><button key={n} className={view===n?"active":""} onClick={()=>{setView(n);setQuery("");}}>{n==="Genji日程"?"日程管理":n==="资源库"?"资源清单":n}</button>)}</nav>
          <div className="top-actions">
            <span>{day.replaceAll("-", ".")}</span>
            <button
              aria-label="查看今日提醒"
              onClick={() => {
                setView("总览");
                notify(
                  `今日 ${due.length} 项待处理，老板 ${due.filter((t) => t.owner === "老板").length} 项`,
                );
              }}
            >
              <Bell size={19} />
              {due.length > 0 && <i />}
            </button>
            <span className="avatar">珈</span>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {view === "总览" ? "YOUR DAILY COMPASS" : "HEIPU WORKSPACE"}
              </div>
              <h1>
                {view === "总览"
                  ? "把连接，变成下一步。"
                  : view === "资源详情" && detail
                    ? detail.name
                    : view === "Genji日程" ? "日程管理" : view === "资源库" ? "资源清单" : view}
              </h1>
              <p>
                {view === "总览"
                  ? "资源有脉络，跟进有回应，每一天都有方向。"
                  : view === "资源库"
                    ? "从第一次相识，到每一次合作。"
                    : view === "资源详情"
                      ? "完整档案、跟进情况、关联待办与外部资料。"
                      : view === "待办事项"
                        ? "明确负责人，保留反馈，让每件事都有着落。"
                        : view === "Genji日程"
                          ? "Genji 的独立日程表，支持列表与日历两种视图。"
                          : view === "日历"
                            ? "看见老板与自己的安排。未完成事项按计划顺延，截止时间保持不变。"
                            : view === "自然语言录入"
                              ? "随手记下对话、资源和安排，核对后沉淀为档案。"
                              : view === "项目跟进" ? "把进展串成时间线，让资料与每一步同行。" : "管理数据备份、历史导入与 AI 连接。"}
              </p>
            </div>
            {view === "资源详情" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setView("资源库");
                  setDetail(null);
                }}
              >
                <ArrowLeft size={17} /> 返回资源库
              </Button>
            ) : (
              <Button
                onClick={() =>
                  view === "项目跟进" ? setEdit(fresh("project")) : view === "待办事项" || view === "日历"
                    ? createTask()
                    : view === "Genji日程"
                      ? setEdit(fresh("schedule"))
                      : setEdit({...fresh("resource"),contactGroup:contactScope==="全部联系人"?"Genji":contactScope})
                }
              >
                <Plus size={17} />{" "}
                {view === "项目跟进" ? "新建项目" : view === "待办事项" || view === "日历"
                  ? "新建待办"
                  : view === "Genji日程"
                    ? "新增日程"
                    : "添加资源"}
              </Button>
            )}
          </div>
          {err && (
            <div className="notice error">
              {err}
              <Button variant="outline" onClick={refresh}>
                重试
              </Button>
            </div>
          )}
          {toast && (
            <div role="status" className="toast">
              {toast}
            </div>
          )}
          {loading && items.length === 0 && (
            <div className="notice">正在读取工作空间…</div>
          )}
          {view === "总览" && <WorkspaceHome items={items} due={due} day={day} go={setView}/>}
          {view === "项目跟进" && <ProjectBoard items={items} save={save} edit={setEdit} remove={setDeleteItem}/>}
          {view === "资源库" && (
            <section className="panel">
              <div className="filters">
                <div className="search">
                  <Search size={17} />
                  <Input
                    aria-label="搜索资源"
                    placeholder="搜索公司、联系人、城市或合作契机"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Select value={contactScope} onChange={value=>value==="＋ 新建联系人归属"?setGroupName(""):setContactScope(value)} options={["全部联系人", ...groups, "＋ 新建联系人归属"]}/>
                <Dialog open={groupName!==null} onOpenChange={open=>{if(!open)setGroupName(null)}}><DialogContent><DialogTitle>新建联系人归属</DialogTitle><DialogDescription>用于归类和筛选资源对接关系。</DialogDescription><form onSubmit={e=>{e.preventDefault();const name=groupName?.trim();if(!name||["全部联系人","＋ 新建联系人归属"].includes(name))return;const next=[...new Set([...addedGroups,name])];setAddedGroups(next);try{localStorage.setItem("heipu-contact-groups",JSON.stringify(next))}catch{}setContactScope(name);setGroupName(null)}}><Input aria-label="联系人归属名称" required maxLength={100} value={groupName||""} onChange={e=>setGroupName(e.target.value)}/><Button type="submit">添加</Button></form></DialogContent></Dialog>
                <Select
                  value={type}
                  onChange={setType}
                  options={["全部类型", ...new Set([...types,...resources.map(r=>resourceType(r.type)).filter(Boolean)])]}
                />
                <Select
                  value={business}
                  onChange={setBusiness}
                  options={["全部业务", ...new Set([...businesses,...resources.map(r=>r.business).filter(Boolean)])]}
                />
                <Select
                  value={priority}
                  onChange={setPriority}
                  options={["全部优先级", "P0", "P1", "P2", "P3"]}
                />
              </div>
              <div className="table-count">
                {filtered.length} 条资源 · 每条都可查看、编辑或删除
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    {[
                      "资源 / 公司",
                      "类型与业务",
                      "对接人",
                      "优先级",
                      "操作",
                    ].map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <button
                          className="resource-name"
                          title="点击编辑资源档案" onClick={() => setEdit(normalize(r))}
                        >
                          {r.name}
                          {r.customFields?.slice(0,2).map(f=><small key={f.id}>{f.label}：{f.value||"未填写"}</small>)}
                          <small>{!r.hiddenFields?.includes("city")&&(r.city || "城市待补充")} · {contactGroup(r)}</small>
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{resourceType(r.type)}</Badge>
                        <small>{r.business}</small>
                      </TableCell>
                      <TableCell>{r.hiddenFields?.includes("contact")?"—":r.contact || "待补充"}</TableCell>

                      <TableCell>
                        <Priority p={r.priority} />
                      </TableCell>

                      <TableCell>
                        <div className="row-actions">
                          <button
                            aria-label={"查看" + r.name}
                            onClick={() => openResource(r)}
                          >
                            <ArrowUpRight size={17} />
                          </button>
                          <button
                            aria-label={"编辑" + r.name}
                            onClick={() => setEdit(normalize(r))}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="danger-icon"
                            aria-label={"删除" + r.name}
                            onClick={() => setDeleteItem(r)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!filtered.length && (
                <div className="empty">
                  没有匹配的资源，可添加资源或调整筛选。
                </div>
              )}
            </section>
          )}
          {view === "资源详情" && detail?.kind === "resource" && (
            <div className="resource-detail-page">
              <section className="panel detail-summary">
                <div className="detail-toolbar">
                  <div className="detail-tags">
                    <Priority p={detail.priority} />
                    <Badge variant="secondary">
                      {detail.verified ? detail.status : "待核实"}
                    </Badge>
                    <Badge variant="secondary">{detail.type}</Badge>
                    <Badge variant="secondary">{detail.business}</Badge>
                  </div>
                  <div className="inline">
                    <Button
                      variant="outline"
                      onClick={() => setEdit(normalize(detail))}
                    >
                      <Pencil size={16} /> 编辑全部字段
                    </Button>
                    <Button onClick={() => createTask(detail)}>
                      <Plus size={16} /> 新建关联待办
                    </Button>
                    <Button
                      variant="outline"
                      className="danger-button"
                      onClick={() => setDeleteItem(detail)}
                    >
                      <Trash2 size={16} /> 删除资源
                    </Button>
                  </div>
                </div>
                <ResourceFacts item={detail}/>
                {detail.projectEnabled && <Button variant="outline" onClick={()=>setView("项目跟进")}>查看流转项目 →</Button>}
              </section>
              <div className="detail-columns">
                <section className="panel">
                  <div className="panel-head">
                    <h2>
                      跟进时间线 <span>{detail.notes?.length || 0}</span>
                    </h2>
                  </div>
                  <Textarea
                    placeholder="记录本次沟通、结论、阻碍与下一步……"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="followup-actions">
                    <span>记录人：{who || "我"}</span>
                    <Button
                      disabled={busy || !note.trim()}
                      onClick={async () => {
                        if (
                          await save(
                            {
                              ...detail,
                              notes: [
                                ...(detail.notes || []),
                                {
                                  text: note.trim(),
                                  at: new Date().toISOString(),
                                  by: who || "我",
                                },
                              ],
                            },
                            false,
                          )
                        )
                          setNote("");
                      }}
                    >
                      追加跟进
                    </Button>
                  </div>
                  <div className="timeline">
                    {[...(detail.notes || [])].reverse().map((n, i) => (
                      <div key={i}>
                        <small>
                          {new Date(n.at).toLocaleString("zh-CN", {
                            timeZone: "Asia/Shanghai",
                          })}{" "}
                          · {n.by}
                        </small>
                        <p>{n.text}</p>
                      </div>
                    ))}
                    {!detail.notes?.length && (
                      <div className="empty compact">还没有跟进记录。</div>
                    )}
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-head">
                    <h2>
                      外部资料 <span>{detail.links?.length || 0}</span>
                    </h2>
                  </div>
                  <p className="section-help">
                    可链接飞书、腾讯文档、Notion、网盘、会议纪要或合同页面。
                  </p>
                  <div className="link-form">
                    <Input
                      aria-label="资料名称"
                      placeholder="资料名称，例如：9月项目会议纪要"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                    />
                    <Select
                      value={linkKind}
                      onChange={setLinkKind}
                      options={[
                        "会议纪要",
                        "方案文档",
                        "合同 / 报价",
                        "聊天记录",
                        "网盘资料",
                        "其他链接",
                      ]}
                    />
                    <Input
                      aria-label="资料链接"
                      placeholder="https://..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                    <Button
                      disabled={busy || !linkUrl.trim()}
                      onClick={addLink}
                    >
                      <Link2 size={16} /> 添加链接
                    </Button>
                  </div>
                  <div className="link-list">
                    {(detail.links || []).map((link) => (
                      <div key={link.id} className="link-item">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>
                            <b>{link.title}</b>
                            <small>
                              {link.kind} ·{" "}
                              {new Date(link.addedAt).toLocaleDateString(
                                "zh-CN",
                              )}
                            </small>
                          </span>
                          <ExternalLink size={17} />
                        </a>
                        <button
                          aria-label={"删除链接" + link.title}
                          onClick={() =>
                            save(
                              {
                                ...detail,
                                links: detail.links.filter(
                                  (x) => x.id !== link.id,
                                ),
                              },
                              false,
                            )
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                    {!detail.links?.length && (
                      <div className="empty compact">还没有外部资料。</div>
                    )}
                  </div>
                </section>
              </div>
              <section className="panel">
                <div className="panel-head">
                  <h2>
                    关联待办{" "}
                    <span>
                      {tasks.filter((t) => t.resourceId === detail.id).length}
                    </span>
                  </h2>
                  <Button variant="outline" onClick={() => createTask(detail)}>
                    <Plus size={16} /> 添加待办
                  </Button>
                </div>
                <div className="association-pickers">
                  <NativeSelect
                    value=""
                    onChange={(e) => {
                      const task = tasks.find((t) => t.id === e.target.value);
                      if (task) save({ ...task, resourceId: detail.id, resourceIds: Array.from(new Set([...(task.resourceIds || []), detail.id])) }, false);
                    }}
                  >
                    <NativeSelectOption value="">选择已有待办进行关联</NativeSelectOption>
                    {tasks.filter((t) => t.resourceId !== detail.id).map((t) => (
                      <NativeSelectOption key={t.id} value={t.id}>{t.name}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <NativeSelect
                    value=""
                    onChange={(e) => {
                      const schedule = schedules.find((s) => s.id === e.target.value);
                      if (schedule) save({ ...schedule, resourceId: detail.id, resourceIds: Array.from(new Set([...(schedule.resourceIds || []), detail.id])) }, false);
                    }}
                  >
                    <NativeSelectOption value="">选择已有日程进行关联</NativeSelectOption>
                    {schedules.filter((s) => s.resourceId !== detail.id).map((s) => (
                      <NativeSelectOption key={s.id} value={s.id}>{s.name}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                {taskRows(tasks.filter((t) => t.resourceId === detail.id || t.resourceIds?.includes(detail.id)))}
              </section>
              <section className="panel">
                <div className="panel-head">
                  <h2>
                    关联日程 <span>{schedules.filter((s) => s.resourceId === detail.id).length}</span>
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setEdit({ ...fresh("schedule"), resourceId: detail.id })
                    }
                  >
                    <Plus size={16} /> 添加日程
                  </Button>
                </div>
                <div className="linked-schedule-list">
                  {schedules
                    .filter((s) => s.resourceId === detail.id || s.resourceIds?.includes(detail.id))
                    .sort((a, b) => `${a.planned} ${a.time}`.localeCompare(`${b.planned} ${b.time}`))
                    .map((s) => (
                      <button className="linked-schedule-item" key={s.id} onClick={() => setEdit(s)}>
                        <span className="linked-schedule-time">{s.planned || "未安排日期"} · {s.time || "未定时间"}</span>
                        <strong>{s.name}</strong>
                        <small>{s.category} · {[s.destinationCity,s.city].filter(Boolean).join(" · ") || "地点待补充"}</small>
                      </button>
                    ))}
                  {!schedules.some((s) => s.resourceId === detail.id || s.resourceIds?.includes(detail.id)) && (
                    <div className="empty compact">还没有关联日程，可从这里直接添加。</div>
                  )}
                </div>
              </section>
            </div>
          )}
          {view === "Genji日程" && (
            <section className="panel">
              <div className="schedule-legend">{["线上会议","线下会议","直播演讲","拍摄录制","差旅行程","其他活动"].map(c=><span key={c}><i style={{background:categoryTint(c)}}/>{c}</span>)}<span className="tentative-legend">◌ 待定</span></div>
              <div className="filters">
                <button className="calendar-toggle" aria-expanded={calendarOpen} onClick={()=>setCalendarOpen(!calendarOpen)}>{calendarOpen?"收起月历":"展开月历"}</button>
                {notificationPermission !== "unsupported" && (
                  <Button
                    variant={notificationPermission === "granted" ? "secondary" : "outline"}
                    onClick={enableNotifications}
                  >
                    <Bell size={16} />
                    {notificationPermission === "granted" ? "桌面通知已开启" : "开启桌面通知"}
                  </Button>
                )}
              </div>
              {calendarOpen && (
                <div className={"calendar-layout schedule-month "+(!sideOpen?"expanded":"")}>
                  <section className="panel">
                    <div className="panel-head">
                      <h2>{month.replace("-", " 年 ")} 月</h2>
                      <div className="inline calendar-tools"><button aria-controls="schedule-day-details" aria-expanded={sideOpen} onClick={()=>setSideOpen(open=>!open)}>{sideOpen?"收起侧边栏":"展开侧边栏"}</button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => moveMonth(-1)}
                        >
                          <ChevronLeft />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setMonth(day.slice(0, 7));
                            setDate(day);
                          }}
                        >
                          今天
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => moveMonth(1)}
                        >
                          <ChevronRight />
                        </Button>
                      </div>
                    </div>
                    <div className="calendar-grid">
                      {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
                        <div className="weekday" key={d}>
                          {d}
                        </div>
                      ))}
                      {Array.from(
                        {
                          length:
                            (new Date(month + "-01T12:00:00").getDay() + 6) % 7,
                        },
                        (_, i) => (
                          <div key={"blank-s" + i} />
                        ),
                      )}
                      {Array.from(
                        {
                          length: new Date(
                            Number(month.slice(0, 4)),
                            Number(month.slice(5)),
                            0,
                          ).getDate(),
                        },
                        (_, i) => {
                          const d =
                              month + "-" + String(i + 1).padStart(2, "0"),
                            ss = schedules.filter((s) => s.planned === d);
                          return (
                            <button
                              className={
                                "day " +
                                (statutoryHolidays[d] ? "holiday " : "") +
                                (d === date ? "selected " : "") +
                                (d === day ? "today" : "")
                              }
                              style={cityForDate(schedules,d) && cityForDate(schedules,d)!=="厦门" ? {background:cityColor(cityForDate(schedules,d))}:undefined}
                              title={cityForDate(schedules,d) || "未标记城市"}
                              key={d}
                              onClick={() => setDate(d)}
                            >
                              <b>{i + 1}</b>
                              {cityForDate(schedules,d) && cityForDate(schedules,d)!=="厦门" && <small className="city-label">{cityForDate(schedules,d)}</small>}
                              {statutoryHolidays[d] && <small className="holiday-label">{statutoryHolidays[d]}</small>}
                              {ss.sort((a,b)=>(a.time||"99:99").localeCompare(b.time||"99:99")).slice(0, sideOpen ? 3 : undefined).map((s) => (
                                <span style={{borderLeft: `3px solid ${categoryTint(s.category)}`, color: s.tentative ? "#a27799" : undefined}} key={s.id} className={`boss ${s.status === "已完成" ? "calendar-completed" : ""}`}>
                                  {s.tentative ? "待定 · " : ""}{s.time ? s.time + (s.endTime?"–"+s.endTime:"") + " " : "未定时间 "}
                                  {s.name}
                                </span>
                              ))}
                              {sideOpen && ss.length>3 && <small>另有 {ss.length-3} 项</small>}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </section>
                  <section className="panel" id="schedule-day-details">
                    <div className="panel-head">
                      <h2>{date.slice(5).replace("-", " 月 ")} 日</h2>
                      <Button
                        size="icon"
                        onClick={() =>
                          setEdit({ ...fresh("schedule"), planned: date })
                        }
                      >
                        <Plus />
                      </Button>
                    </div>
                    {schedules
                      .filter((s) => s.planned === date)
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((s) => (
                        <article
                          className={`schedule-card ${s.tentative ? "tentative-event" : ""}`} style={{borderLeft: `4px solid ${categoryTint(s.category)}`}}
                          key={s.id}
                          onClick={() => setEdit(s)}
                        >
                          <div className={`schedule-time ${s.status === "已完成" ? "schedule-completed" : ""}`}>
                            <Checkbox
                              aria-label={`完成 ${s.name}`}
                              checked={s.status === "已完成"}
                              disabled={busy}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={(c) => save({ ...s, status: c ? "已完成" : "待确认" }, false)}
                            />
                            {s.time || "未定时间"} · {s.name}
                          </div>
                          <div className="schedule-meta">
                            <span style={{color:categoryTint(s.category)}} className={`schedule-kind schedule-kind-${s.category}`}>{s.category}</span>
                            <span className="schedule-location">{[s.destinationCity,s.city].filter(Boolean).join(" · ") || "地点待补充"}</span>
                          </div>
                          {s.topic && (
                            <p>
                              <b>议题/主题：</b>
                              {s.topic}
                            </p>
                          )}
                          {s.attendees && (
                            <p>
                              <b>参会人员：</b>
                              {s.attendees}
                            </p>
                          )}
                          <button className="side-delete" onClick={e=>{e.stopPropagation();setDeleteItem(s)}}><Trash2 size={14}/> 删除</button>
                        </article>
                      ))}
                  </section>
                </div>
              )}
                <div className="schedule-list">
                  {scheduleGroups.map(([dateKey, group]) => {
                    const visibleGroup = group
                      .filter((s) => s.status !== "已完成")
                      .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
                    if (!visibleGroup.length) return null;
                    return (
                    <section className="schedule-day-group" key={dateKey}>
                      <div className="schedule-day-heading">
                        <span>{dateKey === "未安排日期" ? dateKey : `${dateKey.slice(5)} · ${new Date(`${dateKey}T12:00:00`).toLocaleDateString("zh-CN", { weekday: "long" })}`}</span>
                        <b>{visibleGroup.length} 项</b>
                      </div>
                      <div className="schedule-day-items">
                        {visibleGroup.map((s) => (
                          <article
                            className={`schedule-card ${s.tentative ? "tentative-event" : ""}`} style={{borderLeft: `4px solid ${categoryTint(s.category)}`}}
                            key={s.id}
                            onClick={() => setEdit(s)}
                          >
                            <div className="schedule-time">
                              <Checkbox
                                aria-label={`完成 ${s.name}`}
                                checked={s.status === "已完成"}
                                disabled={busy}
                                onClick={(e) => e.stopPropagation()}
                                onCheckedChange={(c) => save({ ...s, status: c ? "已完成" : "待确认" }, false)}
                              />
                              {s.planned || "未安排日期"} · {s.time || "未定时间"}{s.endTime ? ` — ${s.endTime}` : ""}
                            </div>
                            <h3>{s.tentative && "待定 · "}{s.name}</h3>
                            <div className="schedule-meta">
                              <span style={{color:categoryTint(s.category)}} className={`schedule-kind schedule-kind-${s.category}`}>{s.category}</span>
                              <span className="schedule-location">{[s.destinationCity,s.city].filter(Boolean).join(" · ") || "地点待补充"}</span>
                            </div>
                            {s.category === "差旅行程" && <p>{s.travelMode||"出行方式待补充"} · {s.flightNumber||"班次待补充"}</p>}
                            {s.topic && (
                              <p><b>议题/主题：</b>{s.topic}</p>
                            )}
                            {s.attendees && (
                              <p><b>参会人员：</b>{s.attendees}</p>
                            )}
                            <div className="schedule-card-footer">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteItem(s);
                                }}
                              >
                                <Trash2 size={15} /> 删除
                              </Button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                    );
                  })}
                </div>
            </section>
          )}
          {view === "待办事项" && (
            <section className="panel">
              <div className="filters">
                <Tabs value={taskMode} onValueChange={setTaskMode}>
                  <TabsList>
                    <TabsTrigger value="list">列表视图</TabsTrigger>
                    <TabsTrigger value="calendar">日历视图</TabsTrigger>
                  </TabsList>
                </Tabs>
                {taskMode === "list" && (
                <>
                <Tabs value={owner} onValueChange={setOwner}>
                  <TabsList>
                    {["全部", "老板", "我", "乔伊"].map((o) => (
                      <TabsTrigger value={o} key={o}>
                        {o === "我"
                          ? "珈珈待办"
                          : o === "老板"
                            ? "Genji待办"
                            : o}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <div className="search">
                  <Search size={17} />
                  <Input
                    placeholder="搜索待办"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                </>
                )}
              </div>
              {taskMode === "list" && (
              ["今日与逾期", "未来计划", "长期 / 未排期", "已完成"].map(
                (group, i) => {
                  const list = tasks.filter(
                    (t) =>
                      (owner === "全部" || t.owner === owner) &&
                      t.name.includes(query) &&
                      (i === 3
                        ? t.status === "已完成"
                        : t.status !== "已完成" &&
                          (i === 0
                            ? effective(t) === day ||
                              (!!t.deadline && t.deadline <= day)
                            : i === 1
                              ? effective(t) > day &&
                                (!t.deadline || t.deadline > day)
                              : !t.planned &&
                                (!t.deadline || t.deadline > day))),
                  );
                  return (
                    <div className="taskgroup" key={group}>
                      <h3>
                        {group}
                        <span>{list.length}</span>
                      </h3>
                      {taskRows(list)}
                    </div>
                  );
                },
              )
              )}
            </section>
          )}
          {view === "待办事项" && taskMode === "calendar" && (
            <div className="calendar-layout">
              <section className="panel">
                <div className="panel-head">
                  <h2>{month.replace("-", " 年 ")} 月</h2>
                  <div className="inline">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="上个月"
                      onClick={() => moveMonth(-1)}
                    >
                      <ChevronLeft />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMonth(day.slice(0, 7));
                        setDate(day);
                      }}
                    >
                      今天
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="下个月"
                      onClick={() => moveMonth(1)}
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
                <Tabs value={owner} onValueChange={setOwner}>
                  <TabsList>
                    {["全部", "老板", "我", "乔伊"].map((o) => (
                      <TabsTrigger key={o} value={o}>
                        {o}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <div className="calendar-grid">
                  {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
                    <div className="weekday" key={d}>
                      {d}
                    </div>
                  ))}
                  {Array.from(
                    {
                      length:
                        (new Date(month + "-01T12:00:00").getDay() + 6) % 7,
                    },
                    (_, i) => (
                      <div key={"blank" + i} />
                    ),
                  )}
                  {Array.from(
                    {
                      length: new Date(
                        Number(month.slice(0, 4)),
                        Number(month.slice(5)),
                        0,
                      ).getDate(),
                    },
                    (_, i) => {
                      const d = month + "-" + String(i + 1).padStart(2, "0"),
                        ts = tasks
                          .filter(
                            (t) =>
                              (owner === "全部" || t.owner === owner) &&
                              (effective(t) === d || t.deadline === d),
                          )
                          .sort(
                            (a, b) =>
                              (a.time ? 0 : 1) - (b.time ? 0 : 1) ||
                              a.time.localeCompare(b.time),
                          );
                      return (
                        <button
                          className={
                            "day " +
                            (statutoryHolidays[d] ? "holiday " : "") +
                            (d === date ? "selected " : "") +
                            (d === day ? "today" : "")
                          }
                          key={d}
                          onClick={() => setDate(d)}
                        >
                          <b>{i + 1}</b>
                          {statutoryHolidays[d] && <small className="holiday-label">{statutoryHolidays[d]}</small>}
                          {ts.slice(0, 3).map((t) => (
                            <span
                              className={t.owner === "老板" ? "boss" : ""}
                              key={t.id}
                            >
                              {t.time ? `${t.time} ` : "待定 "}
                              {t.name}
                            </span>
                          ))}
                          {ts.length > 3 && (
                            <small>还有 {ts.length - 3} 项</small>
                          )}
                        </button>
                      );
                    },
                  )}
                </div>
              </section>
              <section className="panel">
                <div className="panel-head">
                  <h2>{date.slice(5).replace("-", " 月 ")} 日</h2>
                  <Button
                    size="icon"
                    aria-label="为选中日期添加待办"
                    onClick={() => setEdit({ ...fresh("task"), planned: date })}
                  >
                    <Plus />
                  </Button>
                </div>
                {taskRows(
                  tasks.filter(
                    (t) =>
                      (owner === "全部" || t.owner === owner) &&
                      (effective(t) === date || t.deadline === date),
                  ),
                )}
              </section>
            </div>
          )}
          {view === "总览" && (
            <div className="ingest-grid">
              <section className="panel">
                <div className="panel-head">
                  <h2>
                    <Sparkles size={21} /> 自然语言录入
                  </h2>
                  <Badge variant="secondary">
                    {apiReady ? "火山方舟 · 已配置" : "本地草稿模式"}
                  </Badge>
                </div>
                <Textarea
                  className="capture"
                  placeholder={
                    "例如：明天下午三点 Genji 与文旅团队开线上会议。\n待办：珈珈周五前准备合作方案。"
                  }
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <div className="capture-actions">
                  <label className="file-button">
                    <Upload size={16} /> 读取文件
                    <input
                      type="file"
                      accept=".txt,.md,.json"
                      onChange={(e) => importFile(e.target.files?.[0])}
                    />
                  </label>
                  <Button
                    disabled={busy || !text.trim()}
                    onClick={() => ai()}
                  >
                    整理成草稿 <ArrowUpRight size={16} />
                  </Button>
                </div>
                {!apiReady && (
                  <p className="helper">
                    每行一件事，可用“日程：”“待办：”“资源：”或“项目：”开头。核对草稿后保存。
                  </p>
                )}
                <div className="ask-row" hidden={!apiReady}>
                  <Button
                    variant="outline"
                    disabled={!apiReady || busy || !text.trim()}
                    onClick={() => ai("ask")}
                  >
                    根据已有档案回答这段问题
                  </Button>
                </div>
                {aiAnswer && <div className="answer">{aiAnswer}</div>}
              </section>
              <section className="panel" hidden={!drafts.length}>
                <div className="panel-head">
                  <h2>
                    待核对 <span>{drafts.length}</span>
                  </h2>
                </div>
                {drafts.length ? (
                  drafts.map((d, i) => (
                    <div className="draft" key={d.id}>
                      <Badge variant="secondary">
                        {{resource:"资源",task:"待办",schedule:"日程",project:"项目"}[d.kind]}
                      </Badge>
                      <h3>{d.name}</h3>
                      <p>{d.opportunity || d.business}</p>
                      <div className="inline">
                        <Button variant="outline" onClick={() => setEdit(d)}>
                          编辑并保存
                        </Button>
                        <Button
                          disabled={busy || !d.name}
                          onClick={async () => {
                            if (await save(d, false))
                              setDrafts((prev) =>
                                prev.filter((x) => x.id !== d.id),
                              );
                          }}
                        >
                          确认录入
                        </Button>
                        <button
                          onClick={() =>
                            setDrafts((prev) =>
                              prev.filter((x) => x.id !== d.id),
                            )
                          }
                        >
                          忽略
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    整理结果会先放在这里。
                    <small>确认姓名、归属和日期后，再写入正式档案。</small>
                  </div>
                )}
              </section>
            </div>
          )}
          {view === "设置与数据" && (
            <div className="settings-grid">
              <section className="panel setting">
                <h2>历史与备份</h2>
                <p>
                  历史记录保留原始出处和待核实标记。备份包含资源、待办及全部跟进记录。
                </p>
                <Button disabled={busy || !!err} onClick={addHistory}>
                  导入历史资源（去重）
                </Button>
                <Button
                  variant="outline"
                  disabled={loading || !!err}
                  onClick={exportData}
                >
                  <Download size={16} /> 导出 JSON 备份
                </Button>
                <label className="file-button">
                  <Upload size={16} /> 导入 JSON / Markdown / TXT
                  <input
                    type="file"
                    accept=".json,.md,.txt"
                    onChange={(e) => importFile(e.target.files?.[0])}
                  />
                </label>
              </section>
              <section className="panel setting">
                <h2>火山方舟与长期记忆</h2>
                <Badge variant="secondary">
                  {apiReady ? "密钥已配置，模型需开通" : "待配置 API Key"}
                </Badge>
                <p>
                  资源和每次跟进独立保存。AI
                  根据关键词检索相关档案，结合当前输入整理，不依赖一段越来越长的聊天。
                </p>
                <p className="helper">
                  火山方舟密钥已保存在服务端。当前默认模型尚未开通，需要开通模型或指定已有模型
                  ID 后才能使用。密钥不会写入网页或备份。
                </p>
              </section>
              <section className="panel setting">
                <h2>每日提醒</h2>
                <p>
                  打开总览即可查看当天待办、老板安排及逾期事项。页面每分钟刷新。关闭网页后的定时推送尚未启用。
                </p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!("Notification" in window)) {
                      notify("当前浏览器不支持通知");
                      return;
                    }
                    const p = await Notification.requestPermission();
                    if (p === "granted") {
                      new Notification("嘿噗 · 今日提醒", {
                        body: `今天 ${due.length} 项待处理，老板 ${due.filter((t) => t.owner === "老板").length} 项。`,
                      });
                      notify("已发送本次提醒；后台定时推送尚未启用");
                    } else notify("通知权限未开启，仍可在总览查看");
                  }}
                >
                  <Bell size={16} /> 发送一次桌面提醒
                </Button>
              </section>
              <section className="panel setting">
                <h2>协作与信息来源</h2>
                <p>
                  当前为私人工作空间。记录已支持填写记录人、保存来源和防止同时编辑覆盖。邀请同事的权限管理尚未开放。
                </p>
                <label>
                  跟进记录署名
                  <Input value={who} onChange={(e) => setWho(e.target.value)} />
                </label>
                <p className="helper">
                  署名仅作记录备注，不代表已验证的账号身份。
                </p>
              </section>
            </div>
          )}
          <footer className="page-footer">
            嘿噗 <span>·</span> 每一次跟进，都在靠近下一次可能。
          </footer>
        </div>
      </main>
      <Dialog
        open={!!edit}
        onOpenChange={(o) => {
          if (!o && !busy) setEdit(null);
        }}
      >
        <DialogContent className="edit-dialog">
          <DialogTitle>
            {edit?.revision ? "编辑" : "新增"}
            {edit?.kind === "resource"
              ? "资源档案"
              : edit?.kind === "schedule"
                ? "Genji日程"
                : edit?.kind === "project" ? "项目" : "待办事项"}
          </DialogTitle>
          <DialogDescription>
            保存合作脉络、明确下一步。带 * 的字段必填。
          </DialogDescription>
          {edit && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save(edit).then((ok) => {
                  if (ok) setDrafts((ds) => ds.filter((d) => d.id !== edit.id));
                });
              }}
            >
              {edit.kind === "resource" ? <ResourceEditor item={edit} onChange={setEdit} groups={groups}/> : <>
              <div className="form-grid">
                <label className="wide">
                  {edit.kind === "schedule"
                      ? "日程名称"
                      : edit.kind === "project" ? "项目名称" : "待办内容"}{" "}
                  *
                  <Input
                    required
                    maxLength={300}
                    value={edit.name}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  />
                </label>
                {edit.kind === "schedule" && <label className="wide"><input type="checkbox" checked={!!edit.tentative} onChange={e=>setEdit({...edit,tentative:e.target.checked})}/> 待定</label>}
                {edit.kind === "project" && <label className="wide">项目总览表链接<Input type="url" pattern="https?://.+" value={edit.overviewUrl||""} onChange={e=>setEdit({...edit,overviewUrl:e.target.value})}/></label>}
                <label>
                  主要业务板块
                  <Select
                    value={edit.business}
                    onChange={(v) => setEdit({ ...edit, business: v })}
                    options={edit.kind==="schedule"||edit.kind==="task"?[...businesses,"企业合作"]:businesses}
                  />
                </label>
                {edit.kind!=="schedule" && <label>
                  优先级
                  <Select
                    value={edit.priority}
                    onChange={(v) => setEdit({ ...edit, priority: v })}
                    options={["P0", "P1", "P2", "P3"]}
                  />
                </label>}
                <label>
                  负责人
                  <Select
                    value={edit.owner}
                    onChange={(v) => setEdit({ ...edit, owner: v })}
                    options={["我", "老板", "乔伊"]}
                  />
                </label>
                <label>
                  状态
                  <Select
                    value={edit.kind==="project"?projectState(edit):edit.status}
                    onChange={(v) => setEdit({ ...edit, status: v })}
                    options={
                      edit.kind === "schedule"
                          ? ["待确认", "已确认", "已完成", "已取消"]
                          : edit.kind==="project" ? ["正常","卡点","已关闭"] : ["待处理", "进行中", "等待反馈", "已完成"]
                    }
                  />
                </label>
                {edit.kind === "schedule" && <><label>所在城市 / 行程目的地<Input placeholder="如北京；返程填写厦门" value={edit.destinationCity||""} onChange={e=>setEdit({...edit,destinationCity:e.target.value})}/></label>{edit.category === "差旅行程" && <label>出行方式<Select value={edit.travelMode||"飞机"} options={["飞机","高铁","汽车"]} onChange={v=>setEdit({...edit,travelMode:v})}/></label>}<p className="wide field-hint">差旅行程从出发日期起标记目的城市，直到下一段旅程；返回厦门后恢复普通底色。待定行程不改变城市。</p></>}
                {edit.kind === "project" && <label className="wide">项目起始日期<Input type="date" value={edit.planned} onChange={e=>setEdit({...edit,planned:e.target.value})}/></label>}

                {(edit.kind === "task" || edit.kind === "schedule") && (
                  <>
                    <label>
                      事项分类
                      <NativeSelect
                        value={edit.category}
                        onChange={(e) =>
                          setEdit({ ...edit, category: e.target.value })
                        }
                      >
                        {(edit.kind === "schedule"
                          ? ["线上会议", "线下会议", "直播演讲", "拍摄录制", "差旅行程", "其他活动"]
                          : edit.owner === "老板"
                            ? ["会议", "电话会", "其他事项"]
                            : ["工作推进", "沟通联系", "行政事项", "其他事项"]
                        ).map((v) => (
                          <NativeSelectOption key={v} value={v}>
                            {v}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </label>
                    {edit.kind === "schedule" && (
                      <label>
                        地点（可留空）
                        <Input
                          placeholder="例如：腾讯会议 / 厦门海沧 / 厦门北站"
                          value={edit.city}
                          onChange={(e) =>
                            setEdit({ ...edit, city: e.target.value })
                          }
                        />
                      </label>
                    )}
                    <label>
                      具体时间（可留空）
                      <Input
                        type="time"
                        value={edit.time}
                        onChange={(e) =>
                          setEdit({ ...edit, time: e.target.value })
                        }
                      />
                    </label>
                    {edit.kind === "schedule" && <><label>结束时间（可留空）<Input type="time" value={edit.endTime||""} onChange={e=>setEdit({...edit,endTime:e.target.value})}/><button type="button" className="clear-date" onClick={()=>setEdit({...edit,endTime:""})}>清除</button></label>{edit.category === "差旅行程" && <label>航班 / 车次号<Input value={edit.flightNumber||""} onChange={e=>setEdit({...edit,flightNumber:e.target.value})} placeholder="如 MF8101 / G1655"/></label>}</>}
                    <label>
                      计划处理日期
                      <Input
                        type="date"
                        value={edit.planned}
                        onChange={(e) =>
                          setEdit({ ...edit, planned: e.target.value })
                        }
                      />
                    </label>
                    {edit.kind==="task" && <label>
                      <span>硬截止日期（可留空） <button type="button" onClick={() => setEdit({...edit,deadline:""})}>清除日期</button></span>
                      <Input
                        type="date"
                        value={edit.deadline}
                        onChange={(e) =>
                          setEdit({ ...edit, deadline: e.target.value })
                        }
                      />
                    </label>}
                    <label className="wide">
                      关联资源（可多选）
                      <div className="association-options">
                        {resources.length ? resources.map((r) => {
                          const selected = (edit.resourceIds?.length ? edit.resourceIds : edit.resourceId ? [edit.resourceId] : []).includes(r.id);
                          return <label className={`association-option${selected ? " selected" : ""}`} key={r.id}>
                            <input type="checkbox" checked={selected} onChange={() => {
                              const current = edit.resourceIds?.length ? edit.resourceIds : edit.resourceId ? [edit.resourceId] : [];
                              const ids = selected ? current.filter((id) => id !== r.id) : [...current, r.id];
                              setEdit({ ...edit, resourceIds: ids, resourceId: ids[0] || "" });
                            }} />
                            <span>{r.name}</span>
                          </label>;
                        }) : <span className="association-empty">暂无资源</span>}
                      </div>
                    </label>
                    {edit.kind === "task" && (
                      <label className="wide">
                        关联日程（可多选）
                        <div className="association-options">
                          {schedules.length ? schedules.map((s) => {
                            const selected = (edit.scheduleIds || []).includes(s.id);
                            return <label className={`association-option${selected ? " selected" : ""}`} key={s.id}>
                              <input type="checkbox" checked={selected} onChange={() => {
                                const current = edit.scheduleIds || [];
                                const ids = selected ? current.filter((id) => id !== s.id) : [...current, s.id];
                                setEdit({ ...edit, scheduleIds: ids });
                              }} />
                              <span>{s.planned || "未安排日期"} · {s.name}</span>
                            </label>;
                          }) : <span className="association-empty">暂无日程</span>}
                        </div>
                      </label>
                    )}
                    <label className="wide">
                      会议议题（可留空）
                      <Input
                        placeholder="例如：品牌合作方案、预算与下一步"
                        value={edit.topic}
                        onChange={(e) =>
                          setEdit({ ...edit, topic: e.target.value })
                        }
                      />
                    </label>
                    <label className="wide">
                      参会人员（可留空，单独字段）
                      <Textarea
                        placeholder="例如：Genji、珈珈、张三（品牌方）"
                        value={edit.attendees}
                        onChange={(e) =>
                          setEdit({ ...edit, attendees: e.target.value })
                        }
                      />
                    </label>
                  </>
                )}
                <label className="wide">
                  {edit.kind === "project" ? "项目目标与说明" : "事项说明"}
                  <Textarea
                    value={edit.opportunity}
                    onChange={(e) =>
                      setEdit({ ...edit, opportunity: e.target.value })
                    }
                  />
                </label>
                <label className="wide">
                  记录来源
                  <Input
                    value={edit.source}
                    onChange={(e) =>
                      setEdit({ ...edit, source: e.target.value })
                    }
                  />
                </label>
                <label className="checklabel wide">
                  <Checkbox
                    checked={edit.verified}
                    onCheckedChange={(c) => setEdit({ ...edit, verified: !!c })}
                  />{" "}
                  信息已核实
                </label>
              </div>
              </>}
              <div className="dialog-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEdit(null)}
                >
                  取消
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? "正在保存…" : "保存"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Sheet
        open={detail?.kind === "task"}
        onOpenChange={(o) => {
          if (!o) setDetail(null);
        }}
      >
        <SheetContent className="detail-sheet">
          {detail?.kind === "task" && (
            <>
              <SheetTitle>{detail.name}</SheetTitle>
              <SheetDescription>待办进展与结果反馈</SheetDescription>
              <div className="detail-tags">
                <Priority p={detail.priority} />
                <Badge variant="secondary">
                  {detail.owner === "老板" ? "Genji" : "珈珈"}
                </Badge>
                <Badge variant="secondary">
                  {detail.verified ? detail.status : "待核实"}
                </Badge>
                <Badge variant="secondary">
                  {detail.category || "其他事项"}
                </Badge>
              </div>
              <div className="inline">
                <Button variant="outline" onClick={() => setEdit(detail)}>
                  编辑档案
                </Button>
              </div>
              <dl>
                <dt>负责人</dt>
                <dd>{detail.owner}</dd>
                <dt>计划日期 / 截止日期</dt>
                <dd>
                  {detail.planned || "未排期"} {detail.time || "（无具体时间）"}{" "}
                  / {detail.deadline || "无硬截止"}
                </dd>
                <dt>会议议题</dt>
                <dd className="prewrap">{detail.topic || "待补充"}</dd>
                <dt>参会人员</dt>
                <dd className="prewrap">{detail.attendees || "待补充"}</dd>
                <dt>关联资源</dt>
                <dd>
                  {resources.find((r) => r.id === detail.resourceId)?.name ||
                    "未关联"}
                </dd>
                <dt>事项说明</dt>
                <dd className="prewrap">{detail.opportunity || "待补充"}</dd>
                <dt>原始来源</dt>
                <dd>{detail.source}</dd>
              </dl>
              <h3>跟进时间线</h3>
              <Textarea
                placeholder="记录沟通情况、结果和下一步…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button
                disabled={busy || !note.trim()}
                onClick={async () => {
                  if (
                    await save(
                      {
                        ...detail,
                        notes: [
                          ...(detail.notes || []),
                          {
                            text: note,
                            at: new Date().toISOString(),
                            by: who || "我",
                          },
                        ],
                      },
                      false,
                    )
                  )
                    setNote("");
                }}
              >
                追加跟进
              </Button>
              <div className="timeline">
                {[...(detail.notes || [])].reverse().map((n, i) => (
                  <div key={i}>
                    <small>
                      {new Date(n.at).toLocaleString("zh-CN", {
                        timeZone: "Asia/Shanghai",
                      })}{" "}
                      · {n.by}
                    </small>
                    <p>{n.text}</p>
                  </div>
                ))}
                {!detail.notes?.length && (
                  <p className="muted">还没有跟进记录。</p>
                )}
              </div>
              <h3>后续事项</h3>
              <Textarea
                placeholder="用自然语言记下跟进后产生的新任务，例如：下周一把报价单发给品牌方"
                value={followupText}
                onChange={(e) => setFollowupText(e.target.value)}
              />
              <Button
                disabled={busy || !followupText.trim()}
                onClick={async () => {
                  const next = normalize({
                    ...fresh("task"),
                    name: followupText.trim(),
                    planned: day,
                    owner: detail.owner,
                    business: detail.business,
                    priority: detail.priority,
                    resourceId: detail.resourceId,
                    source: `由待办“${detail.name}”跟进生成`,
                    opportunity: `由“${detail.name}”跟进产生的后续事项`,
                  });
                  if (await save(next, false)) {
                    setFollowupText("");
                    notify("后续待办已创建并完成关联");
                  }
                }}
              >
                创建关联后续待办
              </Button>
            </>
          )}
        </SheetContent>
      </Sheet>
      <AlertDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除“{deleteItem?.name}”？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复。这个资源的关联待办不会一起删除，但会失去关联。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={() => deleteItem && remove(deleteItem)}
            >
              {busy ? "正在删除…" : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
