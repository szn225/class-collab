// Verifies configured services without printing keys, tokens, identities or database content.
const fs=require('node:fs'),{parseEnv}=require('node:util'),path=require('node:path')
const env=parseEnv(fs.readFileSync(path.join(__dirname,'../backend/.env.local'),'utf8'))
async function wechat(){
 if(!env.WECHAT_APP_ID||!env.WECHAT_APP_SECRET?.trim())return {service:'wechat',status:'missing_credentials'}
 try{const r=await fetch('https://api.weixin.qq.com/cgi-bin/stable_token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({grant_type:'client_credential',appid:env.WECHAT_APP_ID,secret:env.WECHAT_APP_SECRET.trim(),force_refresh:false}),signal:AbortSignal.timeout(15000)});const d=await r.json();return {service:'wechat',status:r.ok&&typeof d.access_token==='string'?'credentials_verified':'rejected',http:r.status,code:d.errcode||0}}
 catch(e){return {service:'wechat',status:'network_error',error:e.cause?.code||e.name}}
}
async function database(){
 if(!env.NEXT_PUBLIC_SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)return {service:'v2_database',status:'missing_credentials'}
 try{const r=await fetch(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/rpc/hui_read',{method:'POST',headers:{'Content-Type':'application/json',apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY},body:'{}',signal:AbortSignal.timeout(15000)});const d=await r.json();return {service:'v2_database',status:r.ok?'ready':r.status===404?'migration_missing':'unavailable',http:r.status,code:r.ok?undefined:d.code,initialized:r.ok?!!d.state?.config:undefined}}
 catch(e){return {service:'v2_database',status:'network_error',error:e.cause?.code||e.name}}
}
async function storage(){
 if(!env.NEXT_PUBLIC_SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)return {service:'private_storage',status:'missing_credentials'}
 try{const r=await fetch(env.NEXT_PUBLIC_SUPABASE_URL+'/storage/v1/bucket/hui-materials',{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY},signal:AbortSignal.timeout(15000)});const d=await r.json();return {service:'private_storage',status:r.ok?(d.public===false?'ready':'bucket_is_public'):'not_ready',http:r.status}}
 catch(e){return {service:'private_storage',status:'network_error',error:e.cause?.code||e.name}}
}
Promise.allSettled([wechat(),database(),storage()]).then(results=>{for(const r of results)console.log(JSON.stringify(r.status==='fulfilled'?r.value:{status:'check_failed'}))})
