import type {RecordItem} from './model';
export const resourceFields = [
 {key:'name',label:'资源 / 公司名称',required:true}, {key:'priority',label:'优先级'}, {key:'type',label:'资源类型'},
 {key:'business',label:'业务板块'}, {key:'contact',label:'对接人'}, {key:'city',label:'城市'},
 {key:'owner',label:'负责人'},
 {key:'opportunity',label:'合作点与契机'}, {key:'source',label:'记录来源'},
] as const;
export function visibleResourceFields(item:RecordItem){return resourceFields.filter(f=>f.key==='name'||!item.hiddenFields?.includes(f.key));}
export function resourceFieldLabel(item:RecordItem,key:string,fallback:string){return item.fieldLabels?.[key]||fallback;}
