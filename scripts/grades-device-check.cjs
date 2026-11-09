// Native UX flow with isolated local fixtures and mocked transport. No production writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const automator=require(path.join(process.env.HUI_TEST_DEPS||'/private/tmp/hui-grades-verify/node_modules','miniprogram-automator'))
const port=Number(process.env.HUI_AUTOMATION_PORT||9432)
const out=path.resolve(__dirname,'../docs/device-test/release-2.1.1')
const delay=ms=>new Promise(r=>setTimeout(r,ms))
async function main(){
 fs.mkdirSync(out,{recursive:true});let mini
 try{mini=await automator.connect({wsEndpoint:'ws://127.0.0.1:'+port})}catch{mini=await automator.launch({cliPath:'/Applications/wechatwebdevtools.app/Contents/MacOS/cli',projectPath:path.resolve(__dirname,'../miniprogram'),port,trustProject:true,timeout:45000})}
 console.log('Connected to native UX test');const errors=[];mini.on('exception',e=>errors.push(e));let original,fixtureId='ux_'+Date.now().toString(36)
 async function current(expected){await delay(3000);let last='';for(let i=0;i<30;i++){const p=await mini.currentPage();last=p?.path||'';if(p?.path===expected)return p;await delay(250)}throw new Error('Navigation did not reach '+expected+' (last '+last+')')}
 async function waitIdle(page){for(let i=0;i<40;i++){const data=await page.data();if(!data.busy&&!data.saving&&data.groups?.length)return;await delay(150)}throw new Error('Form did not finish loading')}
 try{
  original=await mini.evaluate(()=>({token:wx.getStorageSync('hui.session'),user:wx.getStorageSync('hui.user'),guest:wx.getStorageSync('hui.grades.students.guest'),pending:wx.getStorageSync('hui.pendingGradeSave')}))
  console.log('Preserved existing local session');
  await mini.mockWxMethod('login',{code:'ux_fixture_code'})
  await mini.evaluate(id=>{const app=getApp();app.clearSession();app.globalData.ux={id,user:{id,name:'测试用户'},calls:[],students:[],cloud:{},failSave:false};wx.setStorageSync('hui.grades.students.guest',{active:id,students:[{id,name:'测试学生'}]})},fixtureId)
  await mini.mockWxMethod('request',function(options){
   if(!options.url||!options.url.includes('/api/v2/'))return this.origin(options)
   const state=getApp().globalData.ux,command=options.url.split('/api/v2/')[1]?.replace(/\//g,'.'),body=options.data||{};state.calls.push(command)
   let data={}
   if(command==='auth.login')data={token:'ux_fixture_session',user:state.user}
   else if(command==='me')data=state.user
   else if(command==='activities.list')data=[]
   else if(command==='grades.students.list')data=state.students
   else if(command==='grades.students.create'){if(!state.students.some(s=>s.id===body.student.id))state.students.push(body.student);data=body.student}
   else if(command==='grades.workspace.get')data=state.cloud[body.studentId]||{revision:0,values:{}}
   else if(command==='grades.workspace.save'){
    if(state.failSave)return {statusCode:503,data:{ok:false,error:'测试网络暂时不可用'}}
    const old=state.cloud[body.studentId]||{revision:0,values:{}};if(body.expectedRevision!==old.revision)data={...old,conflict:true}
    else{state.cloud[body.studentId]={revision:old.revision+1,values:body.values};data={revision:old.revision+1}}
   }else return {statusCode:400,data:{ok:false,error:'Unexpected mocked command'}}
   return {statusCode:200,data:{ok:true,data}}
  })
  console.log('Installed isolated test transport');
  let page=await mini.reLaunch('/pages/home/index');await page.waitFor(500);assert.equal((await page.$$('.entry-card')).length,2);assert.equal(await page.$('.intro'),null);assert.equal(await page.$('.foot'),null);assert.equal(await page.$('.demo-link'),null);const card=await page.$('.entry-card'),cardSize=await card.size(),window=await mini.systemInfo();assert.ok(Number(cardSize.width)>=window.windowWidth-50);await mini.screenshot({path:path.join(out,'home.png')});console.log('PASS home has exactly two product entries and no hero, demo or footer copy')
  await page.callMethod('coCreate');page=await current('pages/co-create/index');await page.waitFor(400);assert.equal(await page.data('screen'),'home');await page.callMethod('navigate',{currentTarget:{dataset:{screen:'create'}}});assert.equal(await page.data('screen'),'create');assert.equal((await mini.evaluate(()=>getApp().globalData.ux.calls)).length,0);console.log('PASS co-creation opens its actual activity/form without login or examples')
  await page.callMethod('hub');page=await current('pages/home/index');await page.callMethod('grades');page=await current('packages/grades/pages/record/index');await waitIdle(page);assert.equal(await page.$('grade-tabs'),null)
  await page.callMethod('onInput',{currentTarget:{dataset:{field:'examName'}},detail:{value:'简化流程验收'}});await page.callMethod('onInput',{currentTarget:{dataset:{field:'cityRank'}},detail:{value:'5000'}});await page.callMethod('refresh');await mini.screenshot({path:path.join(out,'record.png')})
  const layout=await mini.evaluate(()=>new Promise(resolve=>{const info=wx.getSystemInfoSync();wx.createSelectorQuery().select('.save-primary').boundingClientRect(r=>resolve({rect:r,width:info.windowWidth,height:info.screenHeight})).exec()}));assert.ok(layout.rect.width>=layout.width-55);assert.ok(layout.rect.top>=0&&layout.rect.bottom<=layout.height+1);console.log('PASS record opens directly with one visible full-width Save button, no competing bottom tabs')
  await (await page.$('.save-primary')).tap();page=await current('pages/login/index');assert.equal((await mini.evaluate(()=>getApp().globalData.ux.calls.filter(x=>x==='auth.login'))).length,0);await mini.screenshot({path:path.join(out,'login.png')})
  await page.callMethod('cancel');page=await current('packages/grades/pages/record/index');assert.equal((await page.data()).form.examName,'简化流程验收');assert.equal((await page.data()).form.cityRank,'5000');console.log('PASS Save requests login, while cancelling login retains every input')
  await (await page.$('.save-primary')).tap();page=await current('pages/login/index');await page.callMethod('consent',{detail:{value:['yes']}});await page.callMethod('login');page=await current('packages/grades/pages/dashboard/index');await page.waitFor(800);const result=await page.data();assert.equal(result.saved,true);assert.equal(result.examList.length,1);assert.ok(await page.$('.saved-confirmation'));await mini.screenshot({path:path.join(out,'saved.png')});console.log('PASS login resumes the submitted form, saves it to account and shows an explicit success result')
  await mini.reLaunch('/pages/co-create/index');page=await current('pages/co-create/index');await page.waitFor(800);assert.equal((await page.data()).user.id,fixtureId);const count=await mini.evaluate(()=>getApp().globalData.ux.calls.filter(x=>x==='auth.login').length);assert.equal(count,1);console.log('PASS both products reuse the one login session')
  assert.deepEqual(errors,[]);console.log('Native simplified UX checks passed; mocked transport only')
 }catch(e){console.log('Native exceptions:',JSON.stringify(errors));try{await mini.screenshot({path:path.join(out,'failure.png')})}catch{}throw e}
 finally{
  if(original)await mini.evaluate((saved,id)=>{const app=getApp();if(saved.token&&saved.user)app.setSession(saved.token,saved.user);else app.clearSession();if(saved.guest)wx.setStorageSync('hui.grades.students.guest',saved.guest);else wx.removeStorageSync('hui.grades.students.guest');if(saved.pending)wx.setStorageSync('hui.pendingGradeSave',saved.pending);else wx.removeStorageSync('hui.pendingGradeSave');for(const key of wx.getStorageInfoSync().keys)if(key.startsWith('hui.grades.user.'+id)||key.startsWith('hui.grades.students.user.'+id)||key.startsWith('hui.grades.guest.student.'+id))wx.removeStorageSync(key);delete app.globalData.ux},original,fixtureId)
  await mini.restoreWxMethod('request');await mini.restoreWxMethod('login');await mini.reLaunch('/pages/home/index');await mini.disconnect()
 }
}
main().catch(e=>{console.error(e);process.exitCode=1})
