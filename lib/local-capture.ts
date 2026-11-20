import {fresh, type RecordItem} from './model';

// Keep the source text on each draft so uncertain details can be corrected before saving.
export function localDrafts(text:string,day:string):RecordItem[]{
  return text.split(/[\n；;]+/).map(s=>s.trim()).filter(Boolean).slice(0,20).map(line=>{
    const kind:RecordItem['kind']=/^(项目|新建项目)/.test(line)?'project':/^(待办|任务)|需要跟进|提醒我/.test(line)?'task':
      /^(资源|联系人)|新认识|对接人是/.test(line)?'resource':/日程|会议|参会|航班|高铁|直播|拍摄|录制|面谈|开会|电话会/.test(line)?'schedule':'task';
    const item=fresh(kind);
    const date=line.match(/(\d{4})[-年/](\d{1,2})[-月/](\d{1,2})日?/);
    const relative=line.match(/今天|今日|明天|后天/);
    if(date)item.planned=[date[1],date[2].padStart(2,'0'),date[3].padStart(2,'0')].join('-');
    else if(relative){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+({'明天':1,'后天':2}[relative[0]]||0));item.planned=d.toISOString().slice(0,10)}
    else {
      const weekday=line.match(/(下周|本周|这周|周|星期)([一二三四五六日天])/);
      if(weekday){const d=new Date(day+'T12:00:00Z');const current=(d.getUTCDay()+6)%7;const target='一二三四五六日'.indexOf(weekday[2].replace('天','日'));let offset=target-current;if(weekday[1]==='下周'||(offset<0&&!['本周','这周'].includes(weekday[1])))offset+=7;d.setUTCDate(d.getUTCDate()+offset);item.planned=d.toISOString().slice(0,10)}
    }
    const clockText=line.replace(/([零一二两三四五六七八九十]+)(?=[点时分])/g,(_,word:string)=>{
      const digits='零一二三四五六七八九';const [tens,ones]=word.replace(/两/g,'二').split('十');
      return String(ones===undefined?digits.indexOf(tens):(tens?digits.indexOf(tens):1)*10+(ones?digits.indexOf(ones):0));
    });
    const times=Array.from(clockText.matchAll(/(上午|下午|晚上|中午)?\s*(\d{1,2})(?:[:：](\d{2})|[点时](半|\d{1,2}分?)?)/g)).map(m=>{
      let hour=Number(m[2]);if(['下午','晚上','中午'].includes(m[1])&&hour<12)hour+=12;
      const min=m[3]|| (m[4]==='半'?'30':(m[4]||'0').replace('分',''));
      return hour<24&&Number(min)<60?String(hour).padStart(2,'0')+':'+min.padStart(2,'0'):'';
    });
    item.time=times[0]||'';if(kind==='schedule')item.endTime=times[1]||'';
    item.name=line.replace(/^(?:新建)?(?:日程|待办|任务|项目|资源)\s*[:：]\s*/,'').slice(0,300);
    item.owner=/Genji|老板/i.test(line)||kind==='schedule'?'老板':/乔伊/.test(line)?'乔伊':'我';
    item.priority=line.match(/P[0-3]/i)?.[0].toUpperCase()||item.priority;
    if(kind==='schedule'){item.category=/飞机|航班|高铁|出差/.test(line)?'差旅行程':/直播|演讲/.test(line)?'直播演讲':/拍摄|录制/.test(line)?'拍摄录制':/线上|视频会|电话会/.test(line)?'线上会议':/会议|开会|面谈/.test(line)?'线下会议':'其他活动';item.tentative=/待定/.test(line)}
    item.verified=false;item.source='本地整理 · '+day;item.notes=[{text:line,at:new Date().toISOString(),by:'原始输入'}];
    return item;
  });
}
