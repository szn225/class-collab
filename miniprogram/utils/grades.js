// One atomic document per identity/student; all legacy storage keys live inside it.
const PREFIX='hui.grades.'
let demoMode=false
const clone=v=>JSON.parse(JSON.stringify(v))
const uid=()=> 'g_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,14)
function identity(){const a=typeof getApp==='function'?getApp():{globalData:{}};return a.globalData.sessionToken&&a.globalData.userInfo?.id?'user.'+a.globalData.userInfo.id:'guest'}
function registry(){const key=PREFIX+'students.'+identity();let r=wx.getStorageSync(key);if(!r||!Array.isArray(r.students)||!r.students.length){r={active:uid(),students:[]};r.students=[{id:r.active,name:'学生 1'}];wx.setStorageSync(key,r)}return r}
function setRegistry(r){wx.setStorageSync(PREFIX+'students.'+identity(),r)}
function scopeKey(){if(demoMode)return PREFIX+'demo.student.sample';const r=registry();return PREFIX+identity()+'.student.'+r.active}
function assertScope(key){if(scopeKey()!==key)throw new Error('账号或学生已切换，请重新打开页面')}
async function guardAwait(p,key){const value=await p;assertScope(key);return value}
function read(key=scopeKey()){if(staged&&staged.key===key)return staged.doc;return wx.getStorageSync(key)||{values:{},generation:0,revision:0,syncedGeneration:0,enabled:false}}
function write(doc,key=scopeKey()){if(staged&&staged.key===key){staged.doc=doc;return}wx.setStorageSync(key,doc)}
function bind(key=scopeKey()) {return {
 getStorageSync(k){assertScope(key);const d=read(key);return (k==='track_events'?d.localValues?.[k]:d.values[k])??''},
 setStorageSync(k,v){assertScope(key);if(demoMode)throw new Error('示例为只读内容，请返回使用我的资料');const d=read(key);if(k==='track_events'){d.localValues={...(d.localValues||{}),[k]:clone(v)};write(d,key);return}d.values[k]=clone(v);d.generation++;write(d,key);schedule()},
 removeStorageSync(k){assertScope(key);if(demoMode)throw new Error('示例为只读内容，请返回使用我的资料');const d=read(key);delete d.values[k];d.generation++;write(d,key);schedule()},
}}
let staged=null
function transaction(fn){const key=scopeKey();if(staged)throw new Error('不支持嵌套存储事务');staged={key,doc:clone(read(key))};try{const result=fn();assertScope(key);const doc=staged.doc;staged=null;write(doc,key);schedule();return result}finally{staged=null}}
const storage={transaction,getStorageSync:k=>bind().getStorageSync(k),setStorageSync:(k,v)=>bind().setStorageSync(k,v),removeStorageSync:k=>bind().removeStorageSync(k),bind}
function students(){return demoMode?{active:'sample',students:[{id:'sample',name:'示例学生'}]}:registry()}
function startDemo(values){wx.setStorageSync(PREFIX+'demo.student.sample',{values:clone(values),generation:0,revision:0,syncedGeneration:0,enabled:false});demoMode=true}
function stopDemo(){demoMode=false}
function isDemo(){return demoMode}
function addStudent(name){name=String(name||'').trim();if(!name||name.length>30)throw new Error('请填写 1–30 字的学生称呼');const r=registry();if(r.students.length>=20)throw new Error('最多管理 20 个学生档案');r.active=uid();r.students.push({id:r.active,name});setRegistry(r);return r}
function selectStudent(id){const r=registry();if(!r.students.some(s=>s.id===id))throw new Error('学生档案不存在');r.active=id;setRegistry(r)}
function decode(v,fallback){if(v==null||v==='')return fallback;if(typeof v==='string'){try{return JSON.parse(v)}catch{return fallback}}return v}
function count(key=scopeKey()){return decode(read(key).values.records,[]).length}
function guestInfo(){const r=wx.getStorageSync(PREFIX+'students.guest');return r?.students?.map(s=>({...s,count:count(PREFIX+'guest.student.'+s.id)}))||[]}
function importGuest(studentId){
 if(identity()==='guest')throw new Error('请先登录');const source=read(PREFIX+'guest.student.'+studentId),key=scopeKey(),target=read(key)
 const values=clone(target.values),empty=!Object.keys(values).length
 for(const field of ['records','plans']){
  const incoming=decode(source.values[field],[]),existing=decode(values[field],[]),result=existing.slice()
  for(const item of incoming){const old=result.find(x=>x.id===item.id);if(old&&JSON.stringify(old)!==JSON.stringify(item))throw new Error('存在同编号不同内容的记录，请导出备份后分别保留到不同学生档案');if(!old)result.push(item)}
  values[field]=field==='records'?JSON.stringify(result):result
 }
 // Keep current student preferences when merging into an existing student.
 for(const [k,v]of Object.entries(source.values))if(!['records','plans','datasets'].includes(k)&&(empty||values[k]===undefined))values[k]=v
 const datasets=decode(values.datasets,[])
 for(const ds of decode(source.values.datasets,[])){const old=datasets.find(d=>d.dataVersion===ds.dataVersion);if(old&&JSON.stringify(old)!==JSON.stringify(ds))throw new Error('相同参照版本内容不同，请分别导入不同学生档案');if(!old)datasets.push(ds)}
 values.datasets=JSON.stringify(datasets)
 target.values=values;target.generation++;write(target,key);schedule();return count(key)
}
async function api(command,data){return require('./v2').call('grades.'+command,data)}
async function refreshStudents(){if(identity()==='guest')return;const key=scopeKey(),result=await guardAwait(api('students.list',{}),key),r=registry();if(result.length&&r.students.length===1&&!Object.keys(read().values).length&&!result.some(s=>s.id===r.active)){r.students=[];r.active=result[0].id}for(const s of result)if(!r.students.some(x=>x.id===s.id))r.students.push(s);setRegistry(r)}
let timer=null,inflight=null
function schedule(){clearTimeout(timer);const d=read();if(d.enabled&&(d.pending||d.generation!==d.syncedGeneration))timer=setTimeout(()=>sync().catch(()=>{}),1200)}
function status(){const d=read();return {enabled:d.enabled,dirty:d.generation!==d.syncedGeneration,pending:!!d.pending,conflict:!!d.conflict,error:d.error||'',count:count()}}
async function enableSync(){
 if(demoMode)throw new Error('示例不参与云端同步');if(identity()==='guest')throw new Error('请先登录')
 const key=scopeKey(),r=registry(),student=r.students.find(s=>s.id===r.active)
 await guardAwait(api('students.create',{student}),key)
 const remote=await guardAwait(api('workspace.get',{studentId:r.active}),key),d=read(key)
 const durable=count(key)>0||decode(d.values.plans,[]).length>0||Object.keys(decode(d.values.settings,{})).length>0
 if(remote.revision!==d.revision&&durable&&JSON.stringify(remote.values)!==JSON.stringify(d.values)){
  d.conflict=remote;d.enabled=true;write(d,key);return {conflict:true}
 }
 if(remote.revision!==d.revision){
  const draft={};for(const field of ['exam_draft','last_exam_profile'])if(d.values[field]!==undefined)draft[field]=d.values[field]
  d.values={...remote.values,...draft};d.generation++;d.syncedGeneration=Object.keys(draft).length?d.generation-1:d.generation
 }
 d.revision=remote.revision;d.enabled=true;write(d,key);return sync()
}
async function runSync(){const key=scopeKey();if(identity()==='guest')throw new Error('请先登录');let d=read(key);if(!d.enabled||d.conflict)return status();const studentId=registry().active
 try{
  if(!d.pending&&d.generation===d.syncedGeneration){const remote=await guardAwait(api('workspace.get',{studentId}),key);d=read(key);if(remote.revision>d.revision){if(d.generation!==d.syncedGeneration){d.conflict=remote;write(d,key);return status()}d.values=remote.values;d.revision=remote.revision;d.generation++;d.syncedGeneration=d.generation;write(d,key)}return status()}
  if(!d.pending){d.pending={operationId:uid(),expectedRevision:d.revision,values:clone(d.values),generation:d.generation};write(d,key)}
  const pending=clone(d.pending),result=await guardAwait(api('workspace.save',{studentId,...pending}),key);d=read(key)
  if(result.conflict){d.conflict=result;d.pending=null;write(d,key);return status()}
  d.revision=result.revision;d.syncedGeneration=pending.generation;d.pending=null;d.error='';write(d,key);if(d.generation!==d.syncedGeneration)schedule();return status()
 }catch(e){if(scopeKey()===key){d=read(key);d.error=e.message||'同步失败，请重试';write(d,key)}throw e}
}
function sync(){const key=scopeKey();if(inflight?.key===key)return inflight.promise;const promise=runSync().finally(()=>{if(inflight?.promise===promise)inflight=null});inflight={key,promise};return promise}
function conflictBackups(){return wx.getStorageSync(scopeKey()+'.conflictBackups')||[]}
function restoreConflictBackup(id,side){const item=conflictBackups().find(x=>x.id===id);if(!item||!['local','remote'].includes(side))throw new Error('备份不存在');const snapshot=wx.getStorageSync(scopeKey()+'.conflictBackup.'+id),d=read();d.values=clone(snapshot[side]);d.generation++;d.pending=null;d.conflict=null;d.enabled=false;d.error='';write(d)}
function scopedTimeout(fn,delay){const key=scopeKey();return setTimeout(()=>{if(scopeKey()===key)fn()},delay)}
function resolveConflict(choice){const d=read();if(!d.conflict)return;const remote=d.conflict
 // Preserve both sides before a user-directed resolution, including deletion differences.
 const backupId=uid();wx.setStorageSync(scopeKey()+'.conflictBackup.'+backupId,{local:d.values,remote:remote.values});wx.setStorageSync(scopeKey()+'.conflictBackups',[...conflictBackups(),{id:backupId,time:new Date().toLocaleString()}])
 if(choice==='remote'){d.values=remote.values;d.generation++;d.syncedGeneration=d.generation}
 else if(choice!=='local')throw new Error('请选择保留本机或使用云端')
 d.revision=remote.revision;d.conflict=null;d.pending=null;d.error='';write(d);return sync()
}
function stopSync(){const d=read();d.enabled=false;write(d)}
let pageSync=null
function gradePage(definition){
 const load=definition.onLoad,show=definition.onShow,hide=definition.onHide,unload=definition.onUnload,initial=clone(definition.data||{})
 definition.onLoad=function(...args){this.gradeScope=scopeKey();const original=this.setData.bind(this);this.gradeSetData=original;this.setData=(data,cb)=>{if(scopeKey()===this.gradeScope)original(data,cb)};return load?.apply(this,args)}
 definition.onIdentityChanged=function(){this.gradeSetData?.(clone(initial))}
 definition.onShow=function(...args){
  if(this.gradeScope!==scopeKey()){this.gradeSetData(clone(initial));wx.redirectTo({url:'/packages/grades/pages/dashboard/index'});return}
  this.gradeVisible=true;const visit=this.gradeVisit=(this.gradeVisit||0)+1,key=this.gradeScope,token=getApp().globalData.sessionToken,d=read(),revision=d.revision
  // Render local records immediately; only refresh this still-visible view if cloud data changes.
  const local=show?.apply(this,args)
  const recent=pageSync&&pageSync.key===key&&pageSync.token===token&&Date.now()-pageSync.at<15000
  if(d.enabled&&(!recent||d.pending||d.generation!==d.syncedGeneration))sync().then(async()=>{
   if(scopeKey()!==key||getApp().globalData.sessionToken!==token)return
   let current=read();if(!current.conflict)pageSync={key,token,at:Date.now()}
   await local
   current=read(key)
   if(this.gradeVisible&&this.gradeVisit===visit&&scopeKey()===key&&getApp().globalData.sessionToken===token&&!current.conflict&&current.revision!==revision&&current.generation===current.syncedGeneration)await show?.apply(this,args)
  }).catch(()=>{})
  return local
 }
 definition.onHide=function(...args){this.gradeVisible=false;schedule();return hide?.apply(this,args)}
 definition.onUnload=function(...args){this.gradeVisible=false;this.gradeVisit=(this.gradeVisit||0)+1;return unload?.apply(this,args)}
 Page(definition)
}
module.exports={conflictBackups,restoreConflictBackup,scopedTimeout,startDemo,stopDemo,isDemo,uid,identity,scopeKey,assertScope,guardAwait,storage,students,addStudent,selectStudent,count,guestInfo,importGuest,refreshStudents,status,enableSync,sync,resolveConflict,stopSync,gradePage,read}
