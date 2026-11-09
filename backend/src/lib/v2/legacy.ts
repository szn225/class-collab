import { select, count } from '../supabase'
import { State, Row, ensure, id, audit, text } from './model'
import { storageCall } from './storage'
// This is an explicit administrator operation. Names and legacy global roles
// never grant ownership, identity, or platform permissions.
export async function listLegacy(){return select<Row[]>('User',{columns:'id,name,createdAt',limit:1000})}
export async function readLegacy(oldUserId:string){
 const counts=await Promise.all(['User','Topic','Member','Material','Article'].map(t=>count(t)));ensure(counts.every(n=>n<=1000),'历史数据超过单批迁移上限，请先执行分批迁移工具');
 const users=await select<Row[]>('User',{columns:'id,name'});ensure(users.some(u=>u.id===oldUserId),'历史账号不存在',404)
 const [topics,members,materials,articles]=await Promise.all([select<Row[]>('Topic'),select<Row[]>('Member'),select<Row[]>('Material'),select<Row[]>('Article')])
 const linked=topics.filter(t=>t.createdBy===oldUserId||members.some(m=>m.topicId===t.id&&m.userId===oldUserId))
 ensure(linked.length<=30,'历史活动过多，请分批迁移');const files:Row[]=[]
 for(const material of materials.filter(m=>linked.some(t=>t.id===m.topicId)&&m.type==='image'&&m.imageUrl)){
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL!;let url:URL;try{url=new URL(material.imageUrl)}catch{continue}
  const prefix='/storage/v1/object/public/materials/';ensure(url.origin===new URL(base).origin&&url.pathname.startsWith(prefix),'历史图片地址需人工核对')
  const source=decodeURIComponent(url.pathname.slice(prefix.length));ensure(source&&!source.includes('..'),'历史图片地址无效');const destination=`legacy/${material.topicId}/${material.id}.jpg`
  files.push({materialId:material.id,path:destination,source})
 }
 ensure(files.length<=100,'历史图片过多，请先分批处理')
 for(const file of files){
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY!;const res=await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/materials/${file.source}`,{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:'no-store',signal:AbortSignal.timeout(15000)})
  ensure(res.ok,'历史图片读取失败，请先核对文件',503);const mime=res.headers.get('content-type')?.split(';')[0];ensure(mime&&['image/jpeg','image/png','image/webp'].includes(mime),'历史图片格式不支持');const size=Number(res.headers.get('content-length'));ensure(size>0&&size<=10485760,'历史图片大小超限');const bytes=await res.arrayBuffer();ensure(bytes.byteLength===size,'历史图片读取不完整')
  const upload=await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/hui-materials/${file.path}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':mime,'x-upsert':'true'},body:bytes,signal:AbortSignal.timeout(20000)});ensure(upload.ok,'迁移图片保存失败',503)
 }
 return {users,topics:linked,members:members.filter(m=>linked.some(t=>t.id===m.topicId)),materials:materials.filter(m=>linked.some(t=>t.id===m.topicId)),articles:articles.filter(m=>linked.some(t=>t.id===m.topicId)),files}
}
export function bindLegacy(s:State,b:Row,source:Awaited<ReturnType<typeof readLegacy>>,now:number){
 const reason=text(b.reason,1000,true),target=s.users.find(u=>u.id===b.userId);ensure(target,'目标微信账号不存在',404);const existing=s.users.find(u=>u.legacyUserId===b.oldUserId);ensure(!existing,'该历史账号已绑定',409);ensure(!target.legacyUserId,'目标账号已认领历史身份',409);target.legacyUserId=b.oldUserId
 const mapped=(old:string)=>s.users.find(u=>u.legacyUserId===old)?.id||'unclaimed-'+old
 for(const old of source.topics){
  let a=s.activities.find(a=>a.legacyTopicId===old.id)
  if(!a){a={id:id(),legacyTopicId:old.id,name:old.title,description:old.description||'',announcement:'',ownerId:mapped(old.createdBy),status:old.status==='closed'?'paused':'collecting',revision:1,inviteCode:'',createdAt:Date.parse(old.createdAt)||now,members:[],materials:[],versions:[],finalId:null,membersVisible:false,aiPaused:false};s.activities.push(a)}
  a.ownerId=mapped(old.createdBy)
  for(const member of source.members.filter(m=>m.topicId===old.id)){let m=a.members.find((m:Row)=>m.legacyUserId===member.userId);if(!m){m={legacyUserId:member.userId,userId:mapped(member.userId),role:member.userId===old.createdBy?'owner':'participant',ai:member.userId===old.createdBy,joinedAt:Date.parse(member.createdAt)||now};a.members.push(m)}m.userId=mapped(member.userId)}
  if(!a.members.some((m:Row)=>m.role==='owner'))a.members.push({legacyUserId:old.createdBy,userId:mapped(old.createdBy),role:'owner',ai:true,joinedAt:now})
  for(const item of source.materials.filter(m=>m.topicId===old.id)){let m=a.materials.find((m:Row)=>m.legacyMaterialId===item.id);if(!m){const file=source.files.find(f=>f.materialId===item.id);m={id:id(),legacyMaterialId:item.id,legacyUserId:item.userId,userId:mapped(item.userId),name:source.users.find(u=>u.id===item.userId)?.name||'历史成员',text:item.type==='voice'?'[历史语音记录，暂不支持播放]':item.content||'',images:file?[file.path]:[],state:'auto',withdrawn:false,createdAt:Date.parse(item.createdAt)||now};a.materials.push(m)}m.userId=mapped(item.userId)}
  const article=source.articles.find(x=>x.topicId===old.id)
  if(article&&!a.versions.length){const paths=a.materials.flatMap((m:Row)=>m.images);a.versions.push({id:id(),title:article.title,body:article.content,images:paths.map((p:string)=>({path:p,caption:''})),availableImages:paths,status:'draft',revision:1,sourceRevision:1,createdAt:Date.parse(article.createdAt)||now,usedIds:a.materials.map((m:Row)=>m.id),omitted:[]})}
 }
 // Update references in previously imported activities when a different member binds later.
 for(const a of s.activities){if(a.ownerId==='unclaimed-'+b.oldUserId)a.ownerId=target.id;for(const m of a.members)if(m.legacyUserId===b.oldUserId)m.userId=target.id;for(const m of a.materials)if(m.legacyUserId===b.oldUserId)m.userId=target.id}
 audit(s,'platform-admin','legacy.bind',b.oldUserId,`${reason}；目标 ${target.id}`,now);return {bound:true,activities:source.topics.length}
}
