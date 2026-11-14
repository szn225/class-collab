const fs=require('node:fs'),assert=require('node:assert/strict'),{test}=require('node:test'),ts=require('../backend/node_modules/typescript')
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f)
const {initialState,hash,record}=require('../backend/src/lib/v2/model.ts')
const {execute,completeTask,finishFailure}=require('../backend/src/lib/v2/domain.ts')
const {usageCost,pointsForCost,settlement}=require('../backend/src/lib/v2/billing.ts')
function fixture(){
 const s=initialState(),now=Date.UTC(2026,10,13),context={now,sessionHash:hash('test-session')};let serial=0
 const call=(name,b={})=>execute(s,name,{requestId:'usage_test_'+(++serial),...b},context)
 execute(s,'auth.login',{}, {now,identity:'fixture-owner',sessionToken:'test-session',source:'fixture'})
 Object.assign(s.config,{enabled:true,usageBillingEnabled:true,dailyBudget:10000});s.users[0].balance=300
 call('profile.update',{name:'测试用户'})
 const a=call('activity.create',{name:'活动',description:'观察记录'})
 const activity={activityId:a.id}
 call('material.send',{...activity,text:'大家参加了校园观察与交流。',uploadIds:[]})
 const quote=()=>call('task.quote',{...activity,mode:'smart',length:800})
 const start=q=>{const result=call('task.start',{...activity,quoteId:q.id});return s.tasks.find(t=>t.id===result.id)}
 const deliver=(t,usage=[{kind:'writing',prompt_tokens:1000,completion_tokens:1000}])=>{t.usage=usage;t.results={title:'活动记录',body:'真实记录',images:[]};completeTask(s,t,now)}
 return {s,now,call,activity,quote,start,deliver}
}
test('quote freezes a cap; metered settlement refunds difference once and delivers once',()=>{
 const f=fixture(),q=f.quote(),t=f.start(q),before=300
 assert.equal(q.billingMode,'usage');assert.ok(q.estimatedPoints<=q.price)
 assert.equal(f.s.users[0].balance,before-q.price);assert.equal(f.s.users[0].frozen,q.price)
 f.deliver(t);assert.equal(t.chargedPoints,2);assert.equal(f.s.users[0].balance,298);assert.equal(f.s.users[0].frozen,0)
 assert.equal(t.returnedPoints,Math.round((q.price-2)*10)/10)
 completeTask(f.s,t,f.now);finishFailure(f.s,t,f.now,'late failure')
 assert.equal(f.s.activities[0].versions.length,1);assert.equal(f.s.ledger.filter(l=>l.kind==='settle').length,1)
 const receipt=f.call('tasks.get',{...f.activity,taskId:t.id});assert.equal(receipt.chargedPoints,2);assert.equal(receipt.usageSummary[0].inputTokens,1000)
})
test('different actual usage produces different charges; ceiling applied once across calls',()=>{
 const f=fixture(),one=f.start(f.quote());f.deliver(one,[{kind:'writing',prompt_tokens:500,completion_tokens:500}]);assert.equal(one.chargedPoints,1)
 const two=f.start(f.quote());f.deliver(two,[{kind:'writing',prompt_tokens:1,completion_tokens:1},{kind:'layout',prompt_tokens:1,completion_tokens:1}]);assert.equal(two.chargedPoints,1)
 assert.equal(f.s.users[0].balance,298)
})
test('over-cap provider usage never debits an unapproved amount',()=>{
 const f=fixture(),q=f.quote(),t=f.start(q);f.deliver(t,[{kind:'writing',prompt_tokens:50000,completion_tokens:50000}])
 assert.equal(t.chargedPoints,q.price);assert.equal(t.returnedPoints,0);assert.ok(t.platformCoveredPoints>0);assert.equal(f.s.users[0].balance,(3000-Math.round(q.price*10))/10)
})
test('missing or invalid usage is platform expense; successful draft remains available',()=>{
 for(const usage of [[],[{kind:'writing',prompt_tokens:12}],[{kind:'writing',prompt_tokens:-1,completion_tokens:3}],[{kind:'writing',prompt_tokens:3,completion_tokens:3,prompt_cache_hit_tokens:4}]]){
  const f=fixture(),t=f.start(f.quote());f.deliver(t,usage)
  assert.equal(t.billingVerified,false);assert.equal(t.chargedPoints,0);assert.equal(f.s.users[0].balance,300);assert.equal(f.s.users[0].frozen,0);assert.equal(f.s.activities[0].versions.length,1)
 }
})
test('failed delivery refunds cap even after paid provider usage; no double refunds',()=>{
 const f=fixture(),t=f.start(f.quote());t.usage=[{kind:'writing',prompt_tokens:1000,completion_tokens:1000}];t.supplierCostCents=1
 finishFailure(f.s,t,f.now,'未交付');finishFailure(f.s,t,f.now,'重试退款')
 assert.equal(f.s.users[0].balance,300);assert.equal(f.s.users[0].frozen,0);assert.equal(t.supplierCostCents,1)
 assert.equal(f.s.ledger.filter(l=>l.kind==='refund').length,1)
})
test('task locks conversion and rates; changing config after start does not alter its bill',()=>{
 const f=fixture(),q=f.quote(),t=f.start(q);Object.assign(f.s.config,{pointsPerYuan:999,serviceMarkupBps:90000,writingInputCentsPerMillion:9999})
 f.deliver(t);assert.equal(t.chargedPoints,2);assert.equal(t.billingRates.pointsPerYuan,100)
})
test('changed tariff invalidates unstarted quote; insufficient balance never freezes',()=>{
 const f=fixture(),q=f.quote();f.s.config.version++;assert.throws(()=>f.start(q),e=>e.code==='QUOTE');assert.equal(f.s.users[0].frozen,0)
 const q2=f.quote();f.s.users[0].balance=0;assert.throws(()=>f.start(q2),e=>e.code==='BALANCE');assert.equal(f.s.tasks.length,0)
})
test('daily allowance counts settled charges, not refunded reservation',()=>{
 const f=fixture(),q=f.quote(),t=f.start(q);f.deliver(t);f.s.config.dailyPoints=Math.ceil(2+q.price)
 assert.doesNotThrow(()=>f.start(f.quote()))
})
test('cache hits use snapshot cache price; legacy whole-point settlement remains supported',()=>{
 const c=initialState().config
 const cost=usageCost([{kind:'writing',prompt_tokens:1000,completion_tokens:1000,prompt_cache_hit_tokens:800}],c)
 assert.equal(cost,BigInt(843200));assert.equal(pointsForCost(cost,c),1.7)
 assert.deepEqual(settlement({price:5,usage:[]}),{chargedPoints:5,returnedPoints:0})
 const f=fixture();f.s.config.usageBillingEnabled=false;const q=f.quote();assert.equal(q.price,5);const t=f.start(q);f.deliver(t);assert.equal(t.chargedPoints,5);assert.equal(f.s.users[0].balance,295)
})
test('point arithmetic has no decimal drift and accepts historical integer balances',()=>{
 const s=initialState(),u={id:'user',balance:12,frozen:0};s.users.push(u)
 for(let i=0;i<30;i++)record(s,u,-.1,.1,'freeze','f'+i,0)
 assert.equal(u.balance,9);assert.equal(u.frozen,3)
 for(let i=0;i<30;i++)record(s,u,.1,-.1,'refund','f'+i,0)
 assert.equal(u.balance,12);assert.equal(u.frozen,0)
 assert.throws(()=>record(s,u,.01,0,'invalid','bad',0))
})
test('administrators can configure new pricing fields on legacy state with audit',()=>{
 const f=fixture();for(const k of ['usageBillingEnabled','pointsPerYuan','serviceMarkupBps','writingCacheInputCentsPerMillion'])delete f.s.config[k]
 const token='fixture-admin';execute(f.s,'admin.login',{}, {now:f.now,adminLogin:true,sessionToken:token,source:'fixture'})
 const context={now:f.now,sessionHash:hash(token)}
 const cfg=execute(f.s,'admin.configure',{requestId:'configure_usage_once',version:f.s.config.version,values:{usageBillingEnabled:true,pointsPerYuan:100,serviceMarkupBps:20000},reason:'本地试运行'},context)
 assert.equal(cfg.usageBillingEnabled,true);assert.equal(f.s.configHistory.length,1)
 assert.throws(()=>execute(f.s,'admin.configure',{requestId:'configure_usage_bad',version:cfg.version,values:{pointsPerYuan:0},reason:'无效兑换规则'},context),/动态计价/)
})

test('new billing handshake enables opt-in quotes without changing old client pricing or global config',()=>{
 const f=fixture();f.s.config.usageBillingEnabled=false
 const old=f.quote();assert.equal(old.billingMode,'fixed');assert.equal(old.price,5)
 const modern=f.call('task.quote',{...f.activity,mode:'smart',billingVersion:1})
 assert.equal(modern.billingMode,'usage');assert.ok(Number.isInteger(modern.price));assert.ok(Number.isInteger(modern.estimatedPoints));assert.equal(f.s.config.usageBillingEnabled,false)
 const bundled=f.call('task.quote',{...f.activity,mode:'smart',withLayout:true,billingVersion:1});assert.ok(bundled.price>modern.price);assert.equal(bundled.withLayout,true)
 assert.equal(f.call('service.capabilities').aiLayout,true)
})
