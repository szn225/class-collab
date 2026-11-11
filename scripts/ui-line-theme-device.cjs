// Local simulator fixtures only. Network is mocked; restore the user's session/storage in finally.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const automator=require('/private/tmp/hui-grades-verify/node_modules/miniprogram-automator')
const out=process.env.UI_OUTPUT?path.resolve(process.env.UI_OUTPUT):path.resolve(__dirname,'../docs/ui-redesign-2026-11-10/native'),fixture='line_ui_'+Date.now().toString(36)
async function main(){
 fs.mkdirSync(out,{recursive:true})
 const mini=await automator.connect({wsEndpoint:process.env.MINI_WS||'ws://127.0.0.1:9448'}),errors=[]
 mini.on('exception',e=>errors.push(e))
 let original
 async function shot(name){await new Promise(r=>setTimeout(r,300));await mini.screenshot({path:path.join(out,name+'.png')})}
 async function route(name){for(let i=0;i<80;i++){const p=await mini.currentPage();if(p?.path===name){await p.waitFor(300);return p}await new Promise(r=>setTimeout(r,100))}throw Error('Navigation timeout '+name)}
 try{
  original=await mini.evaluate(()=>({token:wx.getStorageSync('hui.session'),user:wx.getStorageSync('hui.user'),guest:wx.getStorageSync('hui.grades.students.guest'),pending:wx.getStorageSync('hui.pendingGradeSave')}))
  await mini.mockWxMethod('request',{statusCode:503,data:{ok:false,error:'Local UI fixture: offline'}})
  await mini.evaluate(id=>{getApp().clearSession();wx.setStorageSync('hui.grades.students.guest',{active:id,students:[{id,name:'界面验收'}]})},fixture)
  let p
  if(process.env.UI_ONLY!=='collab'){
  p=await mini.reLaunch('/pages/home/index');await p.waitFor(600)
  const cards=await p.$$('.entry-card');assert.equal(cards.length,2)
  for(const c of cards){const s=await c.size();assert.ok(s.height>=150&&s.height<=180,'Compact card height');assert.ok(s.width>=280)}
  await shot('01-home')
  await (await p.$('.signin-link')).tap();p=await route('pages/login/index');await shot('02-login')
  await mini.reLaunch('/pages/home/index');p=await route('pages/home/index');await (await p.$('.identity-entry')).tap();p=await route('pages/account/index');assert.equal(await p.data('releaseVersion'),'2.4.0');await shot('03-account')
  await mini.reLaunch('/pages/home/index');p=await route('pages/home/index');await (await p.$('.entry-card.grades')).tap();p=await route('packages/grades/pages/record/index')
  for(let i=0;i<70;i++){if((await p.data('groups'))?.length)break;await p.waitFor(100)}
  assert.equal(await p.data('showSubjects'),false);await shot('04-record')
  const subject=await p.$('.subject-toggle'),other=await p.$('.more-toggle');assert.equal((await subject.size()).height,(await other.size()).height,'Both optional rows have identical height')
  await (await p.$('.more-toggle')).tap();assert.equal(await p.data('showMore'),true);await shot('21-record-more');await (await p.$('.more-toggle')).tap()

  const tabs=await p.$('grade-tabs'),bar=await tabs.$('.tabbar'),save=await p.$('.save-primary')
  const so=await save.offset(),ss=await save.size(),bo=await bar.offset();assert.ok(so.top+ss.height<=bo.top+1,'Save must stay above tabbar')
  await (await p.$('.subject-toggle')).tap();assert.equal((await p.$$('.score-row')).length,7);await shot('05-record-subjects')
  await p.callMethod('onInput',{currentTarget:{dataset:{field:'examName'}},detail:{value:'界面验收考试'}})
  await p.callMethod('onInput',{currentTarget:{dataset:{field:'cityRank'}},detail:{value:'5000'}})
  await p.callMethod('onSubjectInput',{currentTarget:{dataset:{index:0,key:'score'}},detail:{value:'105'}})
  await (await p.$('.save-primary')).tap();p=await route('packages/grades/pages/dashboard/index');assert.equal(await p.data('saved'),true);await shot('06-dashboard')
  const exam= (await p.data('examList'))[0]
  await p.setData({examList:[{...exam,examName:'期中考试 2',rankText:'折算位次约 5,209',tierText:'四大新校区'},{...exam,id:exam.id+'-fixture2',examName:'期中考李俊熙',rankText:'折算位次约 28',tierText:'四大本部'},{...exam,id:exam.id+'-fixture3',examName:'期中 2',rankText:'折算位次约 1,172',tierText:'四大本部'}]})
  const infos=await p.$$('.exam-row-info');assert.equal(infos.length,3)
  for(const row of await p.$$('.exam-rows .row')){const meta=await row.$('.exam-meta'),tier=await row.$('.exam-tier');const mo=await meta.offset(),ms=await meta.size(),to=await tier.offset();assert.ok(to.top>=mo.top+ms.height,'Tier must always use its own row')}
  await mini.pageScrollTo(420);await shot('20-exam-list');await mini.pageScrollTo(0)

  await p.callMethod('onTapRecord',{currentTarget:{dataset:{id:(await p.data('examList'))[0].id}}});p=await route('packages/grades/pages/exam-detail/index');await p.waitFor(400);await shot('18-exam-detail');await mini.navigateBack();p=await route('packages/grades/pages/dashboard/index')
  await (await p.$('grade-tabs')).callMethod('onTap',{currentTarget:{dataset:{index:2}}});p=await route('packages/grades/pages/plan/index');await shot('07-plan')
  await (await p.$('grade-tabs')).callMethod('onTap',{currentTarget:{dataset:{index:3}}});p=await route('packages/grades/pages/reference/index');await p.waitFor(500);await shot('08-reference')
  p=await mini.reLaunch('/packages/grades/pages/profile/index');await p.waitFor(500);await shot('19-grade-settings')
  }
  p=await mini.reLaunch('/pages/co-create/index');await p.waitFor(500)
  const activity={id:'ui-local',name:'一起记录校园里的秋天',description:'活动素材与文章共创',status:'collecting',statusText:'收集中',memberCount:3,materialCount:4,roleText:'发起人',articleText:'草稿',manager:true,owner:true,writable:true,aiAuthorized:true,announcement:'分享活动照片，也记下你的发现。'}
  await p.setData({screen:'home',user:{name:'界面验收',balance:100,frozen:0},loading:false,error:'',activities:[activity]});await shot('09-activities')
  await p.callMethod('navigate',{currentTarget:{dataset:{screen:'create'}}});await shot('10-create')
  await p.setData({screen:'stream',title:'活动资料',activity,loading:false,error:'',materials:[{id:'m1',initial:'林',name:'林同学',time:'10:24',text:'今天和大家一起观察树叶，发现每一片都有不同的纹路。',own:false,images:[]},{id:'m2',initial:'陈',name:'陈老师',time:'10:32',text:'把各组的观察记录整理在一起，就有了一篇完整的活动文章。',own:false,images:[]}]});await shot('11-stream')
  await p.setData({screen:'article',title:'文章',article:{id:'ui-article',title:'走进秋天，在自然里一起成长',status:'draft',statusText:'草稿',revision:1,changed:true,body:'微风拂过树梢，大家一起走进校园，记录属于秋天的颜色。\n\n每一份小小的观察，都让共同的记录变得更加完整。',paragraphs:['微风拂过树梢，大家一起走进校园，记录属于秋天的颜色。','每一份小小的观察，都让共同的记录变得更加完整。'],images:[],usedIds:[],usedDetails:[],omitted:[]}});await shot('12-article')
  const dock=await p.$('.article-dock');const dockBefore=await dock.offset(),scrollBefore=Number(await p.scrollTop());await p.setData({'article.paragraphs':Array.from({length:12},(_,i)=>'第 '+(i+1)+' 段活动记录：每一份文字与图片都汇成了共同的文章，核对后再定稿。')});await mini.pageScrollTo(10000);await p.waitFor(250);const dockAfter=await dock.offset(),scrollAfter=Number(await p.scrollTop());await shot('22-article-bottom');assert.equal(await dock.style('position'),'fixed');assert.ok(Math.abs((dockAfter.top-scrollAfter)-(dockBefore.top-scrollBefore))<2,'Article toolbar must remain fixed while reading a long article');const panel=await p.$('.article-review-panel'),po=await panel.offset(),ps=await panel.size();assert.ok(po.top+ps.height<=dockAfter.top,'Review and visibility controls must scroll clear of dock');await shot('22-article-bottom')

  await mini.mockWxMethod('showActionSheet',{tapIndex:1});await (await p.$('.article-tools .link')).tap();await p.waitFor(200);assert.equal(await p.data('screen'),'used');await mini.restoreWxMethod('showActionSheet')
  await p.setData({screen:'materials',title:'选材',displayMaterials:[{id:'m1',name:'林同学',stateText:'自动选择',text:'今天的观察记录',images:[],checked:false}]});await shot('13-materials')
  await p.setData({screen:'settings',title:'活动管理'});await shot('14-settings')
  await p.setData({screen:'generate',title:'生成草稿'});await shot('15-generate')
  await p.setData({screen:'home',activities:[],loading:false,error:''});await shot('16-empty')
  await p.setData({error:'暂时无法连接，请稍后重试。'});await shot('17-error')
  assert.deepEqual(errors,[]);console.log(process.env.UI_ONLY==='collab'?'PASS native article fixed toolbar, long content clearance, More menu, material/settings/generation/empty/error states; zero runtime exceptions':'PASS native compact cards, login/account/tool navigation, optional subjects, save clearance, offline record save, dashboard, internal tabs, article More action; 22 screenshot states; zero runtime exceptions')
 }finally{
  try{if(original)await mini.evaluate((s,id)=>{if(s.token&&s.user)getApp().setSession(s.token,s.user);else getApp().clearSession();if(s.guest)wx.setStorageSync('hui.grades.students.guest',s.guest);else wx.removeStorageSync('hui.grades.students.guest');if(s.pending)wx.setStorageSync('hui.pendingGradeSave',s.pending);else wx.removeStorageSync('hui.pendingGradeSave');for(const key of wx.getStorageInfoSync().keys)if(key.includes('.guest.student.'+id))wx.removeStorageSync(key)},original,fixture)}finally{await mini.restoreWxMethod('request');await mini.reLaunch('/pages/home/index');await mini.disconnect()}
 }
}
main().catch(e=>{console.error(e);process.exitCode=1})
