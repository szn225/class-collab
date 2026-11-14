const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test')
const source=file=>fs.readFileSync(require('node:path').join(__dirname,'../miniprogram',file),'utf8')
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}}
const tick=()=>new Promise(r=>setImmediate(r))
test('only simultaneous reads share transport, with isolated results and sessions',async()=>{
 const requests=[],app={globalData:{baseUrl:'https://fixture.invalid',sessionToken:'A'},clearSession(){this.globalData.sessionToken=''}}
 const m={exports:{}};vm.runInNewContext(source('utils/v2.js'),{module:m,getApp:()=>app,wx:{request:o=>requests.push(o)},Date,Math,Promise,Error})
 const call=m.exports.call,finish=(i,data={items:[]})=>requests[i].success({statusCode:200,data:{ok:true,data}})
 const a=call('materials.list',{activityId:'1'}),b=call('materials.list',{activityId:'1'});assert.equal(requests.length,1);finish(0)
 const [one,two]=await Promise.all([a,b]);one.items.push('changed');assert.equal(two.items.length,0)
 const c=call('materials.list',{activityId:'1'});assert.equal(requests.length,2);finish(1);await c
 const old=call('activity.get',{activityId:'1'});const rejected=assert.rejects(old,/账号已切换/);app.globalData.sessionToken='B';const current=call('activity.get',{activityId:'1'});assert.equal(requests.length,4);finish(2);finish(3);await rejected;await current
 const write1=call('material.send',{},'operation'),write2=call('material.send',{},'operation');assert.equal(requests.length,6);finish(4);finish(5);await Promise.all([write1,write2])
 const failed=call('me'),failure=assert.rejects(failed,/网络连接/);requests[6].fail({errMsg:'offline'});await failure;const retry=call('me');assert.equal(requests.length,8);finish(7);await retry
 // A write invalidates an outstanding read so its post-write refresh cannot reuse an old snapshot.
 const before=call('article.get',{activityId:'1'}),write=call('article.save');const after=call('article.get',{activityId:'1'});assert.equal(requests.length,11);finish(8);finish(9);finish(10);await Promise.all([before,write,after])
})
function pageFixture(){
 let definition;const calls=[],app={globalData:{sessionToken:'A'},setUserInfo(){}}
 const api={call:(command,data)=>{const d=deferred();calls.push({command,data,...d});return d.promise}}
 const wx={setNavigationBarTitle(){},pageScrollTo(){},showToast(){}}
 vm.runInNewContext(source('pages/co-create/index.js'),{Page:d=>definition=d,require:name=>name.endsWith('ai-article')?{renderArticle:()=>''}:api,getApp:()=>app,wx,Date,Math,Promise,setTimeout:()=>1,clearTimeout(){}})
 const p={...definition,data:structuredClone(definition.data),stack:[],allActivities:[{id:'1',name:'活动',role:'owner',status:'collecting'}],visiblePage:true,setData(patch){Object.assign(this.data,patch)}};p.data.user={id:'u'}
 return {p,calls,app}
}
test('activity opens immediately with two parallel reads; late results cannot overwrite another view or account',async()=>{
 const {p,calls,app}=pageFixture();const opened=p.openActivity({currentTarget:{dataset:{id:'1'}}});assert.equal(p.data.screen,'stream');assert.equal(p.data.busy,false);await tick()
 assert.equal(calls.map(c=>c.command).join(','),'activity.get,materials.list')
 calls[0].resolve({id:'1',role:'owner',status:'collecting',revision:1});calls[1].resolve({items:[],hasMore:false});await opened;assert.equal(p.data.loading,false)
 const old=p.loadStream(false);p.to('settings');calls[2].resolve({id:'1',role:'participant',status:'paused'});calls[3].resolve({items:[{id:'old',images:[]}],hasMore:false});await old;assert.equal(p.data.screen,'settings');assert.equal(p.data.activity.role,'owner');assert.equal(p.data.materials.length,0)
 const first=p.loadArticle();const second=p.loadArticle();calls[5].resolve({id:'new',body:'新',images:[]});await second;calls[4].resolve({id:'old',body:'旧',images:[]});await first;assert.equal(p.data.article.id,'new')
 const switched=p.loadStream();app.globalData.sessionToken='B';p.onIdentityChanged();calls[6].resolve({id:'1',role:'owner',status:'collecting'});calls[7].resolve({items:[],hasMore:false});await switched;assert.equal(p.data.user,null);assert.equal(p.data.activity,null);assert.equal(p.data.loading,false)
})
test('bootstrap reads run in parallel and an old failing view cannot redirect the current view',async()=>{
 const {p,calls}=pageFixture();const restoring=p.restore();assert.equal(calls.map(c=>c.command).join(','),'me,activities.list');calls[0].resolve({id:'u',name:'姓名'});calls[1].resolve([]);await restoring;assert.equal(p.data.loading,false)
 p.setActivity({id:'1',role:'owner',status:'collecting'});const old=p.loadStream();p.to('create');calls[2].reject(Object.assign(Error('权限改变'),{status:403,command:'activity.get'}));calls[3].resolve({items:[]});await old;assert.equal(p.data.screen,'create');assert.equal(p.data.error,'')
})
test('grade pages render before slow sync, refresh cloud changes, and ignore hidden/account-switched completions',async()=>{
 const storage=new Map(),calls=[],app={globalData:{sessionToken:'A',userInfo:{id:'u'}}};let definition
 const wx={getStorageSync:k=>structuredClone(storage.get(k))||'',setStorageSync:(k,v)=>storage.set(k,structuredClone(v)),redirectTo(){}}
 const m={exports:{}};vm.runInNewContext(source('utils/grades.js'),{module:m,Page:d=>definition=d,getApp:()=>app,wx,Date,Math,Promise,setTimeout:()=>1,clearTimeout(){},require:()=>({call:(command,data)=>{const d=deferred();calls.push({command,data,...d});return d.promise}})})
 const grades=m.exports,key=grades.scopeKey();storage.set(key,{values:{records:'[]'},generation:0,syncedGeneration:0,revision:0,enabled:true})
 let shown=0;grades.gradePage({data:{},onShow(){shown++}});const p={...definition,data:{},setData(){}};p.onLoad();p.onShow();assert.equal(shown,1);assert.equal(calls.length,1)
 calls[0].resolve({revision:1,values:{records:'[]'}});await tick();assert.equal(shown,2)
 p.onShow();assert.equal(shown,3);assert.equal(calls.length,1);p.onHide();assert.equal(calls.length,1)
 // Force a dirty sync; its completion must not re-render a hidden page.
 const doc=grades.read();doc.generation++;storage.set(key,doc);p.onShow();assert.equal(shown,4);assert.equal(calls.length,2);p.onHide();calls[1].resolve({revision:2});await tick();assert.equal(shown,4)
 const doc2=grades.read();doc2.generation++;storage.set(key,doc2);p.onShow();assert.equal(shown,5);app.globalData.sessionToken='B';app.globalData.userInfo={id:'v'};calls[2].resolve({revision:3});await tick();assert.equal(shown,5)
})

