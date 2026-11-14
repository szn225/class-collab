// Authorized deployment verification: existing session, reads only, no quotes or paid calls.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const root=path.resolve(__dirname,'..'),session=JSON.parse(fs.readFileSync(path.join(root,'backend/device-session.local'),'utf8')),baselineFile=path.join(root,'backend/profile-before.local')
const before=process.argv.includes('--before'),rows=[]
async function get(base,command,data){
 const start=performance.now(),response=await fetch(base+(command==='health'?'/api/health':'/api/v2/'+command.replaceAll('.','/')),{...(command==='health'?{}:{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.token},body:JSON.stringify(data||{})}),signal:AbortSignal.timeout(25000)})
 const result=await response.json(),row={host:new URL(base).hostname,command,status:response.status,totalMs:Math.round(performance.now()-start),serverTiming:response.headers.get('server-timing'),vercelId:response.headers.get('x-vercel-id')};rows.push(row);console.log(JSON.stringify(row));assert.equal(response.status,200);return command==='health'?result:result.data
}
async function main(){
 const base='https://gongchuang-test.chaohuiwan.com.cn',me=await get(base,'me')
 if(before){fs.writeFileSync(baselineFile,JSON.stringify({id:me.id,name:me.name,balance:me.balance,frozen:me.frozen}),{mode:0o600});return}
 const baseline=JSON.parse(fs.readFileSync(baselineFile,'utf8'));assert.equal(me.id,baseline.id);assert.equal(me.name,baseline.name);assert.equal(me.balance,baseline.balance);assert.equal(me.frozen,baseline.frozen)
 for(const domain of [base,'https://gongchuang.chaohuiwan.com.cn']){const health=await get(domain,'health');assert.equal(health.build,'2.5.5');assert.equal(health.database,'connected')}
 const features=await get(base,'service.capabilities');assert.equal(features.aiLayout,true);assert.equal(features.bundledGeneration,true);assert.equal(features.profileAvatar,true)
 const activities=await get(base,'activities.list');assert.ok(Array.isArray(activities));const a=activities.find(a=>a.materialCount>0)||activities[0]
 if(a){await get(base,'activity.get',{activityId:a.id});const materials=await get(base,'materials.list',{activityId:a.id});assert.ok(Array.isArray(materials.items));await get(base,'article.get',{activityId:a.id})}
 await get(base,'grades.students.list')
 const after=await get(base,'me');assert.equal(after.balance,baseline.balance);assert.equal(after.frozen,baseline.frozen)
 fs.writeFileSync(path.join(root,'docs/device-test/release-2.5.5/service-verification.json'),JSON.stringify({at:new Date().toISOString(),existingSession:true,existingNameUnchanged:true,profileAvatar:true,balancesUnchanged:true,paidCalls:0,rows},null,2)+'\n')
 console.log('PASS both domains, old session/name, avatar capability, AI compatibility, activity/material/article and grades reads; balances unchanged; no profile writes or paid calls')
}
main().catch(e=>{console.error('Verification failed',e.name,e.code||e.cause?.code||'');process.exitCode=1})
