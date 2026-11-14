// Read-only protected-preview probe. Secrets and response bodies remain in a private temp dir.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process')
const root=path.resolve(__dirname,'..'),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'hui-regional-probe-'))
const token=JSON.parse(fs.readFileSync(path.join(root,'backend/device-session.local'),'utf8')).token
const headerFile=path.join(temporary,'headers.local');fs.writeFileSync(headerFile,'Content-Type: application/json\nAuthorization: Bearer '+token+'\n',{mode:0o600})
const deployments={iad1:'https://class-collab-v2-test-77kyl9heb-anns-projects-14c3a4b1.vercel.app',sin1:'https://class-collab-v2-test-awg38x2rd-anns-projects-14c3a4b1.vercel.app'}
const rows=[]
try{
 for(let round=0;round<3;round++)for(const [region,url] of Object.entries(deployments)){
  const output=path.join(temporary,'response.local'),headers=path.join(temporary,'response-headers.local')
  const command=round===1?'activities/list':'me'
  const result=spawnSync('vercel',['curl','/api/v2/'+command,'--cwd','/private/tmp/hui-v2-device-test','--scope','anns-projects-14c3a4b1','--deployment',url,'--','--silent','--show-error','--max-time','35','--request','POST','--data','{}','--header','@'+headerFile,'--output',output,'--dump-header',headers,'--write-out','\nPROBE %{http_code} %{time_total}\n'],{encoding:'utf8',timeout:90000})
  const match=(result.stdout||'').match(/PROBE (\d+) ([\d.]+)/),raw=fs.existsSync(headers)?fs.readFileSync(headers,'utf8'):''
  const find=name=>[...raw.matchAll(new RegExp('^'+name+':\\s*(.+)$','gim'))].at(-1)?.[1]?.trim()||null
  const row={region,round,command:command.replace('/','.'),status:match?Number(match[1]):null,totalMs:match?Math.round(Number(match[2])*1000):null,serverTiming:find('server-timing'),vercelId:find('x-vercel-id'),exit:result.status}
  rows.push(row);console.log(JSON.stringify(row));if(!match||row.status!==200)throw Error('Read-only preview probe failed; raw output withheld')
 }
 fs.writeFileSync(path.join(root,'docs/performance-2026-11-13/regional-latency.json'),JSON.stringify({at:new Date().toISOString(),location:'agent host via protected preview curl, not phone',rows},null,2)+'\n')
}finally{fs.rmSync(temporary,{recursive:true,force:true})}
