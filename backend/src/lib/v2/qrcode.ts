import { ensure, AppError } from './model'
export async function inviteQr(code:string){
 ensure(process.env.WECHAT_APP_ID&&process.env.WECHAT_APP_SECRET,'微信服务尚未配置',503)
 const res=await fetch('https://api.weixin.qq.com/cgi-bin/stable_token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({grant_type:'client_credential',appid:process.env.WECHAT_APP_ID,secret:process.env.WECHAT_APP_SECRET,force_refresh:false}),cache:'no-store',signal:AbortSignal.timeout(15000)})
 const auth=await res.json();ensure(res.ok&&auth.access_token,'微信分享服务暂不可用',503)
 const image=await fetch('https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token='+auth.access_token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scene:'invite='+code,page:'pages/co-create/index',check_path:true,env_version:process.env.WECHAT_ENV_VERSION||'release',width:430}),signal:AbortSignal.timeout(15000)})
 if(!image.ok||!image.headers.get('content-type')?.startsWith('image/'))throw new AppError('二维码暂不可用，请确认小程序版本已发布',503)
 return {base64:Buffer.from(await image.arrayBuffer()).toString('base64')}
}
