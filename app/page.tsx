"use client";
import { useEffect, useState } from "react";
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
const nav = [
  ["总览", LayoutDashboard],
  ["资源库", Layers3],
  ["待办事项", ListTodo],
  ["日历", CalendarDays],
  ["自然语言录入", Sparkles],
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
  const resources = items.filter((i) => i.kind === "resource"),
    tasks = items.filter((i) => i.kind === "task");
  const effective = (t: RecordItem) =>
    t.status !== "已完成" && (!t.planned || t.planned < day) ? day : t.planned;
  const activeTasks = tasks.filter((t) => t.status !== "已完成");
  const due = activeTasks.filter(
    (t) => effective(t) === day || (t.deadline && t.deadline <= day),
  );
  const filtered = resources
    .filter(
      (r) =>
        (!query ||
          JSON.stringify(r).toLowerCase().includes(query.toLowerCase())) &&
        (type === "全部类型" || r.type === type) &&
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
        setView(item.kind === "resource" ? "资源库" : "待办事项");
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
            ...fresh(x.kind === "task" ? "task" : "resource"),
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
            ...fresh(x.kind === "task" ? "task" : "resource"),
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
      setView("自然语言录入");
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
                <strong>{t.name}</strong>
                <small>
                  {t.owner === "老板" ? "Genji" : "珈珈"} ·{" "}
                  {t.category || "其他事项"}
                  {t.time && ` · ${t.time}`}
                  {t.attendees && ` · 参会人：${t.attendees}`}
                  {t.deadline && (
                    <span className={t.deadline < day ? "late" : ""}>
                      {" "}
                      · 截止 {t.deadline}
                    </span>
                  )}
                  {t.planned && t.planned < day && t.status !== "已完成"
                    ? " · 已顺延至今天"
                    : ""}
                </small>
              </button>
              <Priority p={t.priority} />
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
      <Sidebar className="app-sidebar">
        <SidebarHeader>
          <div className="brand">
            <div className="brandmark">◈</div>
            <div>
              <b>嘿噗</b>
              <small>资源与日程工作台</small>
            </div>
          </div>
          <div className="workspace-label">鲸海拾贝 · 私人工作空间</div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {nav.map(([label, Icon]) => (
              <SidebarMenuItem key={label}>
                <NavButton
                  active={view === label}
                  go={() => {
                    setView(label);
                    setQuery("");
                  }}
                >
                  <Icon />
                  <span>{label}</span>
                  {label === "待办事项" && (
                    <span className="nav-count">{activeTasks.length}</span>
                  )}
                </NavButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="side-section">业务板块</div>
          {businesses.map((b, i) => (
            <button
              key={b}
              className="business-link"
              onClick={() => {
                setBusiness(b);
                setView("资源库");
              }}
            >
              <i
                style={{
                  background: [
                    "#50a591",
                    "#549ac2",
                    "#7689b6",
                    "#92ad76",
                    "#66b5bd",
                    "#b5ac7c",
                    "#ab90b5",
                  ][i],
                }}
              />
              {b}
            </button>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <div className="side-foot">
            <span>让每一次连接，都有后续。</span>
            <small>嘿噗 / HEIPU</small>
          </div>
          <div className="profile">
            <span>珈</span>
            <div>
              我的工作空间<small>资源与行动，持续积累</small>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <main className="app-main">
        <header className="topbar">
          <div className="top-crumb">
            <SidebarTrigger /> 工作空间 <span>/</span> <b>{view}</b>
          </div>
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
                    : view}
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
                        : view === "日历"
                          ? "看见老板与自己的安排。未完成事项按计划顺延，截止时间保持不变。"
                          : view === "自然语言录入"
                            ? "随手记下对话、资源和安排，核对后沉淀为档案。"
                            : "管理数据备份、历史导入与 AI 连接。"}
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
                  view === "待办事项" || view === "日历"
                    ? createTask()
                    : setEdit(fresh("resource"))
                }
              >
                <Plus size={17} />{" "}
                {view === "待办事项" || view === "日历"
                  ? "新建待办"
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
          {view === "总览" && (
            <>
              <div className="overview-top">
                <div className="focus-card">
                  <div className="focus-label">
                    <span>今日聚焦</span>
                    <span>
                      {new Date().toLocaleDateString("zh-CN", {
                        timeZone: "Asia/Shanghai",
                        weekday: "long",
                      })}
                    </span>
                  </div>
                  <h2>
                    {due.length
                      ? `${due.length} 件事，值得今天推进。`
                      : "留一点空间，给重要的事。"}
                  </h2>
                  <p>
                    {due.length
                      ? `老板 ${due.filter((t) => t.owner === "老板").length} 项 · 我的 ${due.filter((t) => t.owner !== "老板").length} 项`
                      : "先记录一位伙伴，或安排今天的第一件事。"}
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setView("待办事项");
                      setOwner("全部");
                    }}
                  >
                    查看待办 <ArrowUpRight size={16} />
                  </Button>
                  <img className="island-art" src="/qingyu-island.png" alt="" />
                </div>
                <div className="stats">
                  <button
                    onClick={() => {
                      setView("资源库");
                      setType("全部类型");
                      setBusiness("全部业务");
                      setPriority("全部优先级");
                    }}
                  >
                    <span>
                      资源总数 <Layers3 size={17} />
                    </span>
                    <b>{resources.length.toString().padStart(2, "0")}</b>
                    <small>
                      {resources.filter((r) => !r.verified).length} 条待核实档案
                    </small>
                  </button>
                  <button
                    onClick={() => {
                      setView("资源库");
                      setPriority("P0");
                      setBusiness("全部业务");
                    }}
                  >
                    <span>
                      最高优先级 <Flag size={17} />
                    </span>
                    <b>
                      {resources
                        .filter((r) => r.priority === "P0")
                        .length.toString()
                        .padStart(2, "0")}
                    </b>
                    <small>优先推动关键连接</small>
                  </button>
                </div>
              </div>
              <div className="dashboard-grid">
                <section className="panel">
                  <div className="panel-head">
                    <h2>
                      今天的行动 <span>{due.length}</span>
                    </h2>
                    <button onClick={() => setView("待办事项")}>
                      全部待办 <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <Tabs value={owner} onValueChange={setOwner}>
                    <TabsList>
                      {["全部", "老板", "我"].map((o) => (
                        <TabsTrigger value={o} key={o}>
                          {o === "我"
                            ? "我的待办"
                            : o === "老板"
                              ? "老板待办"
                              : o}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  {taskRows(
                    due.filter((t) => owner === "全部" || t.owner === owner),
                  )}
                  <div className="panel-foot">
                    <Clock3 size={15} />{" "}
                    未完成的计划事项自动归入今天，硬截止日期保留
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-head">
                    <h2>资源分布</h2>
                    <span className="muted">按业务板块</span>
                  </div>
                  <div className="distribution">
                    {businesses.map((b, i) => {
                      const n = resources.filter((r) =>
                        r.business.split("、").includes(b),
                      ).length;
                      return (
                        <button
                          key={b}
                          onClick={() => {
                            setBusiness(b);
                            setView("资源库");
                          }}
                        >
                          <div>
                            <span>{b}</span>
                            <b>{n}</b>
                          </div>
                          <div className="bar">
                            <i
                              style={{
                                width:
                                  (resources.length
                                    ? (n / resources.length) * 100
                                    : 0) + "%",
                                background: i % 2 ? "#73a5be" : "#66a99b",
                              }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
              <section className="panel resource-panel">
                <div className="panel-head">
                  <h2>值得关注的连接</h2>
                  <button onClick={() => setView("资源库")}>
                    进入资源库 <ArrowUpRight size={15} />
                  </button>
                </div>
                {resources.length ? (
                  <div className="resource-cards">
                    {[...resources]
                      .sort((a, b) => a.priority.localeCompare(b.priority))
                      .slice(0, 4)
                      .map((r) => (
                        <button key={r.id} onClick={() => openResource(r)}>
                          <div className="card-top">
                            <span className="resource-icon">
                              <Building2 size={19} />
                            </span>
                            <Priority p={r.priority} />
                          </div>
                          <h3>{r.name}</h3>
                          <p>{r.contact || "对接人待补充"}</p>
                          <div>
                            <Badge variant="secondary">{r.type}</Badge>
                            <small>{r.verified ? r.status : "待核实"}</small>
                          </div>
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="empty">
                    <p>已有历史工作记录中的 10 条资源线索，可带出处导入。</p>
                    <Button disabled={busy || !!err} onClick={addHistory}>
                      导入历史资源线索
                    </Button>
                  </div>
                )}
              </section>
            </>
          )}
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
                <Select
                  value={type}
                  onChange={setType}
                  options={["全部类型", ...types]}
                />
                <Select
                  value={business}
                  onChange={setBusiness}
                  options={["全部业务", ...businesses]}
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
                      "来源渠道",
                      "优先级",
                      "跟进状态",
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
                          onClick={() => openResource(r)}
                        >
                          {r.name}
                          <small>{r.city || "城市待补充"}</small>
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.type}</Badge>
                        <small>{r.business}</small>
                      </TableCell>
                      <TableCell>{r.contact || "待补充"}</TableCell>
                      <TableCell>{r.channel || "待补充"}</TableCell>
                      <TableCell>
                        <Priority p={r.priority} />
                      </TableCell>
                      <TableCell>
                        <span className={!r.verified ? "unverified" : ""}>
                          {r.verified ? r.status : "待核实"}
                        </span>
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
                <div className="detail-facts">
                  <div>
                    <span>对接人</span>
                    <b>{detail.contact || "待补充"}</b>
                  </div>
                  <div>
                    <span>城市</span>
                    <b>{detail.city || "待补充"}</b>
                  </div>
                  <div>
                    <span>来源渠道</span>
                    <b>{detail.channel || "待补充"}</b>
                  </div>
                  <div>
                    <span>负责人</span>
                    <b>{detail.owner || "待补充"}</b>
                  </div>
                </div>
                <div className="detail-block">
                  <h2>最初的合作点与契机</h2>
                  <p className="prewrap">{detail.opportunity || "待补充"}</p>
                </div>
                <div className="detail-block">
                  <h2>记录来源</h2>
                  <p>{detail.source || "待补充"}</p>
                </div>
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
                {taskRows(tasks.filter((t) => t.resourceId === detail.id))}
              </section>
            </div>
          )}
          {view === "待办事项" && (
            <section className="panel">
              <div className="filters">
                <Tabs value={owner} onValueChange={setOwner}>
                  <TabsList>
                    {["全部", "老板", "我"].map((o) => (
                      <TabsTrigger value={o} key={o}>
                        {o === "我"
                          ? "我的待办"
                          : o === "老板"
                            ? "老板待办"
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
              </div>
              {["今日与逾期", "未来计划", "长期 / 未排期", "已完成"].map(
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
              )}
            </section>
          )}
          {view === "日历" && (
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
                    {["全部", "老板", "我"].map((o) => (
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
                        ts = tasks.filter(
                          (t) =>
                            (owner === "全部" || t.owner === owner) &&
                            (effective(t) === d || t.deadline === d),
                        );
                      return (
                        <button
                          className={
                            "day " +
                            (d === date ? "selected " : "") +
                            (d === day ? "today" : "")
                          }
                          key={d}
                          onClick={() => setDate(d)}
                        >
                          <b>{i + 1}</b>
                          {ts.slice(0, 3).map((t) => (
                            <span
                              className={t.owner === "老板" ? "boss" : ""}
                              key={t.id}
                            >
                              {t.owner === "老板" ? "老板 · " : ""}
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
          {view === "自然语言录入" && (
            <div className="ingest-grid">
              <section className="panel">
                <div className="panel-head">
                  <h2>
                    <Sparkles size={21} /> 随手记，认真跟进
                  </h2>
                  <Badge variant="secondary">
                    {apiReady ? "火山方舟 · 已配置" : "火山方舟待配置"}
                  </Badge>
                </div>
                <Textarea
                  className="capture"
                  placeholder={
                    "例如：今天朋友介绍了杭州的一家文旅公司，对接人王总，有意合作 AI 导览。优先级高，下周三我跟进方案。\n\n也可以粘贴会议记录、聊天摘要或历史笔记。"
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
                    disabled={busy || !text.trim() || !apiReady}
                    onClick={() => ai()}
                  >
                    整理为资源与待办 <ArrowUpRight size={16} />
                  </Button>
                </div>
                {!apiReady && (
                  <p className="helper">
                    火山方舟接入需要服务端 API Key。你仍可手动录入，或导入 JSON
                    记录进行核对。
                  </p>
                )}
                <div className="ask-row">
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
              <section className="panel">
                <div className="panel-head">
                  <h2>
                    待核对 <span>{drafts.length}</span>
                  </h2>
                </div>
                {drafts.length ? (
                  drafts.map((d, i) => (
                    <div className="draft" key={d.id}>
                      <Badge variant="secondary">
                        {d.kind === "resource" ? "资源" : "待办"}
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
            {edit?.kind === "resource" ? "资源档案" : "待办事项"}
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
              <div className="form-grid">
                <label className="wide">
                  {edit.kind === "resource" ? "资源 / 公司名称" : "待办内容"} *
                  <Input
                    required
                    maxLength={300}
                    value={edit.name}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  />
                </label>
                {edit.kind === "resource" && (
                  <>
                    <label>
                      资源类型
                      <Select
                        value={edit.type}
                        onChange={(v) => setEdit({ ...edit, type: v })}
                        options={types}
                      />
                    </label>
                    <label>
                      对接人
                      <Input
                        value={edit.contact}
                        onChange={(e) =>
                          setEdit({ ...edit, contact: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      城市
                      <Input
                        value={edit.city}
                        onChange={(e) =>
                          setEdit({ ...edit, city: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      来源渠道
                      <Input
                        value={edit.channel}
                        onChange={(e) =>
                          setEdit({ ...edit, channel: e.target.value })
                        }
                      />
                    </label>
                  </>
                )}
                <label>
                  主要业务板块
                  <Select
                    value={edit.business}
                    onChange={(v) => setEdit({ ...edit, business: v })}
                    options={businesses}
                  />
                </label>
                <label>
                  优先级
                  <Select
                    value={edit.priority}
                    onChange={(v) => setEdit({ ...edit, priority: v })}
                    options={["P0", "P1", "P2", "P3"]}
                  />
                </label>
                <label>
                  负责人
                  <Select
                    value={edit.owner}
                    onChange={(v) => setEdit({ ...edit, owner: v })}
                    options={["我", "老板"]}
                  />
                </label>
                <label>
                  状态
                  <Select
                    value={edit.status}
                    onChange={(v) => setEdit({ ...edit, status: v })}
                    options={
                      edit.kind === "resource"
                        ? [
                            "待核实",
                            "待联系",
                            "已接洽",
                            "推进中",
                            "已合作",
                            "暂缓",
                          ]
                        : ["待处理", "进行中", "等待反馈", "已完成"]
                    }
                  />
                </label>
                {edit.kind === "task" && (
                  <>
                    <label>
                      事项分类
                      <NativeSelect
                        value={edit.category}
                        onChange={(e) =>
                          setEdit({ ...edit, category: e.target.value })
                        }
                      >
                        {(edit.owner === "老板"
                          ? ["会议", "电话会", "其他事项"]
                          : ["工作推进", "沟通联系", "行政事项", "其他事项"]
                        ).map((v) => (
                          <NativeSelectOption key={v} value={v}>
                            {v}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </label>
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
                    <label>
                      硬截止日期（可留空）
                      <Input
                        type="date"
                        value={edit.deadline}
                        onChange={(e) =>
                          setEdit({ ...edit, deadline: e.target.value })
                        }
                      />
                    </label>
                    <label className="wide">
                      关联资源
                      <NativeSelect
                        value={edit.resourceId}
                        onChange={(e) =>
                          setEdit({ ...edit, resourceId: e.target.value })
                        }
                      >
                        <NativeSelectOption value="">
                          不关联资源
                        </NativeSelectOption>
                        {resources.map((r) => (
                          <NativeSelectOption value={r.id} key={r.id}>
                            {r.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </label>
                    {(edit.category === "会议" ||
                      edit.category === "电话会") && (
                      <>
                        <label className="wide">
                          会议议题
                          <Textarea
                            placeholder="填写本次会议或电话会要讨论的议题"
                            value={edit.opportunity}
                            onChange={(e) =>
                              setEdit({ ...edit, opportunity: e.target.value })
                            }
                          />
                        </label>
                        <label className="wide">
                          参会人员（单独字段）
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
                  </>
                )}
                <label className="wide">
                  {edit.kind === "resource" ? "最初的合作点与契机" : "事项说明"}
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
                {(detail.category === "会议" ||
                  detail.category === "电话会") && (
                  <>
                    <dt>议题与参会人员</dt>
                    <dd className="prewrap">{detail.attendees || "待补充"}</dd>
                  </>
                )}
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
