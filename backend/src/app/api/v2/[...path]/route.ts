import { publicArticle } from '@/lib/v2/public-article'
import { ADMIN_READ_COMMANDS } from '@/lib/v2/admin'
import { timedResponse, measure } from '@/lib/v2/timing'
import { NextRequest, NextResponse } from 'next/server'
import { executeGrades } from '@/lib/v2/grades'
import { execute, authenticate } from '@/lib/v2/domain'
import { AppError, ensure, token, hash, rate } from '@/lib/v2/model'
import { readState, transaction } from '@/lib/v2/store'
import { wechatIdentity, privateHash, adminPassword } from '@/lib/v2/identity'
import { listLegacy, readLegacy, bindLegacy } from '@/lib/v2/legacy'
import { inviteQr } from '@/lib/v2/qrcode'
import { uploadUrl, signedImage, verifyUpload } from '@/lib/v2/storage'
import { runTask, providerReady, cleanupUploads } from '@/lib/v2/worker'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export const maxDuration=300
function response(data:any,status=200){return NextResponse.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
async function handle(request:NextRequest,{params}:{params:{path:string[]}}){
 try{
  const command=params.path.join('.')
  if(command==='worker'){
   ensure(process.env.CRON_SECRET&&request.headers.get('authorization')===`Bearer ${process.env.CRON_SECRET}`,'未授权',401)
   const result=await runTask();await cleanupUploads();return response({ok:true,data:result})
  }
  ensure(request.method==='POST','请使用 POST',405)
  const maxBody=command==='grades.workspace.save'?1600000:100000
  ensure(Number(request.headers.get('content-length')||0)<=maxBody,'请求内容过大',413)
  const raw=await request.text();ensure(Buffer.byteLength(raw)<=maxBody,'请求内容过大',413)
  let b:any;try{b=JSON.parse(raw)}catch{throw new AppError('请求格式无效')};ensure(b&&typeof b==='object'&&!Array.isArray(b),'请求格式无效')
  const c={now:Date.now(),sessionHash:hash(request.headers.get('authorization')?.replace(/^Bearer /,'')||''),source:privateHash(request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown'),identity:undefined as string|undefined,sessionToken:undefined as string|undefined,adminLogin:false}
  if(command.startsWith('grades.')){const user=authenticate(await readState(),c);return response({ok:true,data:await measure('grades',()=>executeGrades(user.id,command,b))})}
  if(command==='public.article'){
   const article=publicArticle(await readState(),b.token);ensure(article,'文章未公开或分享已关闭',404,'SHARE_UNAVAILABLE');article.images=await Promise.all(article.images.map(async(img:any)=>({...img,url:await signedImage(img.path)})));return response({ok:true,data:article})
  }
  if(command==='auth.login'){
   await transaction(s=>rate(s,'wechat-exchange:'+c.source,30,3600000,c.now))
   c.identity=await wechatIdentity(b.code);c.sessionToken=token()
  }
  if(command==='admin.login'){
   await transaction(s=>rate(s,'admin-attempt:'+c.source,8,3600000,c.now))
   c.adminLogin=adminPassword(b.name,b.password);c.sessionToken=token()
  }
  if(command==='admin.legacy.list'){const s=await readState();authenticate(s,c,true);return response({ok:true,data:await listLegacy()})}
  if(command==='admin.legacy.bind'){const s=await readState();authenticate(s,c,true);ensure(typeof b.oldUserId==='string'&&typeof b.userId==='string'&&typeof b.reason==='string'&&b.reason.trim(),'请填写历史账号、目标账号和核验依据');const old=s.users.find(x=>x.legacyUserId===b.oldUserId);if(old){ensure(old.id===b.userId,'历史账号已绑定至其他用户',409);return response({ok:true,data:{bound:true,alreadyBound:true}})}const source=await readLegacy(b.oldUserId);return response({ok:true,data:await transaction(s=>bindLegacy(s,b,source,c.now))})}
  if(command==='invite.qr'){
   const s=await readState(),u=authenticate(s,c),a=s.activities.find(x=>x.id===b.activityId);ensure(a,'活动不存在',404);const m=a.members.find((m:any)=>m.userId===u.id&&!m.removed);ensure(m&&m.role!=='participant'&&a.status!=='archived','无邀请管理权限',403);await transaction(s=>rate(s,'qr:'+u.id,10,3600000,c.now));return response({ok:true,data:await inviteQr(a.inviteCode)})
  }
  if(command==='task.start'){
   const s=await readState(),u=authenticate(s,c),q=s.quotes.find(x=>x.id===b.quoteId&&x.userId===u.id);ensure(q,'报价不存在');providerReady(q.uncached.length,q.visionEnabled===true)
  }
  if(command==='task.run'){
   const s=await readState(),u=authenticate(s,c),t=s.tasks.find(x=>x.id===b.taskId&&x.activityId===b.activityId);ensure(t&&t.userId===u.id||t&&t.ownerId===u.id,'没有任务执行权限',403)
   // This resumes an already authorized/frozen job; cannot create or re-price work.
   return response({ok:true,data:await runTask(t!.id)})
  }
  if(command==='upload.complete'){
   const s=await readState(),u=authenticate(s,c),f=s.uploads.find(x=>x.id===b.uploadId&&x.userId===u.id&&x.activityId===b.activityId&&!x.deleted);ensure(f,'文件不存在',404);await verifyUpload(f.path,f.size,f.mime)
  }
  if(command==='profile.avatar.complete'){
   const s=await readState(),u=authenticate(s,c),f=s.uploads.find(x=>x.id===b.uploadId&&x.purpose==='avatar'&&x.userId===u.id&&!x.deleted&&x.expires>c.now);ensure(f,'头像凭证已失效，请重新选择',409,'AVATAR_EXPIRED');await verifyUpload(f.path,f.size,f.mime)
  }
  const reads=new Set(['account.articles','me','activities.list','activity.get','members.list','materials.list','articles.list','article.get','tasks.get','points.list','service.capabilities',...ADMIN_READ_COMMANDS]);
  const data=reads.has(command)?execute(await readState(),command,b,c):await transaction(s=>execute(s,command,b,c))
  if(command==='upload.prepare'||command==='profile.avatar.prepare')return response({ok:true,data:{...data,url:await uploadUrl(data.path)}})
  const profile=command==='auth.login'?data.user:['me','profile.update'].includes(command)?data:command==='points.list'?data.user:null
  if(profile){const path=profile.avatarPath;delete profile.avatarPath;if(path){try{profile.avatarUrl=await signedImage(path,3600,3500);profile.avatarExpiresAt=Date.now()+3600000}catch{profile.avatarUrl='';profile.avatarExpiresAt=0}}}
  if(command==='materials.list')await Promise.all(data.items.map(async(item:any)=>{const avatarPath=item.avatarPath;delete item.avatarPath;if(avatarPath){try{item.avatarUrl=await signedImage(avatarPath,3600,3500)}catch{item.avatarUrl=''}}if(item.images)item.images=await Promise.all(item.images.map(async(img:any)=>({...img,url:await signedImage(img.path)})))}))
  if(command==='article.get'&&data)data.images=await Promise.all(data.images.map(async(img:any)=>({...img,url:await signedImage(img.path)})))
  return response({ok:true,data})
 }catch(error){if(error instanceof AppError)return response({ok:false,error:error.message,code:error.code},error.status);console.error('v2 request failed',error instanceof Error?error.name:'unknown');return response({ok:false,error:'服务暂时不可用，请稍后重试',code:'SERVICE'},503)}
}
export const POST=(request:NextRequest,context:{params:{path:string[]}})=>timedResponse(()=>handle(request,context))
export const GET=POST
