// Native smoke test with static mocked reads. Timing/race checks live in page-performance.test.cjs.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const automator=require('/private/tmp/hui-layout-verify/node_modules/miniprogram-automator')
const out=path.resolve(__dirname,'../docs/device-test/release-2.5.3')
async function main(){
 const mini=await automator.connect({wsEndpoint:'ws://127.0.0.1:9446'}),errors=[];mini.on('exception',e=>errors.push(e))
 try{
  await mini.mockWxMethod('request',{statusCode:503,data:{ok:false,error:'隔离界面验收'}})
  const p=await mini.reLaunch('/pages/co-create/index');await p.waitFor(500)
  const fixture={id:'fixture',name:'加载测试活动',role:'owner',status:'collecting',revision:1,memberCount:1,materialCount:0,aiAuthorized:true,items:[],hasMore:false,title:'测试文章',body:'测试正文',images:[]}
  await p.setData({user:{id:'fixture-user',name:'测试用户'},loading:false,busy:false,error:''})
  await p.callMethod('setActivity',fixture)
  await mini.mockWxMethod('request',{statusCode:200,data:{ok:true,data:fixture}})
  await p.callMethod('loadStream');assert.equal(await p.data('screen'),'stream');assert.equal(await p.data('loading'),false);assert.equal((await p.data('materials')).length,0)
  await mini.screenshot({path:path.join(out,'stream.png')})
  await p.callMethod('loadArticle');assert.equal(await p.data('screen'),'article');assert.equal(await p.data('article.id'),'fixture');assert.equal(await p.data('loading'),false)
  await mini.screenshot({path:path.join(out,'article.png')})
  await p.callMethod('settings');assert.equal(await p.data('screen'),'settings');assert.equal(await p.data('loading'),false);assert.equal(await p.data('busy'),false)
  await mini.screenshot({path:path.join(out,'settings.png')});assert.deepEqual(errors,[])
  fs.writeFileSync(path.join(out,'simulator-check.json'),JSON.stringify({transport:'static mocked response; no native latency measurement',stream:true,article:true,settings:true,exceptions:errors},null,2)+'\n')
  console.log('PASS native stream/article/settings render and finish loading; static isolated mock transport')
 }finally{await mini.restoreWxMethod('request');await mini.reLaunch('/pages/home/index');await mini.disconnect()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
