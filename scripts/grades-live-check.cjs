// Read-only checks against the existing backend/database. Never prints credentials or private payloads.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{parseEnv}=require('node:util'),{spawnSync}=require('node:child_process')
const root=path.resolve(__dirname,'..'),env=parseEnv(fs.readFileSync(path.join(root,'backend/.env.local'),'utf8'))
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1]},deployment=arg('--deployment'),base=arg('--base')
async function rpc(key){assert.equal(new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname,'wvmebfesylhvgyyibysj.supabase.co');return fetch(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/rpc/hui_grades',{method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+key},body:JSON.stringify({actor:'00000000-0000-0000-0000-000000000000',action:'students.list'}),signal:AbortSignal.timeout(20000)})}
async function request(route,token,body){
 if(!deployment){const r=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(25000)});return {status:r.status,body:await r.json()}}
 const file=path.join(os.tmpdir(),'hui-grades-curl-'+crypto.randomUUID()+'.local');
 try{const lines=['silent','show-error','max-time = 25','header = "Content-Type: application/json"'];if(token)lines.push('header = '+JSON.stringify('Authorization: Bearer '+token));if(body!==undefined)lines.push('request = "POST"','data = '+JSON.stringify(JSON.stringify(body)));fs.writeFileSync(file,lines.join('\n'),{mode:0o600});const result=spawnSync('vercel',['curl',route,'--deployment',deployment,'--scope','anns-projects-14c3a4b1','--','--config',file,'--write-out','\n%{http_code}'],{cwd:'/private/tmp/hui-v2-release',encoding:'utf8',timeout:45000,maxBuffer:1000000});if(result.status!==0)throw new Error('Deployment verification transport failed (exit '+result.status+')');const output=result.stdout.trim(),index=output.lastIndexOf('\n');return {status:Number(output.slice(index+1)),body:JSON.parse(output.slice(0,index))}}finally{if(fs.existsSync(file))fs.unlinkSync(file)}
}
async function main(){
 if(!deployment&&!base){const service=await rpc(env.SUPABASE_SERVICE_ROLE_KEY);assert.equal(service.status,200);assert.deepEqual(await service.json(),[]);console.log('PASS production grade RPC is callable by the service role (read-only)');const anon=await rpc(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);assert.ok([401,403].includes(anon.status));console.log('PASS production grade RPC rejects the anonymous key');return}
 if(base)assert.equal(new URL(base).hostname,'gongchuang-test.chaohuiwan.com.cn');
 const session=JSON.parse(fs.readFileSync(path.join(root,'backend/device-session.local'),'utf8'))
 const health=await request('/api/health');assert.equal(health.status,200);assert.equal(health.body.version,2);assert.equal(health.body.database,'connected');console.log('PASS deployed v2 health and original database connection')
 const me=await request('/api/v2/me',session.token,{});assert.equal(me.status,200);assert.equal(me.body.data.id,session.userId);console.log('PASS existing WeChat account session remains valid')
 const grades=await request('/api/v2/grades/students/list',session.token,{});assert.equal(grades.status,200);assert.equal(grades.body.ok,true);assert.ok(Array.isArray(grades.body.data));console.log('PASS deployed grades endpoint authenticates and reads the migrated database')
 const guest=await request('/api/v2/grades/students/list',null,{});assert.equal(guest.status,401);console.log('PASS anonymous grades access is rejected')
 const absent=await request('/api/v2/grades/workspace/get',session.token,{studentId:'verification_nonexistent_student'});assert.equal(absent.status,404);console.log('PASS nonexistent/unowned student workspace is inaccessible')
 const invalid=await request('/api/v2/grades/workspace/save',session.token,{studentId:'verification_nonexistent_student',expectedRevision:-1,operationId:'read_only_validation',values:{}});assert.equal(invalid.status,400);console.log('PASS invalid save is rejected before a database write')
 console.log('Live checks passed; no accounts, students, grades or activities were created or changed')
}
main().catch(e=>{console.error('Live verification failed:',e instanceof assert.AssertionError?e.message:e.name==='Error'?e.message:e.name,e.cause?.code||'');process.exitCode=1})
