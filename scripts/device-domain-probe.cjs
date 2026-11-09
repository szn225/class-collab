const automator=require('/private/tmp/hui-miniprogram-automation/node_modules/miniprogram-automator')
async function main(){const m=await automator.connect({wsEndpoint:'ws://127.0.0.1:9431'});try{
 console.log(await m.evaluate(()=>{const c=typeof __wxConfig==='object'?__wxConfig:{};const seen=[],domains=[];function scan(x,p,d){if(d>8||!x)return;if(typeof x==='string'){for(const value of x.match(/(?:https?:\/\/)?[a-zA-Z0-9.-]*(?:chaohuiwan\.com\.cn|vercel\.app|supabase\.co)[a-zA-Z0-9.\/-]*/g)||[])domains.push({key:p,domain:value});return}if(typeof x!=='object'||seen.includes(x))return;seen.push(x);for(const k of Object.keys(x))scan(x[k],p+'.'+k,d+1)}scan(c.appContactInfo,'appContactInfo',0);return {contactKeys:Object.keys(c.appContactInfo||{}),domains}}));
 for(const url of ['https://gongchuang.chaohuiwan.com.cn/api/health','https://gongchuang-test.chaohuiwan.com.cn/api/health','https://class-collab-five.vercel.app/api/health']){try{const r=await m.callWxMethod('request',{url,method:'GET',timeout:10000});console.log({url,status:r.statusCode})}catch(e){console.log({url,error:e.message})}}
 }finally{await m.disconnect()}}
main().catch(e=>{console.error(e.message);process.exitCode=1})
