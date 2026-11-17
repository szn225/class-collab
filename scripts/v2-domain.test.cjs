const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),Module=require('node:module')
const root=path.resolve(__dirname,'..'),ts=require(path.join(root,'backend/node_modules/typescript'))
require.extensions['.ts']=(m,filename)=>m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename)
const {execute,completeTask,finishFailure,budgetUsage,day}=require('../backend/src/lib/v2/domain.ts'),{initialState,hash,activeTask}=require('../backend/src/lib/v2/model.ts'),{transaction}=require('../backend/src/lib/v2/store.ts')
const now=Date.UTC(2026,10,5,3),s=initialState();let n=0,passes=0
const check=(name,fn)=>{fn();passes++;console.log('PASS '+name)}
const ctx=(token)=>({now,sessionHash:hash(token)})
function command(c,name,b={}){return execute(s,name,{requestId:'request_number_'+(++n),...b},c)}
function login(identity,t){return execute(s,'auth.login',{}, {now,identity,sessionToken:t,source:identity})}
const first=login('wx-identity-1','token1'),second=login('wx-identity-2','token2'),third=login('wx-identity-3','token3'),owner=ctx('token1'),participant=ctx('token2'),collaborator=ctx('token3')
command(owner,'profile.update',{name:'同名'});command(participant,'profile.update',{name:'同名'});command(collaborator,'profile.update',{name:'协作者'})
check('approved defaults give 12 points, charge 5, cap daily cost at 500 cents, with vision off',()=>{assert.equal(s.users[0].balance,12);assert.equal(s.config.writing,5);assert.equal(s.config.dailyBudget,500);assert.equal(s.config.visionEnabled,false)});
check('same display name never merges identities',()=>assert.notEqual(first.user.id,second.user.id))
check('same WeChat restores identity without a second gift',()=>{const again=login('wx-identity-1','token4');assert.equal(again.user.id,first.user.id);assert.equal(s.ledger.filter(l=>l.kind==='gift'&&l.userId===first.user.id).length,1)})
check('untrusted userId cannot impersonate a session',()=>assert.throws(()=>command(ctx('invalid'),'me',{userId:first.user.id}),e=>e.status===401))
const created=command(owner,'activity.create',{name:'共创活动',description:'活动说明'}),aid=created.id,a=s.activities[0],activity={activityId:aid}
check('any authenticated user can create and becomes activity owner',()=>{assert.equal(created.role,'owner');assert.equal(a.members.length,1);assert.deepEqual(a.materials,[]);assert.deepEqual(a.versions,[])})
command(participant,'activity.join',{inviteCode:created.inviteCode});command(collaborator,'activity.join',{inviteCode:created.inviteCode})
check('participant cannot modify activity or call AI',()=>{assert.throws(()=>command(participant,'activity.update',{...activity,name:'篡改'}),e=>e.status===403);assert.throws(()=>command(participant,'task.quote',{...activity,mode:'smart'}),e=>e.status===403)})
command(owner,'member.update',{...activity,userId:third.user.id,role:'collaborator',ai:false})
check('collaborator needs explicit point authorization',()=>assert.throws(()=>command(collaborator,'task.quote',{...activity,mode:'smart'}),e=>e.status===403))
const send={...activity,text:'真实活动记录',uploadIds:[],requestId:'same_material_request'};const m=command(participant,'material.send',send)
check('repeated send uses the same material, and changed payload is rejected',()=>{assert.equal(command(participant,'material.send',send).id,m.id);assert.equal(a.materials.length,1);assert.throws(()=>command(participant,'material.send',{...send,text:'不同'}),e=>e.status===409)})
check('one cannot withdraw another user material',()=>assert.throws(()=>command(owner,'material.withdraw',{...activity,materialId:m.id}),e=>e.status===403))
command(participant,'material.withdraw',{...activity,materialId:m.id});check('withdraw clears content and excludes future AI',()=>{assert.equal(a.materials[0].text,'');assert.throws(()=>command(owner,'task.quote',{...activity,mode:'smart'}))})
command(owner,'material.send',{...activity,text:'活动完成了小组观察与分享。',uploadIds:[]});command(owner,'material.send',{...activity,text:'排除的私密资料',uploadIds:[]})
command(owner,'materials.select',{...activity,ids:[a.materials[2].id],state:'exclude'})
const quote=command(owner,'task.quote',{...activity,mode:'smart'}),q=s.quotes.find(q=>q.id===quote.id)
check('excluded and withdrawn materials never enter snapshot',()=>{assert.equal(q.snapshot.materials.length,1);assert.ok(!JSON.stringify(q.snapshot).includes('私密'))})
check('explicit material ids use only current choices regardless of legacy states and reject withdrawn ids',()=>{
 const result=command(owner,'task.quote',{...activity,mode:'specified',materialIds:[a.materials[2].id],billingVersion:1});const selected=s.quotes.find(x=>x.id===result.id);assert.deepEqual(selected.snapshot.materials.map(x=>x.id),[a.materials[2].id]);assert.ok(Number.isFinite(result.layoutExtraPoints));
 const styled=command(owner,'task.quote',{...activity,mode:'specified',materialIds:[a.materials[2].id],billingVersion:1,withLayout:true});assert.equal(styled.estimatedPoints-result.estimatedPoints,styled.layoutExtraPoints);
 for(const ids of [[],[a.materials[0].id],['missing'],[a.materials[1].id,a.materials[1].id]])assert.throws(()=>command(owner,'task.quote',{...activity,mode:'specified',materialIds:ids}));
})
check('AI is disabled until pricing and budgets are explicitly configured',()=>assert.throws(()=>command(owner,'task.start',{...activity,quoteId:q.id}),e=>e.code==='AI_PAUSED'))
Object.assign(s.config,{confirmed:true,enabled:true,dailyBudget:10000,monthlyBudget:10000});s.users[0].balance=300
command(owner,'activity.update',{...activity,description:'更新后的说明'})
check('stale quote cannot start or freeze points',()=>{assert.throws(()=>command(owner,'task.start',{...activity,quoteId:q.id}),e=>e.code==='QUOTE');assert.equal(s.users[0].frozen,0)})
const q2=command(owner,'task.quote',{...activity,mode:'smart'}),task=command(owner,'task.start',{...activity,quoteId:q2.id}),t=s.tasks.find(t=>t.id===task.id)
check('concurrent starts reuse active task without another freeze',()=>{const other=command(owner,'task.start',{...activity,quoteId:q2.id});assert.equal(other.id,t.id);assert.equal(s.ledger.filter(l=>l.kind==='freeze').length,1);assert.equal(s.users[0].frozen,q2.price)})
t.results={title:'有依据的标题',body:'真实正文',images:[]};completeTask(s,t,now)
check('settlement occurs exactly once and preserves collection state',()=>{completeTask(s,t,now);assert.equal(s.ledger.filter(l=>l.kind==='settle').length,1);assert.equal(s.users[0].frozen,0);assert.equal(a.status,'collecting');assert.equal(a.versions.length,1)})
let ar=a.versions[0];const saved=command(owner,'article.save',{...activity,revision:ar.revision,title:'人工标题',body:'人工正文',images:[]})
check('editing preserves old version and rejects stale revisions',()=>{assert.equal(a.versions.length,2);assert.throws(()=>command(owner,'article.save',{...activity,revision:ar.revision,title:'覆盖',body:'覆盖',images:[]}),e=>e.code==='VERSION_CONFLICT')})
check('finalization requires explicit human review',()=>assert.throws(()=>command(owner,'article.finalize',{...activity,revision:saved.revision,reviewed:false})))
command(owner,'article.finalize',{...activity,revision:saved.revision,reviewed:true});let share=command(owner,'article.share',{...activity,enabled:true});check('public link uses revocable credential, never activity id',()=>{assert.equal(a.shareHash,hash(share.token));assert.notEqual(share.token,aid);command(owner,'article.share',{...activity,enabled:false});assert.equal(a.shareHash,null)})
check('one publish action finalizes and shares atomically, reuses links and rejects stale/unauthorized requests',()=>{
 const fixture=structuredClone(s),target=fixture.activities.find(x=>x.id===aid),latest=target.versions.at(-1);latest.status='draft';
 const body={activityId:aid,revision:latest.revision,requestId:'publish_atomic_request'};
 const result=execute(fixture,'article.finalizePublish',body,owner);assert.ok(result.token);assert.equal(latest.status,'final');assert.equal(target.shareVersion,latest.id);assert.equal(target.publishedVersion,latest.id);assert.deepEqual(execute(fixture,'article.finalizePublish',body,owner),result);
 const secretHash=target.shareHash;const again=execute(fixture,'article.finalizePublish',{...body,requestId:'publish_again_request'},owner);assert.equal(again.token,result.token);assert.equal(target.shareHash,secretHash);
 assert.throws(()=>execute(fixture,'article.finalizePublish',{...body,revision:999,requestId:'publish_stale_request'},owner),e=>e.code==='VERSION_CONFLICT');assert.equal(target.shareHash,secretHash);
 assert.throws(()=>execute(fixture,'article.finalizePublish',{...body,requestId:'publish_forbidden_request'},participant),e=>e.status===403);
 target.status='archived';assert.throws(()=>execute(fixture,'article.finalizePublish',{...body,requestId:'publish_archived_request'},owner));
})
check('share retrieval recovers a stable link on another device and preserves legacy links',()=>{
 const fixture=structuredClone(s),target=fixture.activities.find(x=>x.id===aid);target.shareHash=hash('legacy-secret');target.shareVersion=target.finalId;delete target.shareToken;
 const get=(requestId,cachedToken)=>execute(fixture,'article.shareLink',{activityId:aid,requestId,...(cachedToken?{cachedToken}:{})},owner);
 const old=get('share_recover_original','legacy-secret');assert.equal(old.token,'legacy-secret');assert.equal(get('share_another_device').token,old.token);
 delete target.shareToken;const recovered=get('share_without_cache');assert.equal(target.shareHash,hash('legacy-secret'));assert.equal(target.shareToken,recovered.token);assert.equal(get('share_repeat_recover').token,recovered.token);
 assert.throws(()=>execute(fixture,'article.shareLink',{activityId:aid,requestId:'share_wrong_member'},participant),e=>e.status===403);
 execute(fixture,'article.share',{activityId:aid,enabled:false,requestId:'share_close_recovered'},owner);assert.equal(target.shareHash,null);assert.equal(target.shareToken,null);
})
check('account article count includes readable joined activities once and excludes removed memberships',()=>{
 const fixture=structuredClone(s),target=fixture.activities.find(x=>x.id===aid);target.membersVisible=true;const initial=execute(fixture,'account.articles',{},participant);assert.equal(initial.length,1);assert.equal(initial[0].activityId,aid);target.versions.push({...target.versions.at(-1),id:'new-draft',revision:99});assert.equal(execute(fixture,'account.articles',{},participant).length,1);target.membersVisible=false;assert.equal(execute(fixture,'account.articles',{},participant).length,1);assert.notEqual(execute(fixture,'account.articles',{},participant)[0].revision,99);assert.equal(execute(fixture,'account.articles',{},owner).length,1);target.members.find(x=>x.userId===second.user.id).removed=true;target.membersVisible=true;assert.equal(execute(fixture,'account.articles',{},participant).length,0)
})
check('drafts stay with managers while members keep reading the previous final without a visibility toggle',()=>{
 const fixture=structuredClone(s),target=fixture.activities.find(x=>x.id===aid),final=target.versions.find(x=>x.id===target.finalId),draft={...structuredClone(final),id:'private-current-draft',revision:final.revision+1,title:'协作中的新草稿',status:'draft'};target.versions.push(draft);target.membersVisible=true;
 assert.equal(execute(fixture,'article.get',activity,owner).id,draft.id);assert.equal(execute(fixture,'article.get',activity,collaborator).id,draft.id);assert.equal(execute(fixture,'article.get',activity,participant).id,final.id);assert.throws(()=>execute(fixture,'article.get',{...activity,versionId:draft.id},participant),e=>e.status===403);
 assert.equal(execute(fixture,'activity.get',activity,owner).articleStatus,'draft');assert.notEqual(execute(fixture,'activity.get',activity,participant).articleStatus,'draft');target.membersVisible=false;assert.equal(execute(fixture,'article.get',activity,participant).id,final.id);
 target.finalId=null;assert.equal(execute(fixture,'article.get',activity,participant),null);assert.equal(execute(fixture,'account.articles',{},participant).length,0);assert.equal(execute(fixture,'article.get',activity,collaborator).id,draft.id)
})
check('participants automatically read finalized articles',()=>assert.equal(command(participant,'article.get',activity).status,'final'));command(owner,'article.visibility',{...activity,visible:true});assert.ok(command(participant,'article.get',activity))
command(owner,'activity.update',{...activity,status:'archived'});check('archived activity blocks submit, withdrawal and generation',()=>{assert.throws(()=>command(participant,'material.send',{...activity,text:'新消息',uploadIds:[]}));assert.throws(()=>command(owner,'task.quote',{...activity,mode:'smart'}));assert.throws(()=>command(owner,'material.withdraw',{...activity,materialId:a.materials[1].id}))})
command(owner,'activity.update',{...activity,status:'collecting'});command(owner,'member.update',{...activity,userId:second.user.id,remove:true})
check('removed member loses reads and cannot reuse invitation',()=>{assert.throws(()=>command(participant,'materials.list',activity),e=>e.status===403);assert.throws(()=>command(participant,'activity.join',{inviteCode:a.inviteCode}),e=>e.status===403);assert.equal(a.materials.length,3)})
const adminToken='admin-token';execute(s,'admin.login',{}, {now,adminLogin:true,sessionToken:adminToken,source:'admin'});const admin=ctx(adminToken)
check('ordinary user cannot use admin APIs',()=>assert.throws(()=>command(owner,'admin.users'),e=>e.status===401))
const adminAdjust={userId:first.user.id,delta:20,expectedBalance:s.users[0].balance,reason:'试用补点',requestId:'idempotent_adjustment'};const before=s.users[0].balance;command(admin,'admin.points',adminAdjust);command(admin,'admin.points',adminAdjust)
check('admin adjustment is audited and idempotent',()=>{assert.equal(s.users[0].balance,before+20);assert.ok(s.audit.some(x=>x.action==='admin.points'));assert.throws(()=>command(admin,'admin.points',{userId:first.user.id,delta:-9999,expectedBalance:s.users[0].balance,reason:'扣减'}))})
const q3=command(owner,'task.quote',{...activity,mode:'smart'}),t2id=command(owner,'task.start',{...activity,quoteId:q3.id}).id,t2=s.tasks.find(x=>x.id===t2id),pre=s.users[0].balance;finishFailure(s,t2,now,'未交付');finishFailure(s,t2,now,'未交付')
check('failed task refund is atomic and occurs once',()=>{assert.equal(s.users[0].balance,pre+t2.price);assert.equal(s.users[0].frozen,0);assert.equal(s.ledger.filter(x=>x.kind==='refund'&&x.ref===t2id).length,1)})
check('in-flight tasks reserve today budget across midnight',()=>{const fixture=initialState();fixture.tasks=[{stage:'writing',createdAt:now-86400000,reserveCents:100,costCents:0}];assert.equal(budgetUsage(fixture,day(now)),100)});
async function concurrent(){let value={revision:0,state:initialState()};const store={async read(){return structuredClone(value)},async cas(rev,state){if(rev!==value.revision)return false;value={revision:rev+1,state:structuredClone(state)};return true}};await Promise.all(Array.from({length:5},()=>transaction(state=>{state.config.gift++;return state.config.gift},store)));assert.equal(value.state.config.gift,17);console.log('PASS optimistic transaction retries concurrent writes without lost updates');console.log(`${passes+1} domain checks passed`)}
concurrent().catch(e=>{console.error(e);process.exitCode=1})
