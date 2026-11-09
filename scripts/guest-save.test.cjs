const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict')
const ts=require('../backend/node_modules/typescript')
let page,logged=false,enabled=false,saves=0,syncs=0,navigations=[],record=null,failSave=false
const grades={gradePage:p=>page=p,status:()=>({enabled}),sync:async()=>{syncs++;throw Error('offline')}}
const auth={isLoggedIn:()=>logged,beginGradeSave:(form,dataset)=>({id:'stable-id',form,dataset}),claimGradeSave(){},finishGradeSave(){}}
const service={get:async()=>record,save:async()=>{if(failSave)throw Error('storage full');saves++;return record={id:'stable-id'}},clearDraft(){}}
const source=ts.transpileModule(fs.readFileSync(require.resolve('../miniprogram/packages/grades/pages/record/index.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText
vm.runInNewContext(source,{exports:{},require(name){
 if(name.endsWith('/grades'))return grades
 if(name.endsWith('/auth'))return auth
 if(name.endsWith('/scope'))return {scopeKey:()=> 'scope',guardAwait:async p=>p}
 if(name.endsWith('/record.service'))return {recordService:service}
 if(name.endsWith('/record-form'))return {emptyForm:()=>({}),validateForm:()=>({ok:true,errorMap:{}}),SUBJECT_PRESETS:[]}
 if(name.endsWith('/format'))return {today:()=> '2026-11-09'}
 if(name.endsWith('/track'))return {trackEvent(){}}
 return {}
},wx:{redirectTo:r=>navigations.push(r.url),navigateTo(){throw Error('Unexpected login redirect')}},setTimeout,clearTimeout})
page.setData=function(v){Object.assign(this.data,v)}
page._dataset={};page.data.form={examName:'guest exam'}
;(async()=>{
 await page.onSave();assert.equal(saves,1);assert.equal(syncs,0);assert.equal(navigations.length,1)
 await page.onSave();assert.equal(saves,1)
 logged=true;enabled=true;await page.onSave();assert.equal(syncs,1);assert.equal(navigations.length,3)
 record=null;failSave=true;await page.onSave();assert.match(page.data.saveError,/storage full/);assert.equal(navigations.length,3)
 console.log('PASS guest saves without login or cloud; retries reuse record ID; offline sync retains local success; storage failure stays on form')
})().catch(e=>{console.error(e);process.exitCode=1})
