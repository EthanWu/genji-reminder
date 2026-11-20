"use client";
import { ArrowUpRight, ListTodo, Layers3, CalendarDays, GitBranch } from 'lucide-react';
import {CityWeather} from './city-weather';
import {cityForDate} from '@/lib/schedule-colors';
import {projectState,contactGroup} from '@/lib/model';
import type { RecordItem } from '@/lib/model';

type HomeProps = {
  items: RecordItem[];
  due: RecordItem[];
  day: string;
  go: (view: string) => void;
};

export function WorkspaceHome({items, due, day, go}: HomeProps) {
  const resources = items.filter(item => item.kind === 'resource');
  const projects = items.filter(item => item.kind === 'project' && projectState(item)!=='已关闭');
  const schedules = items.filter(item => item.kind === 'schedule' && item.planned >= day &&
    item.status !== '已完成' && item.status !== '已取消')
    .sort((a,b) => a.planned.localeCompare(b.planned) || (a.time || '24:00').localeCompare(b.time || '24:00'));
  const today = schedules.filter(item => item.planned === day);

  const drawers = [
    {name:'待办事项', view:'待办事项', icon:ListTodo, color:'blue', count:due.length, unit:'项今日与逾期待办', detail:due[0]?.name || '今天的待办已清空'},
    {name:'资源清单', view:'资源库', icon:Layers3, color:'mint', count:resources.length, unit:'条合作资源', detail:Object.entries(resources.reduce<Record<string,number>>((counts,item)=>{const group=contactGroup(item);counts[group]=(counts[group]||0)+1;return counts},{})).map(([group,count])=>group+' '+count+' 条').join(' · ') || '暂无合作资源'},
    {name:'日程管理', view:'Genji日程', icon:CalendarDays, color:'lavender', count:today.length, unit:'项今日安排', detail:schedules[0] ? [schedules[0].planned.slice(5), schedules[0].time, schedules[0].name].filter(Boolean).join(' · ') : '暂无已排期的后续日程'},
    {name:'项目跟进', view:'项目跟进', icon:GitBranch, color:'sand', count:projects.length, unit:'个项目', detail:projects[0]?.name || '新建项目或从资源清单转入', summary:'P0 '+projects.filter(p=>p.priority==='P0').length+' 个 · 卡点 '+projects.filter(p=>projectState(p)==='卡点').length+' 个'}
  ];
  return <div className="home-studio" onPointerMove={e=>{if(e.pointerType==='mouse'){const rect=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--parallax',((e.clientX-rect.left)/rect.width*10-5)+'px')}}}>
    <header className="home-intro">
      <div><h1>总经办的工作台</h1><p>正在跟进 <b>{projects.length}</b> 个项目，今日有 <b>{due.length}</b> 项待办，Genji 有 <b>{today.length}</b> 项日程。</p><CityWeather city={cityForDate(items,day)||'厦门'} day={day}/></div>
      <div className="home-date"><span>{day.slice(0,4)} / {day.slice(5,7)}</span><strong>{day.slice(8)}</strong><small>{new Date(day+'T12:00:00').toLocaleDateString('zh-CN',{weekday:'long'})}</small></div>
    </header>
    <div className="cabinet-grid">{drawers.map(drawer =>
      <button className={'cabinet '+drawer.color} key={drawer.view} onClick={()=>go(drawer.view)}>
        <div className="cabinet-back"/><div className="cabinet-paper" aria-hidden="true"><div className="paper-lines"><i/><i/><i/></div></div>
        <div className="cabinet-front"><div className="cabinet-head"><span className="module-icon"><drawer.icon size={25} strokeWidth={1.5}/></span><ArrowUpRight size={18}/></div>
          <div className="cabinet-title"><h2>{drawer.name}</h2></div>
          <footer><b>{drawer.count}</b><span>{drawer.unit}</span></footer><p className="drawer-detail">{drawer.detail}</p>{drawer.summary && <small className="project-drawer-count">{drawer.summary}</small>}
        </div>
      </button>)}</div>
    <section className="daily-agenda"><header><h2>今日 Genji 日程</h2><button onClick={()=>go('Genji日程')}>查看日程 <ArrowUpRight size={15}/></button></header>
      {today.length ? <ol>{today.map(item=><li key={item.id}><time>{item.time ? [item.time,item.endTime].filter(Boolean).join('–') : '时间待定'}</time><span>{item.name}</span>{item.tentative && <small>待定</small>}</li>)}</ol> : <p>今天暂无待进行的日程。</p>}
    </section>
  </div>;
}
