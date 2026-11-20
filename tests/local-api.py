"""Only tests the loopback development API; cleans up its own unique records."""
import json,uuid,urllib.request,urllib.error
BASE='http://127.0.0.1:5173/api/records'
created=[]
def request(method,data=None):
 req=urllib.request.Request(BASE,data=None if data is None else json.dumps(data).encode(),method=method,headers={'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=20) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def save(x):
 status,d=request('POST',x);assert status==200,(status,d);return d['record']
def all_records():return request('GET')[1]['records']
prefix='qa-'+str(uuid.uuid4())
try:
 resource=save({'id':prefix,'kind':'resource','name':'本地验证资源','revision':0,'projectEnabled':True,'internalContact':True,'hiddenFields':['channel'],'fieldLabels':{'contact':'合作对接'},'customFields':[{'id':'f','label':'预算','value':'未确认'}],'notes':[{'text':'最初沟通','at':'2026-11-19T00:00:00.000Z','by':'测试'}]});created.extend([prefix,'project:'+prefix])
 project=next(x for x in all_records() if x['id']=='project:'+prefix)
 assert project['sourceResourceId']==prefix and project['kind']=='project'
 project=save({**project,'projectRank':512,'status':'卡点','overviewUrl':'https://example.com/project','notes':project['notes']+[{'text':'新增时间点','at':'2026-11-20T04:00:00.000Z','by':'测试','url':'https://example.com/minutes','title':'纪要','consensus':'同意试点','questions':'预算待核实'}]})
 resource=save({**resource,'name':'资源更新','contactGroup':'乔伊'})
 reread=next(x for x in all_records() if x['id']==project['id']);assert len(reread['notes'])==2 and reread['notes'][-1]['consensus']=='同意试点' and reread['projectRank']==512 and reread['status']=='卡点' and reread['overviewUrl'].endswith('/project')
 status,_=request('POST',{**resource,'revision':1});assert status==409
 task=save({'id':prefix+'-task','kind':'task','name':'截止日期验证','revision':0,'deadline':'2026-11-20'});created.append(task['id']);task=save({**task,'deadline':''});assert next(x for x in all_records() if x['id']==task['id'])['deadline']==''
 schedule=save({'id':prefix+'-schedule','kind':'schedule','name':'外地拍摄验证','revision':0,'category':'拍摄录制','destinationCity':'北京','tentative':True,'time':'09:15','endTime':'10:45'});created.append(schedule['id']);assert next(x for x in all_records() if x['id']==schedule['id'])['tentative']
 status,_=request('DELETE',{'id':project['id'],'revision':project['revision']});assert status==200
 assert any(x['id']==resource['id'] for x in all_records())
 print('PASS: 独立项目流转、不重复/不覆盖节点、冲突保护、清空截止日期、待定与城市保存、删除项目保留资源')
finally:
 for item in all_records():
  if item['id'] in created:
   status,_=request('DELETE',{'id':item['id'],'revision':item['revision']});assert status==200
 print('测试记录已清理')
