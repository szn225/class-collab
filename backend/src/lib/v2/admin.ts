import { layoutDefaults } from './layout'
import { billingDefaults, pointUnits } from './billing'
import { State, Row, ensure, userView, activeTask } from './model'
export const ADMIN_READ_COMMANDS=['admin.overview','admin.operation.get','admin.users','admin.user.detail','admin.user.ledger','admin.tasks','admin.task.detail','admin.activities','admin.audit','admin.config']
const stages=['queued','vision','writing','review','succeeded','failed']
function query(b:Row){
 const page=Number(b.page??1),pageSize=Number(b.pageSize??20)
 ensure(Number.isSafeInteger(page)&&page>0&&page<=1000000&&Number.isSafeInteger(pageSize)&&pageSize>0&&pageSize<=100,'分页参数无效')
 ensure(b.search===undefined||typeof b.search==='string'&&b.search.length<=200,'搜索内容无效')
 const date=(v:unknown,end=false)=>{if(v===undefined||v==='')return undefined;ensure(typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v),'日期格式无效');const time=Date.parse(v+'T00:00:00+08:00');ensure(Number.isFinite(time)&&new Date(time+8*3600000).toISOString().slice(0,10)===v,'日期无效');return time+(end?86400000-1:0)}
 const from=date(b.from),to=date(b.to,true);ensure(from===undefined||to===undefined||from<=to,'开始日期不能晚于结束日期')
 return {page,pageSize,search:String(b.search||'').trim().toLocaleLowerCase(),from,to}
}
function pageRows(rows:Row[],q:ReturnType<typeof query>){const total=rows.length;return {items:rows.slice((q.page-1)*q.pageSize,q.page*q.pageSize),total,page:q.page,pageSize:q.pageSize}}
function ordered(rows:Row[],key='createdAt'){return rows.slice().sort((a,b)=>Number(b[key]||0)-Number(a[key]||0)||String(b.id).localeCompare(String(a.id)))}
function matches(row:Row,q:ReturnType<typeof query>,fields:string[],at='createdAt'){return (!q.search||fields.some(k=>String(row[k]??'').toLocaleLowerCase().includes(q.search)))&&(q.from===undefined||Number(row[at])>=q.from)&&(q.to===undefined||Number(row[at])<=q.to)}
function enumFilter(value:unknown,allowed:string[]){ensure(value===undefined||value===''||allowed.includes(String(value)),'筛选状态无效')}
const taskView=(t:Row,s:State)=>({id:t.id,activityId:t.activityId,activityName:s.activities.find(a=>a.id===t.activityId)?.name||'活动已不可用',ownerId:t.ownerId,ownerName:s.users.find(u=>u.id===t.ownerId)?.name||'',userId:t.userId,stage:t.stage,kind:t.kind||'writing',price:t.price,billingMode:t.billingMode||'fixed',chargedPoints:t.chargedPoints,returnedPoints:t.returnedPoints,billingVerified:t.billingVerified,platformCoveredPoints:t.platformCoveredPoints,billingRates:t.billingRates,costCents:t.costCents||0,reserveCents:t.reserveCents||0,usageCostCents:t.supplierCostUnverified||!Number.isFinite(t.supplierCostCents)?null:t.supplierCostCents,createdAt:t.createdAt,finishedAt:t.finishedAt||null,error:t.error||'',configVersion:t.configVersion,model:t.model||'',visionModel:t.visionEnabled?t.visionModel||'':'',canRestore:Boolean(t.results?.body&&t.results?.title&&(!t.withLayout||t.results?.layout?.html)),usage:(t.usage||[]).map((u:Row)=>({kind:u.kind,model:u.model||'',prompt_tokens:Number(u.prompt_tokens)||0,completion_tokens:Number(u.completion_tokens)||0,total_tokens:Number(u.total_tokens)||0}))})
export function adminRead(s:State,command:string,b:Row,now:number,usage:(prefix:string)=>number,today:string):any{
 if(command==='admin.operation.get'){ensure(typeof b.operationId==='string'&&/^[a-zA-Z0-9_-]{12,100}$/.test(b.operationId)&&['admin.points','admin.user','admin.activity','admin.configure','admin.resolve'].includes(b.command),'操作标识无效');const found=s.requests.find(r=>r.key==='platform-admin:'+b.command+':'+b.operationId);return found?{confirmed:true,result:found.result,at:found.at}:{confirmed:false}}
 if(command==='admin.config')return {current:{...billingDefaults,...layoutDefaults,...s.config},history:s.configHistory}
 if(command==='admin.overview'){
  const reserved=s.tasks.filter(activeTask).reduce((n,t)=>n+(t.reserveCents||0),0),period=(prefix:string,limit:number,unlimited=false)=>{const occupied=usage(prefix);return {period:prefix,limitCents:limit,occupiedCents:occupied,reservedCents:reserved,settledCents:Math.max(0,occupied-reserved),remainingCents:unlimited&&limit===0?null:Math.max(0,limit-occupied)}}
  return {users:s.users.length,activities:s.activities.length,tasks:s.tasks.map(t=>({id:t.id,activityId:t.activityId,stage:t.stage,kind:t.kind||'writing',price:t.price,billingMode:t.billingMode||'fixed',chargedPoints:t.chargedPoints,returnedPoints:t.returnedPoints,billingVerified:t.billingVerified,platformCoveredPoints:t.platformCoveredPoints,billingRates:t.billingRates,createdAt:t.createdAt})),config:s.config,balances:s.users.reduce((n,u)=>n+pointUnits(u.balance),0)/10,frozen:s.users.reduce((n,u)=>n+pointUnits(u.frozen),0)/10,costCents:s.tasks.reduce((n,t)=>n+(t.costCents||0),0),reservedCents:reserved,counts:Object.fromEntries(stages.map(k=>[k,s.tasks.filter(t=>t.stage===k).length])),budget:{timezone:'Asia/Shanghai',asOf:now,daily:period(today,s.config.dailyBudget),monthly:period(today.slice(0,7),s.config.monthlyBudget,true)}}
 }
 const q=query(b)
 if(command==='admin.users'){
  enumFilter(b.state,['active','disabled']);enumFilter(b.ai,['enabled','paused'])
  const users=ordered(s.users.filter(u=>matches(u,q,['id','name'])&&(!b.state||u.state===b.state)&&(!b.ai||(b.ai==='paused')===Boolean(u.aiPaused))))
  if(b.page===undefined)return users.map(u=>({...userView(u),createdAt:u.createdAt,ledger:s.ledger.filter(l=>l.userId===u.id),giftClaimed:u.giftClaimed}))
  return pageRows(users.map(u=>({...userView(u),createdAt:u.createdAt,giftClaimed:u.giftClaimed})),q)
 }
 if(command==='admin.user.detail'||command==='admin.user.ledger'){
  const u=s.users.find(u=>u.id===b.userId);ensure(u,'用户不存在',404)
  if(command==='admin.user.detail')return {...userView(u),createdAt:u.createdAt,giftClaimed:Boolean(u.giftClaimed),activityCount:s.activities.filter(a=>a.ownerId===u.id).length,taskCount:s.tasks.filter(t=>t.ownerId===u.id).length}
  return pageRows(ordered(s.ledger.filter(l=>l.userId===u.id&&matches(l,q,['id','kind','ref','reason'],'at')),'at').map(l=>({id:l.id,userId:l.userId,kind:l.kind,amount:l.amount,frozen:l.frozen,before:l.before,after:l.after,ref:l.ref,at:l.at,reason:l.reason})),q)
 }
 if(command==='admin.tasks'||command==='admin.task.detail'){
  if(command==='admin.task.detail'){const t=s.tasks.find(t=>t.id===b.taskId);ensure(t,'任务不存在',404);return taskView(t,s)}
  enumFilter(b.stage,[...stages,'active'])
  const rows=ordered(s.tasks).map(t=>taskView(t,s)).filter(t=>matches(t,q,['id','activityId','activityName','ownerId','ownerName'])&&(!b.stage||(b.stage==='active'?['queued','vision','writing','review'].includes(t.stage):t.stage===b.stage))&&(!b.userId||t.ownerId===b.userId)&&(!b.activityId||t.activityId===b.activityId))
  return b.page===undefined?rows:pageRows(rows,q)
 }
 if(command==='admin.activities'){
  enumFilter(b.status,['collecting','paused','archived']);enumFilter(b.ai,['enabled','paused'])
  const rows=ordered(s.activities).map(a=>({id:a.id,name:a.name,ownerId:a.ownerId,ownerName:s.users.find(u=>u.id===a.ownerId)?.name||'',status:a.status,aiPaused:Boolean(a.aiPaused),members:a.members.filter((m:Row)=>!m.removed).length,materials:a.materials.length,createdAt:a.createdAt})).filter(a=>matches(a,q,['id','name','ownerId','ownerName'])&&(!b.status||a.status===b.status)&&(!b.ai||(b.ai==='paused')===a.aiPaused)&&(!b.userId||a.ownerId===b.userId))
  return b.page===undefined?rows:pageRows(rows,q)
 }
 if(command==='admin.audit'){
  const rows=ordered(s.audit,'at').filter(a=>matches(a,q,['id','actor','action','object','reason'],'at')&&(!b.action||a.action===b.action)&&(!b.object||a.object===b.object))
  return b.page===undefined?rows.slice(0,500):pageRows(rows.map(a=>({id:a.id,actor:a.actor,action:a.action,object:a.object,reason:a.reason,at:a.at})),q)
 }
}
