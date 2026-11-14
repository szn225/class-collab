// Isolated native UI/transport fixture. No production profile, uploads, or model calls.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const automator=require('/private/tmp/hui-layout-verify/node_modules/miniprogram-automator'),out=path.resolve(__dirname,'../docs/device-test/release-2.5.5')
async function main(){
 console.log('Connecting native profile fixture');const mini=await automator.connect({wsEndpoint:'ws://127.0.0.1:9449'}),errors=[],fixtureId='profile255_'+Date.now().toString(36);mini.on('exception',e=>errors.push(e));let original
 async function current(route){for(let i=0;i<50;i++){const p=await mini.currentPage();if(p?.path===route)return p;await new Promise(r=>setTimeout(r,150))}throw Error('Route not reached: '+route)}
 try{
  await mini.mockWxMethod('request',{statusCode:503,data:{ok:false,error:'隔离界面验收'}})
  await mini.reLaunch('/pages/home/index');original=await mini.evaluate(()=>({token:wx.getStorageSync('hui.session'),user:wx.getStorageSync('hui.user')}));await mini.evaluate(()=>getApp().clearSession())
  const user={id:fixtureId,name:'',balance:12,frozen:0,state:'active',profileSetupDone:false,hasAvatar:false}
  await mini.mockWxMethod('login',{code:'native-profile-fixture'})
  await mini.mockWxMethod('request',{statusCode:200,data:{ok:true,data:{token:'fixture-session-'+fixtureId,user}}})
  let p=await mini.reLaunch('/pages/login/index');await p.callMethod('consent',{detail:{value:['yes']}});await p.callMethod('login');assert.equal(await p.data('profileStep'),true);assert.ok(await p.$('button[open-type="chooseAvatar"]'));assert.ok(await p.$('input[type="nickname"]'));await mini.screenshot({path:path.join(out,'first-login.png')});console.log('PASS native first login opens optional profile in the same page')
  const saved={...user,name:'林晓',profileSetupDone:true,hasAvatar:true,avatarUrl:'/assets/ui/records-decoration.png',avatarExpiresAt:Date.now()+3600000,url:'https://fixture.invalid/avatar-upload'}
  await mini.mockWxMethod('request',{statusCode:200,data:{ok:true,data:saved}})
  await p.callMethod('chooseAvatar',{detail:{avatarUrl:'/assets/ui/records-decoration.png'}});await p.callMethod('nicknameBlur',{detail:{value:'林晓'}});await p.callMethod('nicknameReview',{detail:{pass:true}});await mini.screenshot({path:path.join(out,'profile-selected.png')})
  await p.callMethod('saveProfile',{detail:{value:{nickname:'林晓'}}});await p.waitFor(500)
  p=await current('pages/home/index');assert.equal(await p.data('user.name'),'林晓');assert.equal(await p.data('user.avatarUrl'),saved.avatarUrl);assert.ok(await p.$('.account-avatar image'));await mini.screenshot({path:path.join(out,'home-profile.png')});console.log('PASS native avatar local bytes upload through mocked transport and saved profile displays on home')
  // Account cloud student-list transport is outside this static profile fixture.
  await mini.mockWxMethod('request',{statusCode:503,data:{ok:false,error:'隔离资料展示'}})
  await p.callMethod('account');p=await current('pages/account/index');await p.waitFor(500);await p.setData({error:'',busy:false});assert.equal(await p.data('user.name'),'林晓');assert.ok(await p.$('.identity-card image'));await mini.screenshot({path:path.join(out,'account-profile.png')})
  await p.callMethod('editProfile');p=await current('pages/login/index');assert.equal(await p.data('profileStep'),true);assert.equal(await p.data('nickname'),'林晓');await mini.screenshot({path:path.join(out,'edit-profile.png')});assert.deepEqual(errors,[])
  fs.writeFileSync(path.join(out,'simulator-check.json'),JSON.stringify({transport:'static profile mock, grade student-list not covered by this native fixture',firstLoginOptionalProfile:true,nativeAvatarInput:true,nativeNicknameInput:true,localAvatarBytes:true,saveProfile:true,homeDisplay:true,accountDisplay:true,editExisting:true,exceptions:errors},null,2)+'\n');console.log('PASS native home/account avatar display and same-page editing; no production writes')
 }catch(e){try{const p=await mini.currentPage();console.log('Failure state',JSON.stringify({path:p?.path,error:p?await p.data('error'):null}));await mini.screenshot({path:path.join(out,'failure.png')})}catch{}throw e}
 finally{
  if(original)await mini.evaluate((s,id)=>{const app=getApp();if(s.token&&s.user)app.setSession(s.token,s.user);else app.clearSession();for(const key of wx.getStorageInfoSync().keys)if(key.includes(id))wx.removeStorageSync(key)},original,fixtureId)
  await mini.restoreWxMethod('request');await mini.restoreWxMethod('login');await mini.reLaunch('/pages/home/index');await mini.disconnect()
 }
}
main().catch(e=>{console.error(e);process.exitCode=1})
