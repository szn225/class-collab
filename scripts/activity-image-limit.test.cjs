const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),test=require('node:test')
const ts=require('../backend/node_modules/typescript')
require.extensions['.ts']=(m,filename)=>m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename)
const {execute:rawExecute}=require('../backend/src/lib/v2/domain.ts'),{initialState,hash}=require('../backend/src/lib/v2/model.ts')
let sequence=0
const execute=(s,command,body,context)=>rawExecute(s,command,{requestId:'image_limit_test_'+(++sequence),...body},context)
test('activity quota includes all members and pending uploads; text remains available',()=>{
 const s=initialState(),now=Date.now(),owner={now,sessionHash:hash('owner')},guest={now,sessionHash:hash('guest')}
 execute(s,'auth.login',{}, {now,identity:'one',sessionToken:'owner',source:'one'})
 execute(s,'auth.login',{}, {now,identity:'two',sessionToken:'guest',source:'two'})
 execute(s,'profile.update',{name:'发起人'},owner);execute(s,'profile.update',{name:'参与者'},guest)
 const a=execute(s,'activity.create',{name:'测试活动',description:'说明'},owner),activityId=a.id
 execute(s,'activity.join',{inviteCode:a.inviteCode},guest)
 const uploads=Array.from({length:20},(_,i)=>execute(s,'upload.prepare',{activityId,size:100,mime:'image/jpeg'},i%2?guest:owner))
 assert.throws(()=>execute(s,'upload.prepare',{activityId,size:100,mime:'image/jpeg'},guest),e=>e.code==='ACTIVITY_IMAGE_LIMIT')
 execute(s,'upload.complete',{activityId,uploadId:uploads[0].id},owner)
 execute(s,'material.send',{activityId,text:'第一张',uploadIds:[uploads[0].id]},owner)
 assert.equal(execute(s,'activity.get',{activityId},guest).imageCount,1)
 assert.ok(execute(s,'material.send',{activityId,text:'达到上限仍能发文字',uploadIds:[]},guest).id)
 s.uploads[1].expires=now-1
 assert.ok(execute(s,'upload.prepare',{activityId,size:100,mime:'image/jpeg'},guest).id)
 assert.throws(()=>execute(s,'upload.prepare',{activityId,size:100,mime:'image/jpeg'},owner),e=>e.code==='ACTIVITY_IMAGE_LIMIT')
 // Previously issued upload credentials must not bypass the quota at submission.
 s.uploads.forEach(x=>{x.used=true;x.complete=true})
 const extra={...s.uploads[0],id:'old-credential',used:false,expires:now+10000};s.uploads.push(extra)
 assert.throws(()=>execute(s,'material.send',{activityId,text:'',uploadIds:[extra.id]},owner),e=>e.code==='ACTIVITY_IMAGE_LIMIT')
})
test('admin can change activity quota and old configs default to a three-photo batch',()=>{
 const s=initialState(),now=Date.now(),owner={now,sessionHash:hash('owner')},admin={now,sessionHash:hash('admin')}
 delete s.config.maxActivityImages;s.config.maxImages=6
 execute(s,'auth.login',{}, {now,identity:'one',sessionToken:'owner',source:'one'})
 execute(s,'profile.update',{name:'发起人'},owner)
 const a=execute(s,'activity.create',{name:'测试'},owner),activityId=a.id
 assert.equal(a.imageLimit,20);assert.equal(a.batchImageLimit,3)
 execute(s,'admin.login',{}, {now,adminLogin:true,sessionToken:'admin',source:'admin'})
 assert.equal(execute(s,'admin.config',{},admin).current.maxActivityImages,20)
 execute(s,'admin.configure',{version:s.config.version,values:{maxActivityImages:1},reason:'调整图片上限'},admin)
 assert.equal(execute(s,'activity.get',{activityId},owner).imageLimit,1)
 const first=execute(s,'upload.prepare',{activityId,size:100,mime:'image/jpeg'},owner)
 assert.throws(()=>execute(s,'upload.prepare',{activityId,size:100,mime:'image/jpeg'},owner),e=>e.message.includes('1张'))
 execute(s,'admin.configure',{version:s.config.version,values:{maxActivityImages:30},reason:'增加图片上限'},admin)
 assert.ok(execute(s,'upload.prepare',{activityId,size:100,mime:'image/jpeg'},owner).id)
 assert.equal(execute(s,'activity.get',{activityId},owner).imageLimit,30)
 assert.throws(()=>execute(s,'material.send',{activityId,text:'',uploadIds:['a','b','c','d']},owner),e=>e.message.includes('3张'))
 assert.throws(()=>execute(s,'admin.configure',{version:s.config.version,values:{maxActivityImages:0},reason:'无效上限'},admin))
})
