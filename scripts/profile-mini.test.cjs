const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test')
const src=f=>fs.readFileSync(path.resolve(__dirname,'../miniprogram',f),'utf8'),tick=()=>new Promise(r=>setImmediate(r))
function setup(user={id:'A',name:'',profileSetupDone:false}){
 let definition,logged=false,failSave=false;const calls=[],storage=new Map(),app={globalData:{sessionToken:'',userInfo:null},setUserInfo(u){this.globalData.userInfo=u}},wx={canIUse:()=>false,getStorageSync:k=>storage.get(k)||'',setStorageSync:(k,v)=>storage.set(k,v),navigateBack(){calls.push({command:'back'})},reLaunch(o){calls.push({command:'relaunch',url:o.url})}}
 const auth={isLoggedIn:()=>logged,login:async()=>{logged=true;app.globalData.sessionToken='token-A';app.globalData.userInfo=user;return user},claimGradeSave:id=>calls.push({command:'claim',id})}
 const api={requestId:()=> 'fixture_'+Math.random().toString(36).slice(2),uploadAvatar:async photo=>{calls.push({command:'upload',photo});photo.uploadId='avatar-upload';return photo.uploadId},call:async(command,data,id)=>{calls.push({command,data,id});if(failSave)throw Error('响应丢失');return {...app.globalData.userInfo,...(data.name?{name:data.name}:{}),profileSetupDone:true,...(data.avatarUploadId?{avatarUrl:'https://fixture.invalid/avatar',hasAvatar:true,avatarExpiresAt:Date.now()+3600000}:{})}}}
 vm.runInNewContext(src('pages/login/index.js'),{Page:d=>definition=d,require:n=>n.endsWith('/auth')?auth:n.endsWith('/grades')?{refreshStudents:async()=>calls.push({command:'students'})}:api,getApp:()=>app,wx,Date,Math,Promise,setTimeout,clearTimeout})
 const p={...definition,data:structuredClone(definition.data),setData(d){Object.assign(this.data,d)}};p.onLoad({});p.data.consent=true
 return {p,app,calls,storage,wx,fail(v){failSave=v},signed(){logged=true;app.globalData.sessionToken='token-A';app.globalData.userInfo=user}}
}
test('new login offers optional profile in the same page; skip resumes held grade save without profile mutation',async()=>{
 const {p,calls,storage}=setup();p.data.saveId='held-grade';await p.login();assert.equal(p.data.profileStep,true);assert.ok(!calls.some(c=>c.command==='claim'))
 await p.skipProfile();assert.equal(storage.get('hui.profile.dismissed.A'),true);assert.equal(calls.map(c=>c.command).join(','),'claim,students,relaunch');assert.ok(calls.at(-1).url.endsWith('save=held-grade'))
})
test('avatar and nickname save persist to account; failed save retains selection and retries the same operation',async()=>{
 const {p,app,calls,fail}=setup();await p.login();p.chooseAvatar({detail:{avatarUrl:'/tmp/selected.png'}});p.nicknameInput({detail:{value:'微信昵称'}});fail(true);await p.saveProfile({detail:{value:{nickname:'微信昵称'}}});assert.equal(p.data.avatarPreview,'/tmp/selected.png');assert.equal(app.globalData.userInfo.name,'');assert.equal(p.data.busy,false)
 const first=calls.find(c=>c.command==='profile.update');fail(false);await p.saveProfile({detail:{value:{nickname:'微信昵称'}}});const saves=calls.filter(c=>c.command==='profile.update');assert.equal(saves[1].id,first.id);assert.equal(saves[1].data.avatarUploadId,'avatar-upload');assert.equal(app.globalData.userInfo.name,'微信昵称');assert.ok(app.globalData.userInfo.avatarUrl);assert.equal(calls.at(-1).command,'back')
})
test('returning users continue directly; editing is explicit and account switches discard the draft',async()=>{
 const f=setup({id:'A',name:'已有昵称',profileSetupDone:true,avatarUrl:'https://fixture.invalid/avatar'});await f.p.login();assert.equal(f.p.data.profileStep,false);assert.equal(f.calls.at(-1).command,'back');f.p.onLoad({profile:'1'});assert.equal(f.p.data.profileStep,true);assert.equal(f.p.data.nickname,'已有昵称')
 f.app.globalData.userInfo={id:'B',name:'别人'};f.app.globalData.sessionToken='token-B';f.p.onIdentityChanged();assert.equal(f.p.data.profileStep,false);assert.equal(f.p.data.avatarPreview,'');assert.equal(f.p.data.nickname,'');await f.p.saveProfile();assert.ok(!f.calls.some(c=>c.command==='profile.update'))
})
test('nickname review failure blocks save, and a passed review allows it',async()=>{
 const {p,calls}=setup();await p.login();p.canReview=true;p.nicknameBlur({detail:{value:'待检查昵称'}});p.nicknameReview({detail:{pass:false}});await p.saveProfile();assert.ok(!calls.some(c=>c.command==='profile.update'));assert.match(p.data.error,/未通过/)
 p.nicknameReview({detail:{pass:true}});await p.saveProfile();assert.equal(calls.filter(c=>c.command==='profile.update').length,1)
})
test('avatar upload validates local bytes, retries an already-uploaded object, and blocks account-switch continuation',async()=>{
 const m={exports:{}},app={globalData:{sessionToken:'A',baseUrl:'https://fixture.invalid'}},commands=[],png=new Uint8Array([137,80,78,71]).buffer;let putFailure=true,switchOnRead=false
 const wx={getFileSystemManager:()=>({readFile(o){if(switchOnRead)app.globalData.sessionToken='B';o.success({data:png})}}),request(o){if(o.method==='PUT'){commands.push('PUT');if(putFailure){putFailure=false;o.fail({errMsg:'timeout'})}else o.success({statusCode:409});return}const command=o.url.split('/api/v2/')[1].replaceAll('/','.');commands.push(command);o.success({statusCode:200,data:{ok:true,data:command==='profile.avatar.prepare'?{id:'upload',url:'https://fixture.invalid/upload'}:{id:'upload'}}})}}
 vm.runInNewContext(src('utils/v2.js'),{module:m,getApp:()=>app,wx,Date,Math,Promise,Error,Uint8Array});const photo={path:'/local.png',requestId:'photo_fixed'};await assert.rejects(()=>m.exports.uploadAvatar(photo),/超时/);assert.equal(await m.exports.uploadAvatar(photo),'upload');assert.equal(commands.filter(c=>c==='profile.avatar.prepare').length,1);assert.equal(commands.filter(c=>c==='profile.avatar.complete').length,1)
 switchOnRead=true;await assert.rejects(()=>m.exports.uploadAvatar({path:'/new.png'}),/账号已切换/);assert.equal(commands.filter(c=>c==='profile.avatar.prepare').length,1)
})
test('expired avatar refresh cannot put another account back into the home page',async()=>{
 let definition,resolve;const app={globalData:{sessionToken:'A',userInfo:{id:'A',hasAvatar:true,avatarUrl:'expired',avatarExpiresAt:1}},setUserInfo(u){this.globalData.userInfo=u}},pending=new Promise(r=>resolve=r)
 vm.runInNewContext(src('pages/home/index.js'),{Page:d=>definition=d,getApp:()=>app,Date,require:n=>n.endsWith('/grades')?{stopDemo(){},count:()=>0}:{call:()=>pending}})
 const p={...definition,data:structuredClone(definition.data),setData(d){Object.assign(this.data,d)}};p.refresh();app.globalData.sessionToken='B';app.globalData.userInfo={id:'B',name:'另一账号'};p.onIdentityChanged();resolve({id:'A',avatarUrl:'refreshed'});await tick();assert.equal(app.globalData.userInfo.id,'B');assert.equal(p.data.user.id,'B')
})
test('incomplete nickname-only accounts still see avatar setup instead of skipping it',async()=>{
 const f=setup({id:'A',name:'已填昵称',profileSetupDone:false});await f.p.login();assert.equal(f.p.data.profileStep,true);assert.equal(f.p.data.nickname,'已填昵称');assert.ok(!f.calls.some(c=>c.command==='back'))
})
test('album selection uses the real image picker and saves the selected avatar',async()=>{
 const f=setup();await f.p.login();let options;f.wx.chooseMedia=o=>{options=o;o.success({tempFiles:[{tempFilePath:'/tmp/album.jpg'}]})};await f.p.chooseAvatarFromAlbum();assert.deepEqual(Array.from(options.sourceType),['album']);assert.equal(f.p.data.avatarPreview,'/tmp/album.jpg');assert.equal(f.p.data.choosingAvatar,false);await f.p.saveProfile();assert.equal(f.calls.find(c=>c.command==='upload').photo.path,'/tmp/album.jpg');assert.equal(f.app.globalData.userInfo.hasAvatar,true)
})
test('cancelled album selection preserves the avatar; old account callbacks are discarded',async()=>{
 const f=setup();await f.p.login();f.p.chooseAvatar({detail:{avatarUrl:'/tmp/original.jpg'}});f.wx.chooseMedia=o=>o.fail({errMsg:'chooseMedia:fail cancel'});await f.p.chooseAvatarFromAlbum();assert.equal(f.p.data.avatarPreview,'/tmp/original.jpg');assert.equal(f.p.data.error,'')
 let pending;f.wx.chooseMedia=o=>{pending=o};const select=f.p.chooseAvatarFromAlbum();f.app.globalData={sessionToken:'token-B',userInfo:{id:'B'}};f.p.onIdentityChanged();pending.success({tempFiles:[{tempFilePath:'/tmp/private-A.jpg'}]});await select;assert.equal(f.p.data.avatarPreview,'');assert.equal(f.p.photo,null);assert.equal(f.p.data.choosingAvatar,false)
})
test('native avatar failures provide actionable feedback',async()=>{
 const f=setup();await f.p.login();f.p.avatarPickerError({detail:{errMsg:'chooseAvatar:fail privacy permission is not authorized'}});assert.match(f.p.data.error,/隐私授权/);f.p.avatarPickerError({detail:{errMsg:'chooseAvatar:fail unknown'}});assert.match(f.p.data.error,/相册/)
})
test('profile probe invokes WeChat directly on tap and never saves an anonymous response',()=>{
 const f=setup();f.signed();f.p.onLoad({profile:'1',probe:'1'});let request;f.wx.getUserProfile=o=>{request=o};f.p.probeWechatProfile();assert.ok(request);assert.equal(f.p.data.probeBusy,true);request.success({userInfo:{nickName:'微信用户',avatarUrl:'https://example.invalid/default'}});assert.match(f.p.data.probeResult,/不能据此确认/);assert.equal(f.p.data.probeBusy,false);assert.ok(!f.calls.some(c=>c.command==='profile.update'||c.command==='upload'));assert.equal(f.app.globalData.userInfo.name,'')
})
test('profile probe discards an old account response and remains hidden without the probe query',()=>{
 const f=setup();f.signed();let count=0,request;f.wx.getUserProfile=o=>{count++;request=o};f.p.probeWechatProfile();assert.equal(count,0);f.p.onLoad({profile:'1',probe:'1'});f.p.probeWechatProfile();f.app.globalData={sessionToken:'B',userInfo:{id:'B',name:'B'}};f.p.onIdentityChanged();request.success({userInfo:{nickName:'A的隐私资料',avatarUrl:'https://example.invalid/private-A'}});assert.equal(f.p.data.probeNickname,'');assert.equal(f.p.data.probeAvatar,'');assert.equal(f.app.globalData.userInfo.name,'B')
})
