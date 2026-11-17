const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test')
function setup(legacy=false){let config;const calls=[],pending=[]
 const api={requestId:()=> 'test_generation_option',call:async(command,data)=>{calls.push({command,data});if(command==='service.capabilities'){if(legacy){const e=new Error('操作不存在');e.status=404;throw e}return {aiLayout:true,bundledGeneration:true}};if(command==='task.quote')return new Promise(resolve=>pending.push(value=>resolve({selectedMaterialIds:data.materialIds,balance:100,expires:Date.now()+300000,...value})));if(command==='task.start')return {id:'task1',activityId:data.activityId,stage:'queued'};return {}}}
 vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../miniprogram/pages/co-create/index.js'),'utf8'),{require:name=>name.endsWith('/ai-article')?require('../miniprogram/utils/ai-article'):api,Page:p=>config=p,wx:{setStorageSync(){},showToast(){},setNavigationBarTitle(){},pageScrollTo(){}},getApp:()=>({globalData:{}}),console,Date,Math,Promise,setTimeout:()=>1,clearTimeout(){}})
 const page={...config,data:JSON.parse(JSON.stringify(config.data)),stack:[],setData(data){Object.assign(this.data,data)}};page.data.activity={id:'a1',aiAuthorized:true,writable:true};page.data.checked=['m1'];return {page,calls,pending}
}
const settle=async()=>{for(let i=0;i<10;i++)await new Promise(r=>setImmediate(r))}
test('original generation screen adds a single optional checkbox and integer estimate before existing confirmation',async()=>{
 const {page,calls,pending}=setup();page.generate();assert.equal(page.data.screen,'generate');assert.equal(page.data.withLayout,false);assert.equal(calls[0].data.withLayout,false)
 pending.shift()({id:'simple',estimatedPoints:3.2,layoutExtraPoints:3,price:5});await settle();assert.equal(page.data.generationEstimate,4);assert.equal(page.data.layoutExtraPoints,3)
 page.toggleGenerationLayout({detail:{value:['layout']}});await settle();assert.equal(page.data.screen,'generate');assert.equal(calls.at(-1).data.withLayout,true)
 pending.shift()({id:'ai',withLayout:true,estimatedPoints:6.5,price:9});await settle();assert.equal(page.data.generationEstimate,7);assert.ok(!calls.some(c=>c.command==='task.start'))
 page.confirmGeneration();page.confirmGeneration();await settle();assert.equal(page.data.screen,'task');assert.equal(page.data.quote.id,'ai');assert.equal(calls.filter(c=>c.command==='task.start').length,1);assert.equal(calls.find(c=>c.command==='task.start').data.quoteId,'ai')
 const wxml=fs.readFileSync(path.resolve(__dirname,'../miniprogram/pages/co-create/index.wxml'),'utf8'),screen=wxml.split("screen === 'generate'")[1].split("screen === 'layout'")[0]
 assert.equal((screen.match(/bindchange="toggleGenerationLayout"/g)||[]).length,1);assert.ok(screen.includes('bindtap="confirmGeneration"'));assert.ok(screen.includes('生成设置'))
})
test('late estimates cannot overwrite the newer checkbox choice',async()=>{
 const {page,pending}=setup();page.generate();page.toggleGenerationLayout({detail:{value:['layout']}});await settle()
 pending[1]({withLayout:true,estimatedPoints:7,price:9});await settle();pending[0]({estimatedPoints:4,price:5});await settle();assert.equal(page.data.generationEstimate,7)
})

test('old service is rejected before any layout quote or charge, with a clear version message',async()=>{
 const {page,calls,pending}=setup(true);page.generate();pending.shift()({price:5});await settle()
 page.toggleGenerationLayout({detail:{value:['layout']}});await settle();assert.match(page.data.estimateError,/服务尚未更新/)
 assert.equal(calls.filter(c=>c.command==='task.quote').length,1);assert.ok(!calls.some(c=>c.command==='task.start'))
 page.data.modeIndex=999;assert.equal(page.generationOptions().mode,'specified');assert.deepEqual(Array.from(page.generationOptions().materialIds),['m1'])
})

test('single choice, all choices and grouped cards share one selection; empty choice cannot generate',()=>{
 const {page,calls}=setup();page.data.materials=[{id:'m1',userId:'u1',name:'甲',images:[]},{id:'m2',userId:'u1',name:'甲',images:[]},{id:'m3',userId:'u2',name:'乙',images:[],withdrawn:true}];page.data.checked=[];page.applyMaterialFilter();assert.equal(page.data.materialGroups.length,1);assert.equal(page.data.materialGroups[0].items.length,2);page.generate();assert.equal(calls.length,0);
 page.checkMaterial({currentTarget:{dataset:{id:'m1'}}});assert.deepEqual(Array.from(page.data.checked),['m1']);assert.equal(page.data.materialGroups[0].items[0].checked,true);page.selectAllMaterials();assert.deepEqual(Array.from(page.data.checked),['m1','m2']);assert.equal(page.data.allMaterialsSelected,true);page.selectAllMaterials();assert.equal(page.data.checked.length,0);
 page.data.checked=['m1','m3'];page.applyMaterialFilter();assert.deepEqual(Array.from(page.data.checked),['m1']);
})

test('expired or changed quote refreshes on current page without starting a paid task',async()=>{
 const {page,calls,pending}=setup();page.generate();pending.shift()({id:'old',price:5,expires:Date.now()-1});await settle();page.confirmGeneration();assert.equal(page.data.screen,'generate');assert.equal(calls.filter(c=>c.command==='task.start').length,0);pending.shift()({id:'new',price:6});await settle();page.data.focus='changed';page.confirmGeneration();assert.equal(calls.filter(c=>c.command==='task.start').length,0)
})
