const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test')
function setup(legacy=false){let config;const calls=[],pending=[]
 const api={requestId:()=> 'test_generation_option',call:async(command,data)=>{calls.push({command,data});if(command==='service.capabilities'){if(legacy){const e=new Error('操作不存在');e.status=404;throw e}return {aiLayout:true,bundledGeneration:true}};if(command==='task.quote')return new Promise(resolve=>pending.push(resolve));return {}}}
 vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../miniprogram/pages/co-create/index.js'),'utf8'),{require:name=>name.endsWith('/ai-article')?require('../miniprogram/utils/ai-article'):api,Page:p=>config=p,wx:{showToast(){},setNavigationBarTitle(){},pageScrollTo(){}},getApp:()=>({globalData:{}}),console,Date,Math,Promise,setTimeout:()=>1,clearTimeout(){}})
 const page={...config,data:JSON.parse(JSON.stringify(config.data)),stack:[],setData(data){Object.assign(this.data,data)}};page.data.activity={id:'a1',aiAuthorized:true,writable:true};return {page,calls,pending}
}
const settle=async()=>{for(let i=0;i<10;i++)await new Promise(r=>setImmediate(r))}
test('original generation screen adds a single optional checkbox and integer estimate before existing confirmation',async()=>{
 const {page,calls,pending}=setup();page.generate();assert.equal(page.data.screen,'generate');assert.equal(page.data.withLayout,false);assert.equal(calls[0].data.withLayout,false)
 pending.shift()({id:'simple',estimatedPoints:3.2,price:5});await settle();assert.equal(page.data.generationEstimate,4)
 page.toggleGenerationLayout({detail:{value:['layout']}});await settle();assert.equal(page.data.screen,'generate');assert.equal(calls.at(-1).data.withLayout,true)
 pending.shift()({id:'ai',withLayout:true,estimatedPoints:6.5,price:9});await settle();assert.equal(page.data.generationEstimate,7);assert.ok(!calls.some(c=>c.command==='task.start'))
 page.quote();await settle();pending.shift()({id:'confirmed',withLayout:true,estimatedPoints:7,price:9});await settle();assert.equal(page.data.screen,'quote');assert.equal(page.data.quote.id,'confirmed')
 const wxml=fs.readFileSync(path.resolve(__dirname,'../miniprogram/pages/co-create/index.wxml'),'utf8'),screen=wxml.split("screen === 'generate'")[1].split("screen === 'layout'")[0]
 assert.equal((screen.match(/bindchange="toggleGenerationLayout"/g)||[]).length,1);assert.ok(screen.includes('bindtap="quote"'));assert.ok(screen.includes('生成设置'))
})
test('late estimates cannot overwrite the newer checkbox choice',async()=>{
 const {page,pending}=setup();page.generate();page.toggleGenerationLayout({detail:{value:['layout']}});await settle()
 pending[1]({withLayout:true,estimatedPoints:7,price:9});await settle();pending[0]({estimatedPoints:4,price:5});await settle();assert.equal(page.data.generationEstimate,7)
})

test('old service is rejected before any layout quote or charge, with a clear version message',async()=>{
 const {page,calls,pending}=setup(true);page.generate();pending.shift()({price:5});await settle()
 page.toggleGenerationLayout({detail:{value:['layout']}});await settle();assert.match(page.data.estimateError,/服务尚未更新/)
 assert.equal(calls.filter(c=>c.command==='task.quote').length,1);assert.ok(!calls.some(c=>c.command==='task.start'))
 page.data.modeIndex=999;assert.equal(page.generationOptions().mode,'smart')
})
