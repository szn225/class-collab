// Native smoke test with static mocked reads. Timing/race checks live in page-performance.test.cjs.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const automator=require('/private/tmp/hui-layout-verify/node_modules/miniprogram-automator')
const out=path.resolve(__dirname,'../docs/device-test/release-2.5.4')
async function main(){
 const mini=await automator.connect({wsEndpoint:'ws://127.0.0.1:9447'}),errors=[];mini.on('exception',e=>errors.push(e))
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
  const refreshFlags=await mini.evaluate(()=>{const p=getCurrentPages().slice(-1)[0];p.loadArticle(false);return {loading:p.data.loading,refreshing:p.data.refreshing,hasArticle:!!p.data.article}});assert.equal(refreshFlags.loading,false);assert.equal(refreshFlags.refreshing,true);assert.equal(refreshFlags.hasArticle,true);await p.waitFor(300);assert.equal(await p.data('refreshing'),false);assert.equal(await p.$('.loading'),null);
  await mini.screenshot({path:path.join(out,'article.png')})
  await p.callMethod('settings');assert.equal(await p.data('screen'),'settings');assert.equal(await p.data('loading'),false);assert.equal(await p.data('busy'),false)
  await mini.screenshot({path:path.join(out,'settings.png')});assert.deepEqual(errors,[])
  fs.writeFileSync(path.join(out,'simulator-check.json'),JSON.stringify({transport:'static mocked response; no native latency measurement',stream:true,article:true,settings:true,noBannerWithExistingArticle:true,refreshSettles:true,exceptions:errors},null,2)+'\n')
  console.log('PASS native article background refresh has no loading banner; stream/article/settings render and settle; static isolated mock transport')
 }finally{await mini.restoreWxMethod('request');await mini.reLaunch('/pages/home/index');await mini.disconnect()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
