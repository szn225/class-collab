// node --env-file=backend/.env.local scripts/v2-worker.mjs
// A persistent local worker or externally scheduled request can resume queued jobs.
const base=process.env.HUI_WORKER_URL||'http://127.0.0.1:3000'
if(!process.env.CRON_SECRET)throw new Error('请先配置 CRON_SECRET')
let stopping=false
process.on('SIGINT',()=>{stopping=true})
async function tick(){try{const res=await fetch(base+'/api/v2/worker',{headers:{Authorization:'Bearer '+process.env.CRON_SECRET},signal:AbortSignal.timeout(300000)});const result=await res.json();console.log(new Date().toISOString(),res.status,result.data||result.error)}catch(error){console.error(error.name)}if(!stopping)setTimeout(tick,10000)}
await tick()
