// Additional 2.3 UI checks. Isolated guest student and in-memory activity fixtures; no API writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const automator=require('/private/tmp/hui-grades-verify/node_modules/miniprogram-automator')
const out=path.resolve(__dirname,'../docs/device-test/release-2.3.0')
async function main(){
 const mini=await automator.connect({wsEndpoint:'ws://127.0.0.1:9432'}),id='ui23_'+Date.now().toString(36),errors=[];let saved
 mini.on('exception',e=>errors.push(e));
 try{
  const ready=await mini.reLaunch('/pages/home/index');await ready.waitFor(1800);
  saved=await mini.evaluate(()=>({token:wx.getStorageSync('hui.session'),user:wx.getStorageSync('hui.user'),guest:wx.getStorageSync('hui.grades.students.guest')}))
  await mini.evaluate(id=>{getApp().clearSession();wx.setStorageSync('hui.grades.students.guest',{active:id,students:[{id,name:'UI验收'}]})},id)
  await mini.mockWxMethod('request',{statusCode:503,data:{ok:false,error:'隔离 UI 验收不访问服务端'}})
  let page=await mini.reLaunch('/packages/grades/pages/record/index');await page.waitFor(1800)
  assert.deepEqual(await page.data('errors'),{});assert.equal(await page.data('showMore'),false)
  for(const [index,scope,selector] of [[1,'group','input[data-field="groupRank"]'],[2,'school','input[data-field="schoolSize"]'],[0,'city','input[data-field="cityRank"]']]){
   await page.callMethod('onScopeChange',{detail:{value:index}});await page.waitFor(400)
   assert.equal(await page.data('form.scope'),scope);assert.equal(await page.data('scopeIndex'),index);assert.ok(await page.$(selector));assert.deepEqual(await page.data('errors'),{})
   await mini.screenshot({path:path.join(out,'record-'+scope+'.png')})
  }
  await page.callMethod('onSave');assert.ok(Object.keys(await page.data('errors')).length);assert.equal((await mini.currentPage()).path,'packages/grades/pages/record/index')
  await page.callMethod('onToggleMore');assert.ok(await page.$('.extra-fields'));await page.callMethod('onToggleMore');assert.equal(await page.$('.extra-fields'),null)
  console.log('PASS city/group/school picker fields; untouched form has no premature errors; Save validates; optional fields collapse')
  page=await mini.reLaunch('/packages/grades/pages/reference/index');await page.waitFor(1800)
  assert.equal(await page.data('showFilters'),false);assert.equal(await page.$('.sort-row'),null)
  await page.callMethod('onToggleFilters');assert.ok(await page.$('.sort-row'));await mini.screenshot({path:path.join(out,'reference-filters.png')});await page.callMethod('onToggleFilters')
  for(const segment of ['indicator','rules']){await page.callMethod('onPickSegment',{currentTarget:{dataset:{value:segment}}});await page.waitFor(500);assert.equal(await page.data('segment'),segment);await mini.screenshot({path:path.join(out,'reference-'+segment+'.png')})}
  console.log('PASS school filtering is disclosed on demand; indicator and rules sections render')
  page=await mini.reLaunch('/pages/co-create/index');await page.waitFor(500)
  const fixture={id:'render_only',name:'UI验收活动',status:'collecting',statusText:'收集中',role:'owner',roleText:'发起人',manager:true,owner:true,writable:true,memberCount:2,announcement:'活动资料收集中'}
  await page.setData({activity:fixture,user:{id,name:'验收用户'},materials:[{id:'m1',name:'成员 A',initial:'A',own:false,time:'10:24',text:'接力赛最后一棒完成交接。',images:[]}],article:{id:'a1',title:'校园运动会',body:'活动文章正文',paragraphs:['同学们完成了接力比赛。'],images:[],imageUrls:[],status:'final',statusText:'已定稿',revision:1},quote:{price:5,balance:12,texts:1,images:0,visionEnabled:false},task:{stage:'succeeded',stageText:'已完成',progress:100,price:5}})
  for(const screen of ['stream','materials','generate','quote','article','share','settings','members']){await page.callMethod('to',screen);await page.waitFor(250);await mini.screenshot({path:path.join(out,'collab-'+screen+'.png')})}
  await page.setData({activity:{...fixture,role:'participant',roleText:'参与者',manager:false,owner:false}});await page.callMethod('to','stream');await page.waitFor(200)
  assert.equal((await page.$$('.activity-tabs button')).length,2)
  await mini.screenshot({path:path.join(out,'collab-participant.png')})
  console.log('PASS co-create native layouts render; participant has only materials feed and article tabs (fixtures, no AI task submitted)')
  assert.deepEqual(errors,[]);console.log('Native UI 2.3.0 supplemental checks passed')
 }finally{
  if(saved)await mini.evaluate((s,id)=>{if(s.token&&s.user)getApp().setSession(s.token,s.user);else getApp().clearSession();if(s.guest)wx.setStorageSync('hui.grades.students.guest',s.guest);else wx.removeStorageSync('hui.grades.students.guest');for(const key of wx.getStorageInfoSync().keys)if(key.includes('.guest.student.'+id))wx.removeStorageSync(key)},saved,id)
  await mini.restoreWxMethod('request');await mini.reLaunch('/pages/home/index');await mini.disconnect()
 }
}
main().catch(e=>{console.error(e);process.exitCode=1})
