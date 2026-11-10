import { ADMIN_READ_COMMANDS, adminRead } from './admin'
import { State, Row, id, token, hash, ensure, text, userView, activeTask, audit, rate, record, member, manage, writable, activityView, articleChanged, AppError } from './model'
export interface Context { now:number; sessionHash?:string; identity?:string; sessionToken?:string; adminLogin?:boolean; source?:string }
export function authenticate(s:State,c:Context,admin=false) {
 const session=s.sessions.find(x=>x.hash===c.sessionHash&&x.expires>c.now&&!x.revoked&&x.admin===admin)
 ensure(session,'请重新登录',401,'LOGIN');
 if(admin)return {id:session.userId,admin:true}
 const u=s.users.find(x=>x.id===session.userId);ensure(u&&u.state==='active','账号不可用',403,'DISABLED');return u
}
export function execute(s:State,command:string,b:Row,c:Context):any {
 const now=c.now
 if(command==='auth.login') {
  ensure(c.identity&&c.sessionToken,'微信身份验证失败',401)
  rate(s,'login:'+c.source,30,3600000,now)
  let u=s.users.find(x=>x.identity===c.identity)
  if(!u){u={id:id(),identity:c.identity,name:'',state:'active',balance:0,frozen:0,createdAt:now,aiPaused:false,giftClaimed:true};s.users.push(u);record(s,u,s.config.gift,0,'gift','gift:'+u.id,now,'新用户一次性赠点')}
  ensure(u.state==='active','账号已停用',403);s.sessions=s.sessions.filter(x=>x.expires>now)
  s.sessions.push({hash:hash(c.sessionToken),userId:u.id,admin:false,expires:now+30*86400000})
  return {token:c.sessionToken,user:userView(u)}
 }
 if(command==='admin.login') {
  ensure(c.adminLogin&&c.sessionToken,'管理员登录失败',401);rate(s,'admin-login:'+c.source,8,3600000,now)
  s.sessions.push({hash:hash(c.sessionToken),userId:'platform-admin',admin:true,expires:now+8*3600000});audit(s,'platform-admin','login','platform','管理员登录',now);return {token:c.sessionToken}
 }
 const admin=command.startsWith('admin.');const u=authenticate(s,c,admin)
 if(command==='auth.logout'||command==='admin.logout'){s.sessions=s.sessions.filter(x=>x.hash!==c.sessionHash);return {loggedOut:true}}
 if(command==='me')return userView(u)
 // Mutating requests are deduplicated in the same transaction as their effect.
 const readOnly=['me','activities.list','activity.get','invite.preview','members.list','materials.list','articles.list','article.get','tasks.get','points.list',...ADMIN_READ_COMMANDS]
 const mutation=!readOnly.includes(command)
 let requestKey=''
 if(mutation){ensure(typeof b.requestId==='string'&&/^[a-zA-Z0-9_-]{12,100}$/.test(b.requestId),'缺少有效操作标识');requestKey=u.id+':'+command+':'+b.requestId;const old=s.requests.find(x=>x.key===requestKey);if(old){ensure(old.bodyHash===hash(JSON.stringify(b)),'重复请求参数不同',409);return old.result}}
 const run=():any=>{
 if(admin)return adminCommand(s,command,b,c,u)
 if(command==='profile.update'){u.name=text(b.name,30,true);return userView(u)}
 if(command==='points.list')return {user:userView(u),items:s.ledger.filter(x=>x.userId===u.id).slice().reverse().slice(Number(b.offset)||0,(Number(b.offset)||0)+30)}
 if(command==='activities.list')return s.activities.filter(a=>a.members.some((m:Row)=>m.userId===u.id&&!m.removed)).map(a=>activityView(a,u.id,s)).reverse()
 if(command==='activity.create'){
  ensure(u.name,'请先填写显示姓名');rate(s,'create:'+u.id,5,3600000,now);ensure(s.activities.filter(a=>a.ownerId===u.id).length<s.config.maxActivities,'活动数量达到上限')
  const a={id:id(),name:text(b.name,80,true),description:text(b.description,2000),announcement:'',ownerId:u.id,status:'collecting',createdAt:now,revision:1,
   inviteCode:newInvite(s),aiPaused:false,members:[{userId:u.id,role:'owner',ai:true,joinedAt:now}],materials:[],versions:[],finalId:null,shareHash:null,shareVersion:null}
  s.activities.push(a);return activityView(a,u.id,s)
 }
 if(command==='invite.preview'||command==='activity.join'){
  rate(s,'invite:'+u.id,30,3600000,now);const a=s.activities.find(x=>x.inviteCode===b.inviteCode);ensure(a,'邀请不存在或已失效',404,'INVITE')
  const m=a.members.find((m:Row)=>m.userId===u.id);ensure(!m?.removed,'你已被移出该活动，请联系发起人',403)
  if(command==='invite.preview')return {id:a.id,name:a.name,description:a.description,status:a.status,joined:!!m,memberCount:a.members.filter((m:Row)=>!m.removed).length}
  ensure(u.name,'请先填写显示姓名');if(!m){writable(a);a.members.push({userId:u.id,role:'participant',ai:false,joinedAt:now})}return activityView(a,u.id,s)
 }
 const a=s.activities.find(x=>x.id===b.activityId);ensure(a,'活动不存在',404);const m=member(a,u.id)
 if(command==='activity.get')return activityView(a,u.id,s)
 if(command==='activity.update'){
  manage(a,u.id);if(b.status!==undefined){manage(a,u.id,true);ensure(['collecting','paused','archived'].includes(b.status),'状态无效');a.status=b.status}
  if(b.name!==undefined||b.description!==undefined||b.announcement!==undefined){writable(a);if(b.name!==undefined)a.name=text(b.name,80,true);if(b.description!==undefined)a.description=text(b.description,2000);if(b.announcement!==undefined)a.announcement=text(b.announcement,1000);a.revision++}
  return activityView(a,u.id,s)
 }
 if(command==='invite.reset'){manage(a,u.id,true);writable(a);a.inviteCode=newInvite(s);audit(s,u.id,command,a.id,'重置邀请',now);return {inviteCode:a.inviteCode}}
 if(command==='members.list')return a.members.filter((x:Row)=>!x.removed).map((x:Row)=>({userId:x.userId,name:s.users.find(y=>y.id===x.userId)?.name||'待认领成员',role:x.role,ai:x.ai,joinedAt:x.joinedAt}))
 if(command==='member.update'){
  manage(a,u.id,true);writable(a);const target=a.members.find((x:Row)=>x.userId===b.userId);ensure(target&&target.role!=='owner','不能修改发起人');
  if(b.remove===true){target.removed=true;target.ai=false}else{ensure(['participant','collaborator'].includes(b.role),'成员角色无效');target.role=b.role;target.ai=b.role==='collaborator'&&b.ai===true;target.removed=false}
  audit(s,u.id,command,b.userId,'活动角色或授权变更',now);return {updated:true}
 }
 if(command==='materials.list'){
  const all=a.materials;const offset=Math.max(0,Number(b.offset)||0);ensure(offset<100000,'分页无效');const items=all.slice(Math.max(0,all.length-offset-30),all.length-offset)
  return {items:items.map((x:Row)=>x.withdrawn?{id:x.id,withdrawn:true,userId:x.userId,name:x.name,createdAt:x.createdAt}:{...x,images:x.images.map((path:string)=>({path})),state:m.role==='participant'?undefined:x.state}),hasMore:all.length>offset+30,revision:a.revision}
 }
 if(command==='upload.prepare'){
  ensure(a.status==='collecting','当前活动不接受新资料',409);rate(s,'upload:'+u.id,60,3600000,now)
  const size=Number(b.size);ensure(Number.isSafeInteger(size)&&size>0&&size<=s.config.maxImageBytes,'图片大小超限');ensure(['image/jpeg','image/png','image/webp'].includes(b.mime),'仅支持 JPEG、PNG、WebP 图片')
  const reservations=s.uploads.filter(x=>!x.deleted&&(x.used||x.expires>now));const bytes=(items:Row[])=>items.reduce((n,x)=>n+(x.used?x.size:s.config.maxImageBytes),0);ensure(bytes(reservations.filter(x=>x.activityId===a.id))+s.config.maxImageBytes<=s.config.maxStorageBytes,'活动图片容量已满');ensure(bytes(reservations.filter(x=>x.userId===u.id))+s.config.maxImageBytes<=s.config.maxUserStorageBytes,'个人图片容量已满');ensure(bytes(reservations)+s.config.maxImageBytes<=s.config.maxPlatformStorageBytes,'平台图片容量暂不足')
  const upload={id:id(),activityId:a.id,userId:u.id,path:`${a.id}/${id()}.${b.mime==='image/png'?'png':b.mime==='image/webp'?'webp':'jpg'}`,size,mime:b.mime,complete:false,used:false,expires:now+7200000};s.uploads.push(upload);return upload
 }
 if(command==='upload.complete'){const upload=s.uploads.find(x=>x.id===b.uploadId&&x.userId===u.id&&x.activityId===a.id&&!x.deleted);ensure(upload&&upload.expires>now,'上传凭证已失效');ensure(a.status==='collecting','活动已暂停，资料尚未提交',409);upload.complete=true;return {id:upload.id,path:upload.path}}
 if(command==='material.send'){
  ensure(a.status==='collecting','当前活动不接受新资料',409);rate(s,'send:'+u.id,120,3600000,now);ensure(a.materials.length<s.config.maxMaterials,'资料数量达到上限')
  const content=text(b.text,s.config.maxText);ensure(Array.isArray(b.uploadIds)&&b.uploadIds.length<=s.config.maxImages,'每次图片数超限');ensure(new Set(b.uploadIds).size===b.uploadIds.length,'图片重复')
  const uploads=b.uploadIds.map((uploadId:string)=>{const f=s.uploads.find(x=>x.id===uploadId&&x.activityId===a.id&&x.userId===u.id&&x.complete&&!x.used&&!x.deleted&&x.expires>now);ensure(f,'图片不可用，请重新选择');return f})
  ensure(content||uploads.length,'请输入文字或图片');const item={id:id(),userId:u.id,name:u.name,text:content,images:uploads.map((x:Row)=>x.path),state:'auto',createdAt:now,withdrawn:false};a.materials.push(item);uploads.forEach((x:Row)=>{x.used=true;x.materialId=item.id});a.revision++;return {id:item.id}
 }
 if(command==='material.withdraw'){writable(a);const material=a.materials.find((x:Row)=>x.id===b.materialId);ensure(material&&material.userId===u.id,'只能撤回自己的资料',403);material.withdrawn=true;material.text='';material.images=[];a.revision++;return {withdrawn:true}}
 if(command==='materials.select'){manage(a,u.id);writable(a);ensure(['auto','include','exclude'].includes(b.state)&&Array.isArray(b.ids)&&b.ids.length<=500,'选材参数无效');for(const materialId of b.ids){const material=a.materials.find((x:Row)=>x.id===materialId&&!x.withdrawn);ensure(material,'资料已不存在');material.state=b.state}a.revision++;return {revision:a.revision}}
 if(command==='task.quote'){
  aiPermission(s,a,u);ensure(b.tone===undefined||['自然温暖','正式纪实','轻松活泼'].includes(b.tone),'语气选项无效');rate(s,'quote:'+u.id,30,3600000,now);ensure(['smart','specified'].includes(b.mode),'选材方式无效');const materials=a.materials.filter((x:Row)=>!x.withdrawn&&x.state!=='exclude'&&(b.mode==='smart'||x.state==='include'))
  ensure(materials.length,'没有可用资料，请先指定素材');const images=materials.flatMap((x:Row)=>x.images)
  ensure(images.length<=s.config.maxTaskImages,'图片超出本次任务上限，请调整选材');ensure(materials.reduce((n:number,x:Row)=>n+x.text.length,0)<=s.config.maxInput,'文字超出单次上限，请调整选材')
  const visionEnabled=s.config.visionEnabled===true;ensure(visionEnabled||!images.length||materials.some((x:Row)=>x.text.trim())||a.description.trim(),'暂未启用识图，请补充活动说明或图片文字说明');const uncached=visionEnabled?images.filter((p:string)=>!s.cache.some(x=>x.path===p&&x.activityId===a.id&&x.model===process.env.VISION_MODEL)):[];const price=s.config.writing+uncached.length*s.config.perImage
  const q={id:id(),activityId:a.id,userId:u.id,ownerId:a.ownerId,revision:a.revision,configVersion:s.config.version,config:structuredClone(s.config),price,createdAt:now,expires:now+300000,
   snapshot:{name:a.name,description:a.description,materials:structuredClone(materials)},visionEnabled,uncached,mode:b.mode,length:Math.min(1500,Math.max(300,Number(b.length)||800)),tone:text(b.tone,30)||'自然温暖',focus:text(b.focus,500),model:process.env.WRITING_MODEL||'deepseek-flash',visionModel:process.env.VISION_MODEL||''}
  const inputBound=Buffer.byteLength(JSON.stringify(q.snapshot),'utf8')+images.length*5000+5000;const costBoundCents=Math.max(1,Math.ceil((inputBound*s.config.writingInputCentsPerMillion+s.config.maxOutput*s.config.writingOutputCentsPerMillion)/1000000)+uncached.length*s.config.visionImageMaxCents);Object.assign(q,{costBoundCents});
  s.quotes.push(q);return {id:q.id,price,images:images.length,visionEnabled,pendingImages:uncached.length,texts:materials.filter((x:Row)=>x.text).length,balance:s.users.find(x=>x.id===a.ownerId)?.balance,expires:q.expires}
 }
 if(command==='task.start'){
  aiPermission(s,a,u);const q=s.quotes.find(x=>x.id===b.quoteId&&x.activityId===a.id&&x.userId===u.id);ensure(q&&q.expires>now,'报价已过期，请重新确认',409,'QUOTE')
  const running=s.tasks.find(x=>x.activityId===a.id&&activeTask(x));if(running)return taskView(running)
  ensure(q.revision===a.revision&&q.configVersion===s.config.version,'素材或计价规则已变化，请重新确认',409,'QUOTE');ensure(s.config.confirmed&&s.config.enabled,'AI 服务尚未开放或已暂停',409,'AI_PAUSED')
  const owner=s.users.find(x=>x.id===a.ownerId)!;ensure(owner.state==='active'&&!owner.aiPaused,'发起人 AI 权限不可用',403)
  rate(s,'task:'+owner.id,s.config.dailyTasks,86400000,now)
  const today=day(now),month=today.slice(0,7),tasks=s.tasks;ensure(tasks.filter(x=>x.ownerId===owner.id&&activeTask(x)).length<s.config.maxUserConcurrent,'发起人有任务正在进行',409)
  ensure(tasks.filter(activeTask).length<s.config.maxPlatformConcurrent,'平台繁忙，请稍后重试',429)
  ensure(tasks.filter(x=>x.ownerId===owner.id&&day(x.createdAt)===today&&x.stage!=='failed').reduce((n,x)=>n+x.price,0)+q.price<=s.config.dailyPoints,'今日点数使用达到上限',429)
  const reserve=q.costBoundCents;ensure(reserve<=s.config.taskReserveCents,'本次输入超出单任务成本限额，请减少选材');const budget=(prefix:string)=>budgetUsage(s,prefix)
  ensure(budget(today)+reserve<=s.config.dailyBudget&&(s.config.monthlyBudget===0||budget(month)+reserve<=s.config.monthlyBudget),'平台 AI 预算不足，请稍后再试',429,'BUDGET')
  const task={...structuredClone(q),id:id(),quoteId:q.id,ownerId:a.ownerId,createdAt:now,stage:'queued',reserveCents:reserve,costCents:0,input:q.snapshot,usage:[],results:{},lease:null}
  record(s,owner,-q.price,q.price,'freeze',task.id,now,'AI 任务预扣');s.tasks.push(task);return taskView(task)
 }
 if(command==='tasks.get'){const task=s.tasks.find(x=>x.id===b.taskId&&x.activityId===a.id);ensure(task&&m.role!=='participant','任务不可访问',403);return taskView(task)}
 if(command==='articles.list'){ensure(m.role!=='participant','无版本管理权限',403);return a.versions.map((x:Row)=>({id:x.id,title:x.title,status:x.status,createdAt:x.createdAt,revision:x.revision}))}
 if(command==='article.get'){
  const v=b.versionId?a.versions.find((x:Row)=>x.id===b.versionId):a.versions[a.versions.length-1];if(!v)return null
  ensure(m.role!=='participant'||a.membersVisible&&(!b.versionId||b.versionId===a.finalId),'文章暂未向成员开放',403)
  return {...v,usedDetails:(v.usedIds||[]).map((mid:string)=>{const x=a.materials.find((x:Row)=>x.id===mid);return x?{id:x.id,name:x.name,text:x.text,withdrawn:x.withdrawn}:{id:mid,text:'资料已不可用'}}),changed:articleChanged(a,v),membersVisible:a.membersVisible,shareEnabled:!!a.shareHash,publishedUrl:a.publishedUrl,publishedAt:a.publishedAt,publishedVersion:a.publishedVersion}
 }
 if(command==='article.save'){
  manage(a,u.id);writable(a);const previous=a.versions[a.versions.length-1];ensure(previous&&previous.revision===b.revision,'文章已被其他管理者修改，请保留修改并刷新',409,'VERSION_CONFLICT')
  const images=Array.isArray(b.images)?b.images:[];ensure(images.length<=s.config.maxTaskImages,'配图数量超限');for(const img of images)ensure(previous.availableImages.includes(img.path),'只能使用当前版本可用图片')
  const v={...structuredClone(previous),id:id(),title:text(b.title,160,true),body:text(b.body,15000,true),images:images.map((x:Row)=>({path:x.path,caption:text(x.caption,300)})),status:'draft',revision:previous.revision+1,createdAt:now,editorId:u.id};a.versions.push(v);return v
 }
 if(command==='article.restore'){
  manage(a,u.id);writable(a);const source=a.versions.find((x:Row)=>x.id===b.versionId);ensure(source,'版本不存在');const latest=a.versions[a.versions.length-1];ensure(latest.revision===b.revision,'文章已更新，请刷新',409,'VERSION_CONFLICT');const v={...structuredClone(source),id:id(),revision:latest.revision+1,status:'draft',createdAt:now,editorId:u.id};a.versions.push(v);return v
 }
 if(command==='article.finalize'){
  manage(a,u.id);writable(a);const v=a.versions[a.versions.length-1];ensure(v&&v.revision===b.revision,'文章版本已更新',409);ensure(b.reviewed===true,'请确认已核对事实与素材变化');v.status='final';v.reviewedRevision=a.revision;a.finalId=v.id;return {finalId:v.id}
 }
 if(command==='article.visibility'){manage(a,u.id);writable(a);a.membersVisible=b.visible===true;return {visible:a.membersVisible}}
 if(command==='article.share'){
  manage(a,u.id);if(b.enabled===false){a.shareHash=null;a.shareVersion=null;return {enabled:false}}
  ensure(a.finalId,'请先定稿后分享');const secret=token();a.shareHash=hash(secret);a.shareVersion=a.finalId;return {token:secret,enabled:true}
 }
 if(command==='article.publish'){manage(a,u.id);writable(a);ensure(a.finalId,'请先定稿');const url=text(b.url,1000);ensure(!url||/^https:\/\/mp\.weixin\.qq\.com\//.test(url),'请填写有效公众号文章链接');a.publishedUrl=url;a.publishedAt=now;a.publishedVersion=a.finalId;return {published:true}}
 throw new AppError('操作不存在',404)
 }
 const result=run();if(mutation)s.requests.push({key:requestKey,bodyHash:hash(JSON.stringify(b)),result,at:now});return result
}
export function budgetUsage(s:State,prefix:string){return s.tasks.reduce((n,t)=>n+(activeTask(t)?t.reserveCents:day(t.finishedAt||t.createdAt).startsWith(prefix)?t.costCents||0:0),0)}
export function day(now:number){return new Date(now+8*3600000).toISOString().slice(0,10)}
function newInvite(s:State){for(let i=0;i<20;i++){const n=String(100000+parseInt(token().replace(/[^0-9]/g,'').slice(0,8)||'123456',10)%900000);if(!s.activities.some(x=>x.inviteCode===n))return n}throw new AppError('邀请码生成失败，请重试',503)}
function aiPermission(s:State,a:Row,u:Row){ensure(s.users.some(x=>x.id===a.ownerId&&x.state==='active'),'发起人身份尚未核验或账号不可用',403);const m=manage(a,u.id);writable(a);ensure(m.role==='owner'||m.ai,'请先获得发起人的 AI 消费授权',403);ensure(!u.aiPaused&&!a.aiPaused,'AI 权限已暂停',403)}
export function taskView(t:Row){return {id:t.id,activityId:t.activityId,stage:t.stage,price:t.price,createdAt:t.createdAt,error:t.error,usedIds:t.usedIds,omitted:t.omitted}}
function adminCommand(s:State,command:string,b:Row,c:Context,u:Row):any {
 const now=c.now,reason=()=>text(b.reason,1000,true)
 if(ADMIN_READ_COMMANDS.includes(command))return adminRead(s,command,b,now,prefix=>budgetUsage(s,prefix),day(now))
 if(command==='admin.points'){
  const target=s.users.find(x=>x.id===b.userId);ensure(target,'用户不存在',404);ensure(Number.isSafeInteger(b.delta)&&b.delta!==0,'点数须为非零整数');ensure(target.balance===b.expectedBalance,'余额已变化，请重新核对',409);const why=reason();record(s,target,b.delta,0,'adjust',b.requestId,now,why);audit(s,u.id,command,target.id,why,now);return userView(target)
 }
 if(command==='admin.user'){
  const target=s.users.find(x=>x.id===b.userId);ensure(target,'用户不存在',404);const why=reason();if(b.state!==undefined){ensure(['active','disabled'].includes(b.state),'状态无效');target.state=b.state}if(b.aiPaused!==undefined)target.aiPaused=b.aiPaused===true;audit(s,u.id,command,target.id,why,now);return userView(target)
 }
 if(command==='admin.activity'){const a=s.activities.find(x=>x.id===b.activityId);ensure(a,'活动不存在');a.aiPaused=b.aiPaused===true;audit(s,u.id,command,a.id,reason(),now);return {updated:true}}
 if(command==='admin.configure'){
  const why=reason();ensure(b.values&&typeof b.values==='object','配置参数无效');ensure(b.version===s.config.version,'配置已更新，请重新加载',409);const candidate={...s.config}
  for(const k of Object.keys(candidate)){if(k==='version')continue;if(b.values[k]===undefined)continue;if(typeof candidate[k]==='boolean'){ensure(typeof b.values[k]==='boolean','配置类型无效');candidate[k]=b.values[k]}else{ensure(Number.isSafeInteger(b.values[k])&&b.values[k]>=0&&b.values[k]<=1000000000000,'配置数值无效');candidate[k]=b.values[k]}}
  ensure(candidate.maxTaskImages>0&&candidate.maxTaskImages<=30&&candidate.maxMaterials>0&&candidate.maxMaterials<=5000&&candidate.maxActivities>0&&candidate.maxActivities<=1000,'容量参数超出支持范围');
  ensure(candidate.maxImages>0&&candidate.maxImages<=6&&candidate.maxImageBytes>0&&candidate.maxImageBytes<=10485760&&candidate.maxText>0&&candidate.maxInput>0&&candidate.maxOutput>0&&candidate.maxOutput<=8000,'输入限额超出支持范围')
  ensure(!candidate.enabled||candidate.writingInputCentsPerMillion>0&&candidate.writingOutputCentsPerMillion>0&&(!candidate.visionEnabled||candidate.visionImageMaxCents>0&&candidate.visionInputCentsPerMillion>0&&candidate.visionOutputCentsPerMillion>0),'开启前请填写供应商价格及图片成本上限');
  ensure(!candidate.enabled||candidate.confirmed&&candidate.dailyBudget>0&&candidate.taskReserveCents>0,'开启前请确认规则和成本预算');s.configHistory.push({config:structuredClone(s.config),reason:why,actor:u.id,at:now});candidate.version++;s.config=candidate;audit(s,u.id,command,String(candidate.version),why,now);return candidate
 }
 if(command==='admin.resolve'){
  const t=s.tasks.find(x=>x.id===b.taskId);ensure(t&&t.stage==='review','任务不是待核实状态');const why=reason();ensure(['failed','delivered'].includes(b.outcome),'核实结果无效');if(b.outcome==='delivered')ensure(t.results?.body,'尚无可恢复结果，请先核对供应商记录');
  if(b.outcome==='failed')finishFailure(s,t,now,'人工核实后退还冻结点数');else completeTask(s,t,now);audit(s,u.id,command,t.id,why,now);return taskView(t)
 }
 throw new AppError('管理操作不存在',404)
}
export function finishFailure(s:State,t:Row,now:number,error:string){if(['failed','succeeded'].includes(t.stage))return;const owner=s.users.find(u=>u.id===t.ownerId)!;record(s,owner,t.price,-t.price,'refund',t.id,now,error);t.stage='failed';t.error=error;t.finishedAt=now;t.lease=null}
export function completeTask(s:State,t:Row,now:number){
 if(t.stage==='succeeded')return;ensure(t.results?.body,'缺少完整草稿');const a=s.activities.find(x=>x.id===t.activityId)!;const previous=a.versions[a.versions.length-1];
 const paths=t.input.materials.flatMap((m:Row)=>m.images);const images=(t.results.images||paths).map((path:string)=>({path,caption:''}));
 const v={id:id(),taskId:t.id,title:t.results.title,body:t.results.body,images,availableImages:paths,status:'draft',revision:(previous?.revision||0)+1,sourceRevision:t.revision,createdAt:now,usedIds:t.usedIds||t.input.materials.map((m:Row)=>m.id),omitted:t.omitted||[]};a.versions.push(v)
 const owner=s.users.find(u=>u.id===t.ownerId)!;record(s,owner,0,-t.price,'settle',t.id,now,'已交付完整草稿');t.stage='succeeded';t.finishedAt=now;t.lease=null
}
