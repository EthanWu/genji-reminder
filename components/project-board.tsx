"use client";
import {useState, type FormEvent} from 'react';
import {Plus, ExternalLink, Trash2, GitBranch, GripVertical, Flag} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {type RecordItem,today,projectState} from '@/lib/model';

type Props = {items:RecordItem[]; save:(record:RecordItem,close?:boolean)=>Promise<boolean>; edit:(record:RecordItem)=>void; remove:(record:RecordItem)=>void};
type Note = RecordItem['notes'][number];
type Draft = {project:RecordItem;index:number;date:string;note:Note};

export function ProjectBoard({items,save,edit,remove}:Props){
  const [search,setSearch]=useState('');
  const [draft,setDraft]=useState<Draft|null>(null);
  const [deleting,setDeleting]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [drag,setDrag]=useState('');
  const [dropHint,setDropHint]=useState('');
  const all=items.filter(r=>r.kind==='project').sort((a,b)=>a.id.localeCompare(b.id));
  // Keep the initial position stable when another project is created or removed.
  const rank=(r:RecordItem)=>r.projectRank??Array.from(r.id).reduce((hash,c)=>(Math.imul(hash,31)+c.charCodeAt(0))>>>0,0);
  const closed=(r:RecordItem)=>projectState(r)==='已关闭';
  const projects=all.sort((a,b)=>Number(closed(a))-Number(closed(b))||a.priority.localeCompare(b.priority)||rank(a)-rank(b)||a.id.localeCompare(b.id))
    .filter(r=>[r.name,r.business,projectState(r),r.opportunity].join(' ').includes(search));
  async function move(source:string,priority:string,target?:RecordItem,after=false){
    const record=all.find(p=>p.id===source);
    if(!record||busy||record.id===target?.id||(target&&closed(record)!==closed(target)))return;
    const group=all.filter(p=>p.id!==source&&closed(p)===closed(record)&&p.priority===priority);
    const index=target?group.indexOf(target)+Number(after):0;
    const previous=group[index-1],next=group[index];
    const position=previous&&next?(rank(previous)+rank(next))/2:previous?rank(previous)+1024:next?rank(next)-1024:0;
    setBusy(true);
    try{await save({...record,priority,projectRank:position},false)}finally{setBusy(false)}
  }
  function clearDrag(){setDrag('');setDropHint('')}
  function open(project:RecordItem,index:number){
    const note=project.notes[index]||{text:'',at:new Date().toISOString(),by:'珈珈'};
    setDraft({project,index,note:{...note},date:index<0?today():note.at.slice(0,10)});setError('');setDeleting(false);
  }
  async function submit(e:FormEvent){
    e.preventDefault();if(!draft||busy)return;
    const {project,index,date,note}=draft;
    const notes=[...project.notes];
    if(deleting) notes.splice(index,1);
    else {
      if(note.url&&!/^https?:\/\//i.test(note.url)){setError('请填写 http 或 https 资料链接');return}
      const updated={...note,at:date===note.at.slice(0,10)?note.at:date+'T12:00:00.000Z'};
      if(index<0)notes.push(updated);else notes[index]=updated;
    }
    setBusy(true);try{if(await save({...project,notes},false))setDraft(null);else setError('保存失败，请重新打开最新项目后再试。')}finally{setBusy(false)}
  }
  return <section className="project-board"><div className="project-summary"><input className="project-search" aria-label="搜索项目" placeholder="搜索项目、业务或进展" value={search} onChange={e=>setSearch(e.target.value)}/><span>{projects.length} 个项目</span></div>
    {projects.length===0&&<div className="project-empty"><GitBranch/><h2>{search?'未找到匹配项目':'还没有项目'}</h2><p>可在这里新建，也可从资源档案转入。</p></div>}
    {drag&&<div className="project-drop-zones">{['P0','P1','P2','P3'].map(p=><div key={p} className={'level-'+p+(dropHint===p?' over':'')} onDragOver={e=>{e.preventDefault();setDropHint(p)}} onDrop={e=>{e.preventDefault();void move(drag,p);clearDrag()}}><Flag size={13}/> 移至 {p}</div>)}</div>}
    {projects.map(r=>{
      const state=projectState(r),nodes=r.notes.map((note,index)=>({note,index})).sort((a,b)=>a.note.at.localeCompare(b.note.at));
      return <article key={r.id} draggable={!busy} data-project-id={r.id} className={'project-sheet state-'+state+(drag===r.id?' dragging':'')+(dropHint===r.id+'-before'?' drop-before':dropHint===r.id+'-after'?' drop-after':'')}
        onDragStart={e=>{if(e.target!==e.currentTarget){e.preventDefault();return}e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',r.id);setDrag(r.id)}}
        onDragEnd={clearDrag}
        onDragOver={e=>{const source=all.find(p=>p.id===drag);if(!source||source.id===r.id||closed(source)!==closed(r))return;e.preventDefault();const box=e.currentTarget.getBoundingClientRect();setDropHint(r.id+(e.clientY>box.top+box.height/2?'-after':'-before'))}}
        onDrop={e=>{e.preventDefault();const box=e.currentTarget.getBoundingClientRect();void move(drag,r.priority,r,e.clientY>box.top+box.height/2);clearDrag()}}>
        <div className="project-controls"><select aria-label="项目运行状态" value={state} onChange={e=>save({...r,status:e.target.value},false)}>{['正常','卡点','已关闭'].map(s=><option key={s}>{s}</option>)}</select>
          <label className={'priority-flag level-'+r.priority}><Flag size={15} fill="currentColor"/><select aria-label="项目优先级" value={r.priority} onChange={e=>save({...r,priority:e.target.value},false)}>{['P0','P1','P2','P3'].map(p=><option key={p}>{p}</option>)}</select></label>
          <span className="drag-affordance" title="拖动整张卡片调整顺序和优先级" role="button" tabIndex={0} aria-label="调整排序，按上下方向键移动项目" onKeyDown={e=>{const dir=e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0;if(!dir)return;e.preventDefault();const target=projects[projects.indexOf(r)+dir];if(target)void move(r.id,target.priority,target,dir===1)}}><GripVertical size={17}/></span>
        </div>
        <header><div><h2><button onClick={()=>edit(r)}>{r.name}</button>{r.overviewUrl&&<a href={r.overviewUrl} target="_blank" rel="noreferrer">总览表 <ExternalLink size={13}/></a>}</h2><p>{r.business} · {r.owner==='老板'?'Genji':r.owner==='我'?'珈珈':r.owner} · {r.planned||'未设起始日期'}</p></div><button onClick={()=>remove(r)} aria-label={'删除项目 '+r.name}><Trash2 size={16}/></button></header>
        {r.opportunity&&<p className="project-brief">{r.opportunity}</p>}{r.sourceResourceId&&<p className="project-source">来源资源 · {items.find(i=>i.id===r.sourceResourceId)?.name||'已移除'}</p>}
        <div className="project-rail">{nodes.map(({note,index},order)=><section key={index} className={'milestone '+(order===nodes.length-1?'current-node':'')}><time>{note.at.slice(0,10)}</time><i/><div className="milestone-body"><button className="edit-milestone" onClick={()=>open(r,index)}><b>沟通要点</b><p>{note.text}</p>{note.consensus&&<><b>达成共识</b><p>{note.consensus}</p></>}{note.questions&&<><b>待解问题</b><p>{note.questions}</p></>}</button>{note.url&&<a href={note.url} target="_blank" rel="noreferrer">{note.title||'查看资料'} <ExternalLink size={12}/></a>}</div></section>)}
        <button className="add-milestone" onClick={()=>open(r,-1)}><Plus/><span>添加跟进节点</span></button></div>
        {r.links.length>0&&<div className="project-files">{r.links.map(l=><a key={l.id} href={l.url} target="_blank" rel="noreferrer">{l.title} <ExternalLink size={13}/></a>)}</div>}
      </article>
    })}
    <Dialog open={!!draft} onOpenChange={o=>{if(!o&&!busy)setDraft(null)}}><DialogContent className="node-editor">{draft&&<form onSubmit={submit}><DialogTitle>{deleting?'确认删除这个节点？':draft.index<0?'添加跟进节点':'编辑跟进节点'}</DialogTitle><DialogDescription>{draft.project.name}</DialogDescription>{!deleting&&<><label>跟进日期<input required type="date" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/></label>{([['text','沟通要点'],['consensus','达成共识'],['questions','待解问题']] as const).map(([key,label])=><label key={key}>{label}<textarea required={key==='text'} value={draft.note[key]||''} onChange={e=>setDraft({...draft,note:{...draft.note,[key]:e.target.value}})}/></label>)}{([['title','资料名称'],['url','外部资料链接']] as const).map(([key,label])=><label key={key}>{label}<input type={key==='url'?'url':'text'} value={draft.note[key]||''} onChange={e=>setDraft({...draft,note:{...draft.note,[key]:e.target.value}})}/></label>)}</>}
     {error&&<p role="alert">{error}</p>}<footer>{draft.index>=0&&!deleting&&<button type="button" onClick={()=>setDeleting(true)}>删除节点</button>}<button type="button" onClick={()=>deleting?setDeleting(false):setDraft(null)}>取消</button><button disabled={busy} type="submit">{deleting?'确认删除':'保存节点'}</button></footer></form>}</DialogContent></Dialog>
  </section>
}
