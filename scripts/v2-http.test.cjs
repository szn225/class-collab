const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),Module=require('node:module')
const root=path.resolve(__dirname,'..'),ts=require(path.join(root,'backend/node_modules/typescript'))
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f)
const originalResolve=Module._resolveFilename;Module._resolveFilename=function(name,...args){return originalResolve.call(this,name.startsWith('@/')?path.join(root,'backend/src',name.slice(2)):name,...args)}
process.env.AUTH_SECRET='test-secret-'.repeat(4);process.env.WECHAT_APP_ID='test-app';process.env.WECHAT_APP_SECRET='test-only';process.env.WRITING_API_KEY='test-only';process.env.VISION_API_KEY='test-only';process.env.VISION_MODEL='test-vision';process.env.VISION_API_URL='https://fixture.invalid/vision';process.env.NEXT_PUBLIC_SUPABASE_URL='https://storage.fixture.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only'
const {initialState,hash}=require('../backend/src/lib/v2/model.ts'),store=require('../backend/src/lib/v2/store.ts'),{NextRequest}=require('../backend/node_modules/next/server'),route=require('../backend/src/app/api/v2/[...path]/route.ts'),worker=require('../backend/src/lib/v2/worker.ts')
let current={revision:0,state:initialState()},supplierCalls=0,visionCalls=0,simulateTimeout=false,layoutCalls=0,failLayout=false
store.database.read=async()=>structuredClone(current);store.database.cas=async(revision,state)=>{if(current.revision!==revision)return false;current={revision:revision+1,state:structuredClone(state)};return true}
// Test-only provider transport. Any unexpected network request fails the test.
global.fetch=async(url,options={})=>{
 if(String(url).startsWith('https://api.weixin.qq.com/sns/jscode2session'))return Response.json({openid:new URL(url).searchParams.get('js_code')})
 if(String(url).includes('/object/sign/'))return Response.json({signedURL:'/object/sign/hui-materials/test.jpg?token=fixture'})
 if(url==='https://fixture.invalid/vision'){visionCalls++;return Response.json({choices:[{message:{content:'图片中可见自然拼贴作品'},finish_reason:'stop'}],usage:{prompt_tokens:30,completion_tokens:20}})}
 if(url==='https://api.deepseek.com/v1/chat/completions'){supplierCalls++;if(simulateTimeout)throw new Error('network response lost');const req=JSON.parse(options.body),payload=JSON.parse(req.messages[1].content);if(payload.paragraphs){layoutCalls++;return Response.json({choices:[{message:{content:JSON.stringify({summary:'正文设计',html:failLayout?'<p>无效内容</p>':'<section style="color:#334455">'+payload.paragraphs.map(p=>'<p>{{'+p.id+'}}</p>').join('')+payload.images.map(i=>'<img src="asset:'+i.id+'"/>').join('')+'</section>'})},finish_reason:'stop'}],usage:{prompt_tokens:100,completion_tokens:100}})}return Response.json({choices:[{message:{content:JSON.stringify({title:'活动记录',body:'大家完成了观察与分享。',usedIds:payload.materials.map(m=>m.id),images:payload.materials.flatMap(m=>m.images.map(i=>i.path)),omitted:[]})},finish_reason:'stop'}],usage:{prompt_tokens:100,completion_tokens:100}})}
 throw new Error('Unexpected network request: '+url)
}
let i=0
async function call(command,data={},token){const request=new NextRequest('http://localhost/api/v2/'+command.replaceAll('.','/'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(token||'')},body:JSON.stringify({requestId:'http_request_'+(++i),...data})});const res=await route.POST(request,{params:{path:command.split('.')}});return {status:res.status,...await res.json()}}
async function main(){
 const login=await call('auth.login',{code:'wx-1',name:'admin',userId:'injected',role:'admin'});assert.equal(login.status,200);const auth=login.data.token;assert.equal(login.data.user.name,'');assert.equal(current.state.users[0].state,'active');assert.equal((await call('admin.users',{},auth)).status,401);console.log('PASS HTTP WeChat identity ignores supplied name, userId and role')
 assert.equal((await call('me',{},'fake-token')).status,401);await call('profile.update',{name:'林晓'},auth);const a=(await call('activity.create',{name:'真实接口流程',description:'观察与分享'},auth)).data,activity={activityId:a.id};
 await call('material.send',{...activity,text:'大家完成了自然观察。',uploadIds:[]},auth)
 current.state.config={...current.state.config,enabled:true,confirmed:true,visionEnabled:true,dailyBudget:10000,monthlyBudget:10000};current.state.users[0].balance=300
 const quote=(await call('task.quote',{...activity,mode:'smart'},auth)).data,start=await call('task.start',{...activity,quoteId:quote.id},auth);assert.equal(start.status,200)
 const taskId=start.data.id;const [r1,r2]=await Promise.all([call('task.run',{...activity,taskId},auth),call('task.run',{...activity,taskId},auth)]);assert.equal(r1.status,200);assert.equal(r2.status,200);assert.equal(supplierCalls,1);assert.equal(current.state.tasks[0].stage,'succeeded');assert.equal(current.state.users[0].frozen,0);assert.equal(current.state.activities[0].status,'collecting');console.log('PASS HTTP full generation flow uses one supplier call under concurrent workers')
 const ar=(await call('article.get',activity,auth)).data;assert.equal(ar.title,'活动记录');assert.equal((await call('article.save',{...activity,revision:0,title:'覆盖',body:'覆盖',images:[]},auth)).status,409);console.log('PASS HTTP article conflict returns 409 without replacing current version')
 const q2=(await call('task.quote',{...activity,mode:'smart'},auth)).data,t2=(await call('task.start',{...activity,quoteId:q2.id},auth)).data;simulateTimeout=true;await call('task.run',{...activity,taskId:t2.id},auth);assert.equal(current.state.tasks[1].stage,'review');assert.ok(current.state.users[0].frozen>0);await call('task.run',{...activity,taskId:t2.id},auth);assert.equal(supplierCalls,2);console.log('PASS supplier response ambiguity stays pending, does not refund or repeat a call')
 // Image cache lives within activity and excluded images never reach the provider.
 simulateTimeout=false;const unresolved=current.state.tasks[1];unresolved.stage='failed';current.state.users[0].frozen=0;current.state.users[0].balance=300;
 current.state.activities[0].materials.push({id:'image-1',userId:current.state.users[0].id,name:'林晓',text:'拼贴',images:['a/test.jpg'],state:'include',createdAt:Date.now()},{id:'image-2',userId:current.state.users[0].id,name:'林晓',text:'排除',images:['a/excluded.jpg'],state:'exclude',createdAt:Date.now()});
 const q3=(await call('task.quote',{...activity,mode:'smart'},auth)).data,t3=(await call('task.start',{...activity,quoteId:q3.id},auth)).data;assert.equal(q3.pendingImages,1);await call('task.run',{...activity,taskId:t3.id},auth);assert.equal(visionCalls,1);assert.equal(current.state.tasks[2].stage,'succeeded');const q4=(await call('task.quote',{...activity,mode:'smart'},auth)).data;assert.equal(q4.pendingImages,0);console.log('PASS image understanding runs for selected image only and reuses scoped cache')
 // More than two uncached photos checkpoint and resume without repeating recognition.
 current.state.activities[0].materials.push({id:'image-batch',userId:current.state.users[0].id,name:'林晓',text:'多图记录',images:['a/b1.jpg','a/b2.jpg','a/b3.jpg'],state:'include',createdAt:Date.now()});
 const qb=(await call('task.quote',{...activity,mode:'smart'},auth)).data,tb=(await call('task.start',{...activity,quoteId:qb.id},auth)).data;
 const beforeVision=visionCalls;await call('task.run',{...activity,taskId:tb.id},auth);assert.equal(current.state.tasks.at(-1).stage,'queued');assert.equal(visionCalls-beforeVision,2);await call('task.run',{...activity,taskId:tb.id},auth);assert.equal(current.state.tasks.at(-1).stage,'succeeded');assert.equal(visionCalls-beforeVision,3);console.log('PASS image batches resume from saved cache without duplicate recognition');
 const visionBefore=visionCalls;current.state.config.visionEnabled=false;current.state.config.monthlyBudget=0;delete process.env.VISION_API_KEY;delete process.env.VISION_MODEL;delete process.env.VISION_API_URL;
 const noVision=(await call('task.quote',{...activity,mode:'smart'},auth)).data;assert.equal(noVision.price,5);assert.equal(noVision.pendingImages,0);assert.equal(noVision.visionEnabled,false);const noVisionTask=await call('task.start',{...activity,quoteId:noVision.id},auth);assert.equal(noVisionTask.status,200);await call('task.run',{...activity,taskId:noVisionTask.data.id},auth);assert.equal(visionCalls,visionBefore);assert.equal(current.state.tasks.at(-1).stage,'succeeded');console.log('PASS disabled vision permits writing with images, no vision credentials or image fees');
 // Dynamic pricing end to end, with mocked provider usage and no paid calls.
 current.state.config.usageBillingEnabled=true;current.state.config.version++;current.state.users[0].balance=300
 const meteredQuote=(await call('task.quote',{...activity,mode:'smart'},auth)).data
 assert.equal(meteredQuote.billingMode,'usage');assert.ok(meteredQuote.estimatedPoints<=meteredQuote.price)
 const meteredTask=(await call('task.start',{...activity,quoteId:meteredQuote.id},auth)).data
 await Promise.all([call('task.run',{...activity,taskId:meteredTask.id},auth),call('task.run',{...activity,taskId:meteredTask.id},auth)])
 const receipt=(await call('tasks.get',{...activity,taskId:meteredTask.id},auth)).data
 assert.equal(receipt.stage,'succeeded');assert.equal(receipt.chargedPoints,1);assert.equal(receipt.billingVerified,true)
 assert.equal(current.state.users[0].balance,299);assert.equal(current.state.users[0].frozen,0)
 assert.equal(current.state.ledger.filter(l=>l.kind==='settle'&&l.ref===meteredTask.id).length,1)
 console.log('PASS HTTP metered quote, frozen cap, provider usage, concurrent settlement and difference refund')
 // Original generation endpoint now optionally chains layout under one authorization.
 const bundleQuote=(await call('task.quote',{...activity,mode:'smart',withLayout:true},auth)).data
 assert.equal(bundleQuote.withLayout,true);assert.ok(Number.isInteger(bundleQuote.price));assert.ok(Number.isInteger(bundleQuote.estimatedPoints))
 const bundle=(await call('task.start',{...activity,quoteId:bundleQuote.id},auth)).data
 const versionsBefore=current.state.activities[0].versions.length,layoutBefore=layoutCalls
 await Promise.all([call('task.run',{...activity,taskId:bundle.id},auth),call('task.run',{...activity,taskId:bundle.id},auth)])
 assert.equal(current.state.tasks.at(-1).phase,'layout');assert.equal(current.state.tasks.at(-1).stage,'queued');assert.equal(current.state.activities[0].versions.length,versionsBefore)
 await Promise.all([call('task.run',{...activity,taskId:bundle.id},auth),call('task.run',{...activity,taskId:bundle.id},auth)])
 const completed=current.state.tasks.at(-1);assert.equal(completed.stage,'succeeded');assert.equal(layoutCalls-layoutBefore,1);assert.ok(current.state.activities[0].versions.at(-1).layout.bodyOnly)
 assert.deepEqual(completed.usage.map(x=>x.kind),['writing','layout']);assert.equal(completed.chargedPoints,1);assert.equal(current.state.ledger.filter(l=>l.kind==='settle'&&l.ref===bundle.id).length,1)
 console.log('PASS HTTP original generation with optional layout: two calls, one authorization, one complete version, integer settlement')
 const failedQuote=(await call('task.quote',{...activity,mode:'smart',withLayout:true},auth)).data,balanceBefore=current.state.users[0].balance
 const failedBundle=(await call('task.start',{...activity,quoteId:failedQuote.id},auth)).data
 await call('task.run',{...activity,taskId:failedBundle.id},auth);failLayout=true
 await call('task.run',{...activity,taskId:failedBundle.id},auth);failLayout=false
 assert.equal(current.state.tasks.at(-1).stage,'failed');assert.equal(current.state.users[0].balance,balanceBefore);assert.equal(current.state.users[0].frozen,0)
 console.log('PASS HTTP bundled layout failure refunds entire reservation without partial publication')
 current.state.config.dailyBudget=1;const blockedQuote=(await call('task.quote',{...activity,mode:'smart'},auth)).data;const frozenBefore=current.state.users[0].frozen;const blocked=await call('task.start',{...activity,quoteId:blockedQuote.id},auth);assert.equal(blocked.status,429);assert.equal(blocked.code,'BUDGET');assert.equal(current.state.users[0].frozen,frozenBefore);console.log('PASS daily budget exhaustion refuses task before freezing or calling supplier');
 const latest=current.state.activities[0].versions.at(-1),published=await call('article.finalizePublish',{...activity,revision:latest.revision},auth);assert.equal(published.status,200);
 const membersBefore=current.state.activities[0].members.length,guestArticle=await call('public.article',{token:published.data.token});assert.equal(guestArticle.status,200);assert.equal(guestArticle.data.title,latest.title);assert.equal(guestArticle.data.materials,undefined);assert.equal(guestArticle.data.members,undefined);assert.equal(guestArticle.data.availableImages,undefined);assert.equal(current.state.activities[0].members.length,membersBefore);
 const newest={...structuredClone(latest),id:'private-new-draft',revision:latest.revision+1,status:'draft',title:'不可公开的新草稿'};current.state.activities[0].versions.push(newest);assert.equal((await call('public.article',{token:published.data.token})).data.title,latest.title);
 assert.equal((await call('public.article',{token:'not-a-valid-token'})).status,404);await call('article.share',{...activity,enabled:false},auth);assert.equal((await call('public.article',{token:published.data.token})).status,404);console.log('PASS guest public reading needs no login/membership, excludes private fields/new drafts, and respects revocation');
 console.log('12 HTTP integration checks passed; no real network or paid calls')
}
main().catch(e=>{console.error(e);process.exitCode=1})
