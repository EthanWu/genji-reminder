import type {RecordItem} from './model';
export function projectFromResource(resource:RecordItem):RecordItem {
 return {...resource,id:`project:${resource.id}`,kind:'project',sourceResourceId:resource.id,projectEnabled:false,resourceId:resource.id,resourceIds:[resource.id],status:'待处理',source:`由资源「${resource.name}」流转`,revision:1};
}
