// Creates only v2 initial state if empty; verifies private storage; never calls AI.
const fs=require('node:fs'),path=require('node:path'),{parseEnv}=require('node:util'),crypto=require('node:crypto'),assert=require('node:assert/strict')
const root=path.resolve(__dirname,'..'),env=parseEnv(fs.readFileSync(path.join(root,'backend/.env.local'),'utf8'));Object.assign(process.env,env)
const ts=require(path.join(root,'backend/node_modules/typescript'));require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f)
const {initialState}=require('../backend/src/lib/v2/model.ts'),{adminPassword}=require('../backend/src/lib/v2/identity.ts'),{uploadUrl,signedImage,verifyUpload,removeImages}=require('../backend/src/lib/v2/storage.ts')
const headers={'Content-Type':'application/json',apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY}
async function rpc(name,body){const r=await fetch(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/rpc/'+name,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});assert.ok(r.ok,'RPC request failed: '+r.status);return r.json()}
async function main(){
 let row=await rpc('hui_read',{});if(!row.state?.config){const s=initialState();Object.assign(s.config,JSON.parse(fs.readFileSync(path.join(root,'backend/config/launch-policy.json'),'utf8')));assert.equal(await rpc('hui_commit',{expected_revision:row.revision,next_state:s}),true);row=await rpc('hui_read',{})}
 assert.equal(row.state.config.gift,12);assert.equal(row.state.config.writing,5);assert.equal(row.state.config.dailyBudget,500);assert.equal(row.state.config.visionEnabled,false);assert.equal(row.state.config.enabled,false);console.log('PASS persisted v2 policy: gift 12, writing 5, daily budget 5 RMB, vision/AI disabled')
 const credentials=fs.readFileSync(path.join(root,'backend/admin-credentials.local'),'utf8'),password=credentials.match(/密码：(.*)/)[1];assert.equal(adminPassword('admin',password),true);assert.equal(adminPassword('admin',password+'wrong'),false);console.log('PASS configured admin password hash accepts generated password and rejects incorrect password')
 const anon={'Content-Type':'application/json',apikey:env.NEXT_PUBLIC_SUPABASE_ANON_KEY,Authorization:'Bearer '+env.NEXT_PUBLIC_SUPABASE_ANON_KEY};const forbidden=await fetch(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/rpc/hui_read',{method:'POST',headers:anon,body:'{}',signal:AbortSignal.timeout(15000)});assert.equal(forbidden.ok,false);console.log('PASS anonymous key cannot execute private v2 state RPC')
 const object='checks/'+crypto.randomUUID()+'.png',bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC3sAAAAASUVORK5CYII=','base64')
 try{
  const signed=await uploadUrl(object);const put=await fetch(signed,{method:'PUT',headers:{'Content-Type':'image/png'},body:bytes,signal:AbortSignal.timeout(15000)});assert.ok(put.ok,'Signed upload failed: '+put.status);await verifyUpload(object,bytes.length,'image/png');const download=await signedImage(object,60);const image=await fetch(download,{signal:AbortSignal.timeout(15000)});assert.ok(image.ok);assert.equal((await image.arrayBuffer()).byteLength,bytes.length);console.log('PASS private image signed upload, size/type verification and signed download')
  const raw=await fetch(env.NEXT_PUBLIC_SUPABASE_URL+'/storage/v1/object/public/hui-materials/'+object,{signal:AbortSignal.timeout(15000)});assert.equal(raw.ok,false);console.log('PASS unsigned public URL cannot download private image')
 }finally{await removeImages([object]);console.log('PASS temporary verification image removed')}
 console.log('Live preparation checks passed; no legacy access changes, no AI calls')
}
main().catch(e=>{console.error('Live check failed:',e instanceof assert.AssertionError?e.message:e.name);process.exitCode=1})
