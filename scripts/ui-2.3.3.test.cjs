require('./ui-2.3.2.test.cjs')
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),ts=require('../backend/node_modules/typescript')
const catalog=require('../miniprogram/assets/ui/icons/catalog'),root=path.resolve(__dirname,'../miniprogram')
for(const name of catalog.names)for(const tone of catalog.tones){const file=path.join(root,'assets/ui/icons',name+'-'+tone+'.svg'),svg=fs.readFileSync(file,'utf8');assert.match(svg,/viewBox="0 0 24 24"/);assert.match(svg,/stroke-width="1.65"/);assert.ok(!svg.includes('BACKGROUND'))}
let icon;vm.runInNewContext(fs.readFileSync(path.join(root,'components/ui-icon/index.js'),'utf8'),{require:()=>catalog,Component:c=>icon=c})
const iconCtx={data:{name:'book-filled',size:22,tone:'accent',color:''},setData(v){Object.assign(this.data,v)}}
icon.methods.refresh.call(iconCtx);assert.equal(iconCtx.data.src,'/assets/ui/icons/book-accent.svg');assert.equal(iconCtx.data.dimension,'22px')
iconCtx.data.name='/assets/ui/chevron-up.svg';icon.methods.refresh.call(iconCtx);assert.match(iconCtx.data.src,/chevron-up-accent.svg$/)
const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8')),seen=new Set()
function walk(base){if(seen.has(base)||base.includes('miniprogram_npm'))return;seen.add(base);const xml=fs.readFileSync(base+'.wxml','utf8');assert.ok(!xml.includes('<t-icon'),base);for(const n of xml.matchAll(/<ui-icon[^>]*name="([^"{]+)"/g)){const key=n[1].split('/').pop().replace(/\.svg$/,'');assert.ok(catalog.names.includes(catalog.aliases[key]||key),base+' missing '+key)}const cfg=JSON.parse(fs.readFileSync(base+'.json','utf8'));if(xml.includes('<ui-icon'))assert.ok(cfg.usingComponents['ui-icon']);for(const component of Object.values(cfg.usingComponents||{}))walk(component.startsWith('/')?path.join(root,component):path.resolve(path.dirname(base),component))}
for(const p of [...app.pages,...app.subPackages.flatMap(p=>p.pages.map(x=>p.root+'/'+x))])walk(path.join(root,p))
const xml=fs.readFileSync(path.join(root,'packages/grades/pages/record/index.wxml'),'utf8');assert.match(xml,/<grade-tabs/);assert.ok(!xml.includes('placeholder="输入"'));assert.match(xml,/wx:if="{{showSubjects}}"/)
let recordPage,currentScope='fixture',drafts=[]
const service={saveDraft:f=>drafts.push(structuredClone(f)),clearDraft(){}}
const source=ts.transpileModule(fs.readFileSync(path.join(root,'packages/grades/pages/record/index.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText
vm.runInNewContext(source,{exports:{},require(name){if(name.endsWith('/grades'))return {gradePage:p=>recordPage=p};if(name.endsWith('/auth'))return {};if(name.endsWith('/scope'))return {scopeKey:()=>currentScope,scopeTimeout:setTimeout};if(name.endsWith('/record.service'))return {recordService:service};if(name.endsWith('/record-form'))return {emptyForm:()=>({}),SUBJECT_PRESETS:[]};if(name.endsWith('/format'))return {today:()=> '2026-11-10'};return {}},setTimeout,clearTimeout})
recordPage.gradeScope='fixture';recordPage.data.form={examName:'未保存的考试',subjects:[{subject:'语文',score:'105'}]};recordPage.setData=function(v){Object.assign(this.data,v)}
assert.equal(recordPage.data.showSubjects,false);recordPage.onToggleSubjects();assert.equal(recordPage.data.showSubjects,true);recordPage.onToggleSubjects();assert.equal(recordPage.data.form.subjects[0].score,'105')
recordPage._draftDirty=true;recordPage.onHide();assert.equal(drafts.length,1);assert.equal(drafts[0].examName,'未保存的考试')
recordPage._draftDirty=true;currentScope='another-account';recordPage.onHide();assert.equal(drafts.length,1)
currentScope='fixture';recordPage._saveComplete=true;recordPage.onUnload();assert.equal(drafts.length,1)
console.log(`PASS ${catalog.names.length} vector icons in ${catalog.tones.length} tones; registered UI shares one icon family; optional scores collapse; tab exits flush drafts without crossing accounts or recreating saved drafts`)
