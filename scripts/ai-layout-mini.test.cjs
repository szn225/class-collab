const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test')
const renderer=require('../miniprogram/utils/ai-article')
test('mini program confirms a separate layout quote before charging and renders saved AI HTML',async()=>{
 let config,calls=[]
 const article={id:'article-original',title:'故事',body:'正文',revision:1,status:'draft',images:[],layout:{bodyOnly:true,html:'<section style="color:#974a21"><p>正文</p></section>',summary:'依文章设计'}}
 const api={requestId:()=> 'layout_confirm_request',call:async(command,data)=>{calls.push({command,data});if(command==='service.capabilities')return {aiLayout:true,bundledGeneration:true};if(command==='task.quote')return {id:'layout-quote',kind:'layout',price:12,estimatedPoints:4,billingMode:'usage'};if(command==='task.start')return {id:'task-1',kind:'layout',stage:'queued'};if(command==='article.get')return article;return {}}}
 const wx={showToast(){},showModal(){},setNavigationBarTitle(){},setStorageSync(){},pageScrollTo(){}}
 vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../miniprogram/pages/co-create/index.js'),'utf8'),{require:name=>name.endsWith('/ai-article')?renderer:api,Page:c=>config=c,wx,getApp:()=>({globalData:{}}),console,Date,Math,Promise,setTimeout:()=>1,clearTimeout(){}})
 const page={...config,data:JSON.parse(JSON.stringify(config.data)),stack:[],visiblePage:true,setData(data){for(const [key,value] of Object.entries(data)){const keys=key.split('.');let target=this.data;while(keys.length>1)target=target[keys.shift()];target[keys[0]]=value}}}
 const settled=async()=>{for(let i=0;i<20;i++)await new Promise(r=>setImmediate(r));assert.equal(page.data.busy,false)}
 page.data.activity={id:'activity',writable:true,aiAuthorized:true,manager:true};page.data.article=article;page.data.screen='article'
 page.layoutArticle();assert.equal(page.data.screen,'layout');assert.equal(calls.length,0)
 page.data.layoutFocus='留白多一些';page.quoteLayout();await settled();assert.equal(page.data.screen,'quote');const quoteCall=calls.find(x=>x.command==='task.quote');assert.equal(quoteCall.data.kind,'layout');assert.equal(quoteCall.data.articleId,article.id);assert.equal(quoteCall.data.focus,'留白多一些');assert.ok(!calls.some(x=>x.command==='task.start'))
 page.startTask();await settled();assert.ok(calls.some(x=>x.command==='task.start'&&x.data.quoteId==='layout-quote'));assert.equal(page.data.task.kind,'layout')
 await page.loadArticle(false);assert.equal(page.data.article.displayHtml,article.layout.html);assert.equal(page.data.reviewed,false)
 page.data.activity.aiAuthorized=false;const before=calls.length;page.layoutArticle();assert.equal(calls.length,before)
 const wxml=fs.readFileSync(path.resolve(__dirname,'../miniprogram/pages/co-create/index.wxml'),'utf8');assert.ok(!wxml.includes('articleThemes'));assert.ok(wxml.includes('bindtap="quoteLayout"'))
})