test('content stays usable without loading banner during refresh; first load and empty loaded views settle correctly',async()=>{
 const {p,calls}=pageFixture();p.setActivity({id:'1',role:'owner',status:'collecting'});
 const first=p.loadArticle();assert.equal(p.data.loading,true);assert.equal(p.data.refreshing,false);calls[0].resolve(null);await first;assert.equal(p.data.loading,false);assert.equal(p.data.refreshing,false);
 const again=p.loadArticle();assert.equal(p.data.loading,false);assert.equal(p.data.refreshing,true);calls[1].resolve(null);await again;assert.equal(p.data.refreshing,false);
 p.data.article={id:'saved',body:'已有正文'};const refresh=p.loadArticle();assert.equal(p.data.loading,false);assert.equal(p.data.article.id,'saved');calls[2].reject(Error('暂时断网'));await assert.rejects(refresh,/暂时断网/);assert.equal(p.data.loading,false);assert.equal(p.data.refreshing,false);assert.equal(p.data.article.id,'saved');
 const settings=p.settings();await tick();assert.equal(p.data.screen,'settings');assert.equal(p.data.loading,false);assert.equal(p.data.refreshing,true);calls[3].resolve({id:'1',role:'owner',status:'collecting'});await settings;assert.equal(p.data.refreshing,false);
})
