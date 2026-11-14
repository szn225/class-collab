const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test'),Module=require('node:module'),ts=require('../backend/node_modules/typescript')
const root=path.resolve(__dirname,'..')
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f)
const resolve=Module._resolveFilename;Module._resolveFilename=function(name,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,'backend/src',name.slice(2)):name,...args)}
Object.assign(process.env,{AUTH_SECRET:'test-secret-'.repeat(4),WECHAT_APP_ID:'fixture-app',WECHAT_APP_SECRET:'fixture-secret',WRITING_API_KEY:'fixture-key',WRITING_API_URL:'https://layout.fixture.invalid/generate',NEXT_PUBLIC_SUPABASE_URL:'https://storage.fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture-key'})
const {initialState}=require('../backend/src/lib/v2/model.ts'),store=require('../backend/src/lib/v2/store.ts'),{NextRequest}=require('../backend/node_modules/next/server'),route=require('../backend/src/app/api/v2/[...path]/route.ts')
let current,mode,calls,serial=0,lastPayload
store.database.read=async()=>structuredClone(current)
store.database.cas=async(revision,state)=>{if(current.revision!==revision)return false;current={revision:revision+1,state:structuredClone(state)};return true}
global.fetch=async(url,options={})=>{
 if(String(url).startsWith('https://api.weixin.qq.com/sns/jscode2session'))return Response.json({openid:new URL(url).searchParams.get('js_code')})
 if(String(url).includes('/object/sign/'))return Response.json({signedURL:'/object/sign/fixture/photo?token=fixture'})
 assert.equal(url,'https://layout.fixture.invalid/generate');calls++
 const request=JSON.parse(options.body);lastPayload=JSON.parse(request.messages[1].content)
 if(mode==='timeout')throw new Error('response lost')
 if(mode==='conflict')current.state.activities[0].versions.push({...current.state.activities[0].versions[0],id:'manual-edit',revision:2,body:'编辑后的文字'})
 const color=mode==='alternate'?'#446688':'#925231'
 let html=`<section style="color:${color};padding:16px"><p style="font-size:17px;line-height:1.9">{{p1}}</p><img src="asset:img1" style="width:100%;height:auto"/><p>{{p2}}</p></section>`
 if(mode==='invalid')html=html.replace('{{p2}}','新增的事实')
 return Response.json({choices:[{message:{content:JSON.stringify({summary:'根据文章节奏设计配色与留白',html})},finish_reason:mode==='truncated'?'length':'stop'}],usage:{prompt_tokens:1500,completion_tokens:2200}})
}
async function call(command,data={},token){const req=new NextRequest('http://fixture/api/v2/'+command.replaceAll('.','/'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(token||'')},body:JSON.stringify({requestId:'layout_request_'+(++serial),...data})});const response=await route.POST(req,{params:{path:command.split('.')}});return {status:response.status,...await response.json()}}
async function setup(){
 current={revision:0,state:initialState()};mode='valid';calls=0
 Object.assign(current.state.config,{enabled:true,usageBillingEnabled:true,dailyBudget:10000})
 const token=(await call('auth.login',{code:'owner'})).data.token;await call('profile.update',{name:'排版测试'},token)
 const a=(await call('activity.create',{name:'校园记录'},token)).data
 const article={id:'original',title:'校园故事',body:'第一段：共同记录。\n\n第二段：真实的时光。',images:[{path:'fixture/photo',caption:''}],availableImages:['fixture/photo'],revision:1,sourceRevision:1,status:'draft',usedIds:[],createdAt:Date.now()}
 current.state.activities[0].versions.push(article);current.state.users[0].balance=300
 const quote=async()=>call('task.quote',{activityId:a.id,kind:'layout',articleId:current.state.activities[0].versions.at(-1).id,focus:'自然留白，不要每张图加框'},token)
 const start=async()=>{const q=await quote();assert.equal(q.status,200);const result=await call('task.start',{activityId:a.id,quoteId:q.data.id},token);assert.equal(result.status,200);return result.data}
 const run=t=>call('task.run',{activityId:a.id,taskId:t.id},token)
 return {token,a,article,quote,start,run}
}
test('full layout flow uses one paid call, locks quote, preserves source, renders and settles once',async()=>{
 const f=await setup(),t=await f.start();assert.equal(t.kind,'layout');assert.equal(t.billingMode,'usage');await Promise.all([f.run(t),f.run(t)])
 assert.equal(calls,1);const task=current.state.tasks[0];assert.equal(task.stage,'succeeded');assert.equal(task.usage[0].kind,'layout');assert.equal(task.chargedPoints,5)
 assert.equal(current.state.users[0].balance,295);assert.equal(current.state.users[0].frozen,0)
 assert.equal(current.state.activities[0].versions.length,2);const result=(await call('article.get',{activityId:f.a.id},f.token)).data
 assert.equal(result.body,f.article.body);assert.equal(result.title,f.article.title);assert.ok(result.layout.html.includes('第一段：共同记录。'));assert.equal(result.images[0].url.startsWith('https://'),true)
 assert.ok(!lastPayload.images[0].path);assert.equal(lastPayload.request,'自然留白，不要每张图加框')
 mode='alternate';await f.run(await f.start());assert.equal(calls,2);assert.ok(current.state.activities[0].versions.at(-1).layout.html.includes('#446688'));assert.equal(current.state.activities[0].versions[0].layout,undefined)
})
test('invalid or truncated output refunds and never overwrites original',async()=>{
 for(const failure of ['invalid','truncated']){
  const f=await setup();mode=failure;await f.run(await f.start());assert.equal(calls,1);assert.equal(current.state.tasks[0].stage,'failed');assert.ok(current.state.tasks[0].supplierCostCents>0);assert.equal(current.state.users[0].balance,300);assert.equal(current.state.users[0].frozen,0);assert.equal(current.state.activities[0].versions.length,1)
 }
})
test('layout conflict during generation refunds while preserving manual edit',async()=>{
 const f=await setup();mode='conflict';await f.run(await f.start());assert.equal(calls,1);assert.equal(current.state.tasks[0].stage,'failed');assert.equal(current.state.activities[0].versions.at(-1).body,'编辑后的文字');assert.equal(current.state.users[0].balance,300)
})
test('uncertain response stays under review without retrying model or charging again',async()=>{
 const f=await setup();mode='timeout';const task=await f.start();await f.run(task);await f.run(task);assert.equal(calls,1);assert.equal(current.state.tasks[0].stage,'review');assert.ok(current.state.users[0].frozen>0)
})
test('stale article quote and unauthorized participant are rejected before billing',async()=>{
 const f=await setup(),q=await f.quote();await call('article.save',{activityId:f.a.id,revision:1,title:f.article.title,body:'人工修改',images:f.article.images},f.token)
 const result=await call('task.start',{activityId:f.a.id,quoteId:q.data.id},f.token);assert.equal(result.status,409);assert.equal(current.state.users[0].frozen,0)
 const p=(await call('auth.login',{code:'participant'})).data.token;await call('profile.update',{name:'成员'},p);await call('activity.join',{inviteCode:f.a.inviteCode},p)
 assert.equal((await call('task.quote',{activityId:f.a.id,kind:'layout',articleId:'original'},p)).status,403);assert.equal(calls,0)
})
test('editing clears obsolete layout, restore preserves design, sharing keeps the same HTML',async()=>{
 const f=await setup();await f.run(await f.start());let latest=current.state.activities[0].versions.at(-1);const layoutId=latest.id
 await call('article.finalize',{activityId:f.a.id,revision:latest.revision,reviewed:true},f.token);const share=await call('article.share',{activityId:f.a.id,enabled:true},f.token);assert.equal(share.status,200);assert.equal(current.state.activities[0].shareVersion,layoutId)
 await call('article.save',{activityId:f.a.id,revision:latest.revision,title:f.article.title,body:f.article.body+' 新增',images:f.article.images},f.token)
 latest=current.state.activities[0].versions.at(-1);assert.equal(latest.layout,undefined)
 await call('article.restore',{activityId:f.a.id,revision:latest.revision,versionId:layoutId},f.token);assert.ok(current.state.activities[0].versions.at(-1).layout.html)
})
