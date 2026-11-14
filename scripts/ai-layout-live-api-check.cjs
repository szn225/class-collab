// Authorized service verification: reads and quotes only. Never starts paid tasks.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const base='https://gongchuang-test.chaohuiwan.com.cn'
async function main(){
 const session=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../backend/device-session.local'),'utf8'))
 const request=async(command,data={})=>{const response=await fetch(base+'/api/v2/'+command.replaceAll('.','/'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.token},body:JSON.stringify({requestId:'verify_layout_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2),...data}),signal:AbortSignal.timeout(25000)});return {status:response.status,...await response.json()}}
 const health=await(await fetch(base+'/api/health',{signal:AbortSignal.timeout(25000)})).json();assert.equal(health.build,'2.5.2');assert.equal(health.database,'connected');console.log('PASS service serves AI layout build 2.5.2 with database connected')
 const me=await request('me');assert.equal(me.status,200);console.log('PASS previous WeChat session remains valid')
 const capabilities=await request('service.capabilities');assert.equal(capabilities.status,200);assert.equal(capabilities.data.aiLayout,true);console.log('PASS AI layout capability endpoint')
 const activities=await request('activities.list');assert.equal(activities.status,200)
 let quotes=0,layoutQuote=false
 for(const a of activities.data.filter(a=>a.aiAuthorized&&a.status!=='archived'&&a.materialCount>0).slice(0,1)){
  const legacy=await request('task.quote',{activityId:a.id,mode:'smart'});assert.equal(legacy.status,200)
  const modern=await request('task.quote',{activityId:a.id,mode:'smart',billingVersion:1,withLayout:true});assert.equal(modern.status,200);assert.equal(modern.data.withLayout,true);assert.ok(Number.isInteger(modern.data.price));assert.ok(Number.isInteger(modern.data.estimatedPoints));quotes+=2
  const article=await request('article.get',{activityId:a.id})
  if(article.status===200&&article.data){const quote=await request('task.quote',{activityId:a.id,kind:'layout',articleId:article.data.id,mode:'smart'});assert.equal(quote.status,200);assert.equal(quote.data.kind,'layout');layoutQuote=true;quotes++}
 }
 const after=await request('me');assert.equal(after.data.balance,me.data.balance);assert.equal(after.data.frozen,me.data.frozen)
 console.log(JSON.stringify({existingSession:true,quoteChecks:quotes,standaloneLayoutQuote:layoutQuote,balancesUnchanged:true,paidCalls:0}))
}
main().catch(e=>{console.error('Verification failed: '+e.name+(e.status?' HTTP '+e.status:''));process.exitCode=1})
