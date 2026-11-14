// Read-only timing audit. Never prints tokens, keys, or article/grade payloads.
const fs=require('node:fs'),path=require('node:path'),{parseEnv}=require('node:util')
const base='https://gongchuang-test.chaohuiwan.com.cn',out=path.resolve(__dirname,'../docs/performance-2026-11-13')
const env=parseEnv(fs.readFileSync(path.resolve(__dirname,'../backend/.env.local'),'utf8')),session=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../backend/device-session.local'),'utf8'))
async function measure(label,url,options={}){
 const start=performance.now(),response=await fetch(url,{...options,signal:AbortSignal.timeout(30000)}),headersAt=performance.now(),text=await response.text(),end=performance.now();let data;try{data=JSON.parse(text)}catch{}
 const row={label,status:response.status,ttfbMs:Math.round(headersAt-start),totalMs:Math.round(end-start),bytes:Buffer.byteLength(text),vercelId:response.headers.get('x-vercel-id'),serverTiming:response.headers.get('server-timing'),sbRegion:response.headers.get('sb-region')};console.log(JSON.stringify(row));return {row,data}
}
const post=(command,data={})=>measure(command,base+'/api/v2/'+command.replaceAll('.','/'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.token},body:JSON.stringify(data)})
async function main(){const rows=[]
 for(let i=0;i<3;i++)rows.push((await measure('health-'+i,base+'/api/health')).row)
 for(let i=0;i<3;i++)rows.push((await post('me')).row)
 const activities=await post('activities.list');rows.push(activities.row)
 const a=activities.data?.data?.find(a=>a.materialCount>0)
 if(a){for(const command of ['activity.get','materials.list','article.get'])rows.push((await post(command,{activityId:a.id})).row)}
 rows.push((await post('grades.students.list')).row)
 for(let i=0;i<2;i++){
  const measured=await measure('direct-hui_read-'+i,env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/rpc/hui_read',{method:'POST',headers:{'Content-Type':'application/json',apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY},body:'{}'});rows.push(measured.row)
  if(i===0&&measured.data?.state){const s=measured.data.state;const summary={sections:Object.fromEntries(['users','sessions','activities','uploads','quotes','tasks','ledger','audit','cache','requests'].map(k=>[k,{count:s[k]?.length||0,bytes:Buffer.byteLength(JSON.stringify(s[k]||[]))}]))};console.log(JSON.stringify(summary));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'state-size.json'),JSON.stringify(summary,null,2))}
 }
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'latency.json'),JSON.stringify({at:new Date().toISOString(),location:'agent host probe, not mobile device',rows},null,2)+'\n')
}
main().catch(e=>{console.error(e.name,e.cause?.code||'');process.exitCode=1})
