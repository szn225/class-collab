const fs=require('node:fs'),path=require('node:path'),{test}=require('node:test'),assert=require('node:assert/strict'),ts=require('../backend/node_modules/typescript')
const file=path.resolve(__dirname,'../backend/src/lib/v2/timing.ts'),Module=require('node:module'),m=new Module(file,module);m.filename=file;m.paths=module.paths;m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,file)
const {measure,timedResponse}=m.exports
const defer=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
test('request timings stay separate under concurrent requests and survive handled failures',async()=>{
 const a=defer(),b=defer()
 const first=timedResponse(async()=>{await measure('database',()=>a.promise);return new Response('one')})
 const second=timedResponse(async()=>{try{await measure('grades',async()=>{await b.promise;throw Error('fixture')})}catch{}return new Response('two')})
 b.resolve();a.resolve();const [one,two]=await Promise.all([first,second]);assert.match(one.headers.get('server-timing'),/database;dur=[\d.]+, app;dur=/);assert.ok(!one.headers.get('server-timing').includes('grades'));assert.match(two.headers.get('server-timing'),/grades;dur=[\d.]+, app;dur=/);assert.ok(!two.headers.get('server-timing').includes('database'))
 assert.equal(await measure('outside',async()=>42),42)
})
