// Real navigation + local isolated fixture. No auth request or production writes.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict')
const automator=require('/private/tmp/hui-grades-verify/node_modules/miniprogram-automator')
const out=path.resolve(__dirname,'../docs/device-test/release-2.3.3'),pause=ms=>new Promise(r=>setTimeout(r,ms))
async function main(){
 fs.mkdirSync(out,{recursive:true});const mini=await automator.launch({cliPath:'/Applications/wechatwebdevtools.app/Contents/MacOS/cli',projectPath:path.resolve(__dirname,'../miniprogram'),port:9444,trustProject:true,timeout:45000})
 const fixture='icons233_'+Date.now().toString(36),errors=[];let original,backup
 mini.on('exception',e=>errors.push(e))
 async function current(route){for(let i=0;i<100;i++){const p=await mini.currentPage();if(p?.path===route){await p.waitFor(350);return p}await pause(150)}throw Error('Did not reach '+route)}
 async function loaded(p){for(let i=0;i<60;i++){if((await p.data('groups'))?.length)return;await pause(150)}throw Error('Record bootstrap did not finish')}
 async function shot(name){await pause(250);await mini.screenshot({path:path.join(out,name+'.png')})}
 try{
  let p=await mini.reLaunch('/pages/home/index');await p.waitFor(1200)
  original=await mini.evaluate(()=>({token:wx.getStorageSync('hui.session'),user:wx.getStorageSync('hui.user'),guest:wx.getStorageSync('hui.grades.students.guest'),pending:wx.getStorageSync('hui.pendingGradeSave')}))
  backup=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'hui233-state-')),'original.local.json');fs.writeFileSync(backup,JSON.stringify(original),{mode:0o600})
  await mini.mockWxMethod('request',{statusCode:503,data:{ok:false,error:'Isolated native UI test'}})
  await mini.evaluate(id=>{getApp().clearSession();wx.setStorageSync('hui.grades.students.guest',{active:id,students:[{id,name:'图标验收'}]})},fixture)
  await p.callMethod('refresh');await shot('home')
  await (await p.$('.entry-card.grades')).tap();p=await current('packages/grades/pages/record/index');await loaded(p)
  assert.equal(await p.data('showSubjects'),false);assert.equal(await p.data('showMore'),false);assert.equal((await p.$$('.score-row')).length,0)
  let tabs=await p.$('grade-tabs');assert.ok(tabs);assert.equal(await tabs.data('value'),1)
  const save=await p.$('.save-primary'),saveOffset=await save.offset(),saveSize=await save.size(),bar=await tabs.$('.tabbar'),barOffset=await bar.offset(),barSize=await bar.size()
  assert.ok(Number(saveOffset.top)+Number(saveSize.height)<=Number(barOffset.top)+1);assert.ok(Number(barSize.height)<=73);await shot('record-collapsed')
  await (await p.$('.subject-toggle')).tap();await pause(200);assert.equal((await p.$$('.score-row')).length,7)
  assert.equal(await (await p.$('.score-entry input')).attribute('placeholder'),'');await shot('record-expanded')
  await p.callMethod('onSubjectInput',{currentTarget:{dataset:{index:0,key:'score'}},detail:{value:'105'}})
  await p.callMethod('onInput',{currentTarget:{dataset:{field:'cityRank'}},detail:{value:'5000'}})
  await p.callMethod('onInput',{currentTarget:{dataset:{field:'examName'}},detail:{value:'2.3.3菜单草稿验收'}})
  await tabs.callMethod('onTap',{currentTarget:{dataset:{index:2}}});p=await current('packages/grades/pages/plan/index');await shot('plan')
  tabs=await p.$('grade-tabs');await tabs.callMethod('onTap',{currentTarget:{dataset:{index:1}}});p=await current('packages/grades/pages/record/index');await loaded(p)
  assert.equal(await p.data('form.examName'),'2.3.3菜单草稿验收');assert.equal((await p.data('form.subjects'))[0].score,'105');assert.equal(await p.data('showSubjects'),false)
  await p.callMethod('onToggleSubjects');await p.callMethod('onSubjectInput',{currentTarget:{dataset:{index:0,key:'score'}},detail:{value:'121'}});await p.callMethod('onToggleSubjects');assert.equal(await p.data('showSubjects'),false)
  await (await p.$('.save-primary')).tap();await pause(250);assert.equal(await p.data('showSubjects'),true);assert.match(await p.data('subjectError'),/语文/)
  await p.callMethod('onSubjectInput',{currentTarget:{dataset:{index:0,key:'score'}},detail:{value:'105'}})
  await (await p.$('.save-primary')).tap();p=await current('packages/grades/pages/dashboard/index');assert.equal(await p.data('saved'),true);assert.equal((await p.data('examList')).length,1);await shot('dashboard')
  tabs=await p.$('grade-tabs');await tabs.callMethod('onTap',{currentTarget:{dataset:{index:1}}});p=await current('packages/grades/pages/record/index');await loaded(p);assert.equal((await p.data('form.subjects'))[0].score,'');assert.equal(await p.data('draftNotice'),'')
  tabs=await p.$('grade-tabs');await tabs.callMethod('onTap',{currentTarget:{dataset:{index:3}}});p=await current('packages/grades/pages/reference/index');await p.waitFor(700);await shot('reference')
  await mini.reLaunch('/pages/co-create/index');p=await current('pages/co-create/index');await shot('co-create');await p.callMethod('navigate',{currentTarget:{dataset:{screen:'create'}}});await shot('co-create-form')
  assert.deepEqual(errors,[])
  console.log('PASS native: optional subjects start collapsed; seven blank-placeholder inputs expand; Save above menu; 72px max navigation; unsaved tab-switch restores draft; hidden invalid scores reveal; Save persists; saved draft stays cleared; icon screenshots captured')
 }catch(e){try{await shot('failure')}catch{}throw e}
 finally{
  let restored=false
  try{if(original){await mini.evaluate((s,id)=>{if(s.token&&s.user)getApp().setSession(s.token,s.user);else getApp().clearSession();if(s.guest)wx.setStorageSync('hui.grades.students.guest',s.guest);else wx.removeStorageSync('hui.grades.students.guest');if(s.pending)wx.setStorageSync('hui.pendingGradeSave',s.pending);else wx.removeStorageSync('hui.pendingGradeSave');for(const key of wx.getStorageInfoSync().keys)if(key.includes('.guest.student.'+id))wx.removeStorageSync(key)},original,fixture);restored=true}}finally{if(restored&&backup)fs.rmSync(path.dirname(backup),{recursive:true});await mini.restoreWxMethod('request');await mini.reLaunch('/pages/home/index');await mini.disconnect()}
 }
}
main().catch(e=>{console.error(e);process.exitCode=1})
