import type { RecordItem } from './model';
export const categoryColor = (category: string): string => ({'线上会议':'#648ea9','线下会议':'#6f9786','直播演讲':'#9386ad','直播演讲活动':'#9386ad','拍摄录制':'#b39173','差旅行程':'#7d8fb1'}[category] || '#86979f');
export function cityColor(city: string) { const name=city.trim().replace(/市$/,'');const fixed:Record<string,string>={北京:'#dcd9ed',上海:'#cce7ed',深圳:'#d2e7cf',广州:'#f3debf',杭州:'#d5e5bc',成都:'#ecd4de'};if(fixed[name])return fixed[name];let h=0;for(const c of name)h=(h*31+c.charCodeAt(0))>>>0;return `hsl(${h%360} 46% 86%)`; }
// Travel changes persist until the next explicitly entered travel destination.
// A meeting location changes only that day, never all following days.
export function cityForDate(items: RecordItem[], date: string) {
 const candidates = items.filter(item =>
   item.kind === 'schedule' && item.status !== '已取消' && !item.tentative &&
   item.destinationCity?.trim() && item.planned &&
   (item.planned === date || (item.category === '差旅行程' && item.planned < date))
 );
 candidates.sort((a, b) => a.planned.localeCompare(b.planned) || (a.time || '').localeCompare(b.time || ''));
 return candidates.at(-1)?.destinationCity?.trim().replace(/市$/, '') || '';
}
