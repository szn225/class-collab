const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs'),vm=require('node:vm')
const {summarize}=require('../miniprogram/utils/conflict-summary')
test('conflict comparison finds deletion and edit differences even with equal totals',()=>{
 const local={records:JSON.stringify([{id:'same',examName:'期中',score:90},{id:'local',examName:'本机考试'}]),plans:[{id:'p',title:'复习',status:'todo'}],settings:{x:1}}
 const remote={records:[{score:80,examName:'期中',id:'same'},{id:'remote',examName:'云端考试'}],plans:[{id:'p',title:'复习',status:'done'}],settings:{x:2}}
 const before=JSON.stringify([local,remote]),result=summarize(local,remote)
 assert.equal(result.local.records,2);assert.equal(result.remote.records,2);assert.equal(result.changes.length,4);assert.equal(result.otherChanged,true);assert.match(result.changes.find(r=>r.id==='records:local').detail,/仅本机/);assert.match(result.changes.find(r=>r.id==='records:remote').detail,/仅云端/);assert.equal(JSON.stringify([local,remote]),before)
})
test('comparison tolerates empty snapshots and ignores object key ordering',()=>{
 assert.equal(summarize().changes.length,0)
 assert.equal(summarize({records:[{id:'a',score:1}]},{records:'[{"score":1,"id":"a"}]'}).changes.length,0)
 assert.equal(summarize({records:'broken'},{}).local.records,0)
})
function page(callOverride){let definition,modal,created=0,copied;const cache={};const app={globalData:{baseUrl:'https://example.test',userInfo:{id:'A'},sessionToken:'token-A'}};const wx={showModal:o=>{modal=o},getStorageSync:k=>cache[k],setStorageSync:(k,v)=>{cache[k]=structuredClone(v)},removeStorageSync:k=>{delete cache[k]},setClipboardData:o=>{copied=o.data},showToast(){}};vm.runInNewContext(fs.readFileSync(require.resolve('../miniprogram/pages/co-create/index.js'),'utf8'),{setTimeout,clearTimeout,Page:d=>definition=d,require:n=>n.endsWith('/ai-article')?require('../miniprogram/utils/ai-article'):{call:callOverride||async function(){created++;return {token:'new'}}},getApp:()=>app,wx});const p={...definition,data:{activity:{id:'a'},article:{shareEnabled:true},busy:false},setData(patch){for(const [k,v]of Object.entries(patch)){if(k.startsWith('article.'))this.data.article[k.slice(8)]=v;else this.data[k]=v}},run:fn=>fn(),to(screen){this.data.screen=screen}};return {p,cache,app,get modal(){return modal},get created(){return created},get copied(){return copied}}}
test('copying shares never rotates tokens; resetting requires explicit confirmation',async()=>{
 const f=page();f.cache['hui.share.a']='https://example.test/s/original';f.p.copyArticleLink();assert.equal(f.copied,f.cache['hui.share.a']);assert.equal(f.created,0)
 f.p.enableShare();assert.equal(f.created,0);f.modal.success({confirm:false});assert.equal(f.created,0);f.modal.success({confirm:true});await new Promise(r=>setImmediate(r));assert.equal(f.created,1)
})
test('missing cached link never silently resets an active public share',()=>{const f=page();f.p.copyArticleLink();assert.equal(f.created,0);assert.equal(f.copied,undefined)})
test('article drafts survive reopening, retain source revision, and stay isolated by account',()=>{
 const f=page();f.p.data.activity.writable=true;f.p.data.article={revision:4,title:'原文',body:'原文正文',images:[]};f.p.editArticle();f.p.data.editTitle='本机修改';f.p.data.editBody='未提交正文';f.p.data.dirty=true;f.p.flushArticleDraft();assert.equal(f.cache['hui.article.draft.A.a'].revision,4)
 f.p.data.article={revision:5,title:'其他人新版',body:'新版正文',images:[]};f.p.editArticle();assert.match(f.modal.content,/已有更新/);f.modal.success({confirm:true});assert.equal(f.p.data.editBody,'未提交正文');assert.equal(f.p.data.article.revision,4);assert.equal(f.p.data.dirty,true)
 f.app.globalData.userInfo={id:'B'};f.app.globalData.sessionToken='token-B';f.p.data.editBody='不应写入其他账号';f.p.flushArticleDraft();assert.equal(f.cache['hui.article.draft.B.a'],undefined);assert.equal(f.cache['hui.article.draft.A.a'].body,'未提交正文')
})
test('declining draft recovery removes only the current activity draft',()=>{
 const f=page();f.p.data.activity.writable=true;f.p.data.article={revision:1,title:'原文',body:'正文',images:[]};f.cache['hui.article.draft.A.a']={revision:1,title:'草稿',body:'草稿正文',images:[]};f.cache['hui.article.draft.A.other']={body:'其他活动'};f.p.editArticle();f.modal.success({confirm:false});assert.equal(f.p.data.editBody,'正文');assert.equal(f.cache['hui.article.draft.A.a'],undefined);assert.equal(f.cache['hui.article.draft.A.other'].body,'其他活动')
})
test('home continuation never shows another account activity',()=>{
 let definition;const cache={'hui.recent.activity.A':{id:'a',name:'A的活动'}},app={globalData:{sessionToken:'A-token',userInfo:{id:'A'}}},grades={stopDemo(){},count:()=>2,students:()=>({active:'s',students:[{id:'s',name:'当前学生'}]}),read:()=>({values:{exam_draft:{form:{}}}})}
 vm.runInNewContext(fs.readFileSync(require.resolve('../miniprogram/pages/home/index.js'),'utf8'),{Page:d=>definition=d,getApp:()=>app,wx:{getStorageSync:k=>cache[k]},require:()=>grades})
 const p={...definition,data:structuredClone(definition.data),setData(d){Object.assign(this.data,d)}};p.refresh();assert.equal(p.data.recentActivity.id,'a')
 app.globalData={sessionToken:'B-token',userInfo:{id:'B'}};p.onIdentityChanged();assert.equal(p.data.recentActivity,null)
 app.globalData={sessionToken:null,userInfo:null};p.onIdentityChanged();assert.equal(p.data.recentActivity,null)
})
test('student shortcut supports 20 profiles within action-sheet limits and ignores a stale account choice',()=>{
 const ts=require('../backend/node_modules/typescript');let definition,menu,currentScope='A',selected=null
 const students=Array.from({length:20},(_,i)=>({id:'s'+i,name:'学生'+i})),grades={gradePage:d=>definition=d,students:()=>({active:'s19',students}),selectStudent:id=>{selected=id}}
 const source=ts.transpileModule(fs.readFileSync(require.resolve('../miniprogram/packages/grades/pages/dashboard/index.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText
 vm.runInNewContext(source,{exports:{},require:n=>n.endsWith('/grades')?grades:n.endsWith('/scope')?{scopeKey:()=>currentScope}:{},wx:{showActionSheet:o=>{menu=o},redirectTo(){},navigateTo(){}}})
 definition.switchStudent();assert.equal(menu.itemList.length,6);assert.match(menu.itemList[0],/学生19/);currentScope='B';menu.success({tapIndex:1});assert.equal(selected,null)
 currentScope='A';definition.switchStudent();menu.success({tapIndex:1});assert.equal(selected,'s0')
})
function accountPage(call){let definition;const app={globalData:{sessionToken:'A',userInfo:{id:'A'}},setUserInfo(u){this.globalData.userInfo=u}},grades={students:()=>({students:[],active:''}),read:()=>({values:{}}),guestInfo:()=>[],status:()=>({}),conflictBackups:()=>[]};vm.runInNewContext(fs.readFileSync(require.resolve('../miniprogram/pages/account/index.js'),'utf8'),{Page:d=>definition=d,getApp:()=>app,wx:{},require:n=>n.endsWith('/v2')?{call}:n.endsWith('/grades')?grades:n.endsWith('/release')?{version:'test'}:require('../miniprogram/utils/conflict-summary')});return {app,p:{...definition,data:structuredClone(definition.data),setData(d){Object.assign(this.data,d)}}}}
test('account owns points history with paging, readable labels and preserved balance',async()=>{
 const calls=[],f=accountPage(async(command,data)=>{calls.push({command,data});return {user:{id:'A',balance:12,frozen:2},items:Array.from({length:data.offset?1:30},(_,i)=>({id:String(data.offset+i),kind:'gift',at:'2026-11-15',amount:1}))}})
 await f.p.loadPoints(true);assert.equal(f.p.data.ledger.length,30);assert.equal(f.p.data.hasMorePoints,true);assert.equal(f.p.data.user.balance,12);assert.equal(f.p.data.ledger[0].label,'新用户赠点');await f.p.morePoints();assert.equal(calls[1].data.offset,30);assert.equal(f.p.data.ledger.length,31);assert.equal(f.p.data.hasMorePoints,false)
})
test('a late points response cannot expose the previous account history or balance',async()=>{
 let resolve;const f=accountPage(()=>new Promise(r=>{resolve=r}));const pending=f.p.loadPoints(true);f.app.globalData={sessionToken:'B',userInfo:{id:'B',balance:8}};f.p.onIdentityChanged();resolve({user:{id:'A',balance:99},items:[{id:'private-A',kind:'gift',at:'2026-11-15',amount:99}]});await pending;assert.equal(f.p.data.ledger.length,0);assert.equal(f.p.data.user.id,'B');assert.equal(f.app.globalData.userInfo.balance,8);assert.equal(f.p.data.pointsLoading,false)
})
test('activity progress and filters prioritize finalized articles over collection lifecycle',()=>{
 const f=page();f.p.allActivities=[{id:'final',status:'collecting',articleStatus:'final',role:'owner'},{id:'published',status:'archived',articleStatus:'published',role:'collaborator'},{id:'draft',status:'collecting',articleStatus:'draft',role:'owner'},{id:'none',status:'paused',articleStatus:'none',role:'participant'}]
 assert.deepEqual(Array.from(f.p.filterActivities('已成文'),a=>a.id),['final','published']);assert.deepEqual(Array.from(f.p.filterActivities('收集中'),a=>a.id),['draft','none']);assert.equal(f.p.filterActivities('全部').length,4);assert.equal(f.p.decorateActivity(f.p.allActivities[0]).displayStatus,'已成文');assert.equal(f.p.decorateActivity(f.p.allActivities[1]).writable,false)
})
test('reading the newly finalized article updates the visible activity status immediately',async()=>{
 const f=page(async()=>({id:'v',status:'final',revision:1,title:'文章',body:'正文',images:[]}));f.p.data.activity={id:'a',status:'collecting',role:'owner',articleStatus:'none'};f.p.data.screen='article';await f.p.loadArticle(false);assert.equal(f.p.data.activity.displayStatus,'已成文');assert.equal(f.p.data.activity.articleStatus,'final')
})
