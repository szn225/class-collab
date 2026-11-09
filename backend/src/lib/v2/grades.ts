import { AppError, ensure, hash, text } from './model'
const commands = new Set(['students.list','students.create','workspace.get','workspace.save'])
const allowed = new Set(['records','plans','settings','datasets','activeDatasetVersion','exam_draft','last_exam_profile','target_school','exam_analysis_marks'])
function object(v:unknown):v is Record<string,any>{return !!v&&typeof v==='object'&&!Array.isArray(v)}
function parse(v:any,fallback:any){if(v==null)return fallback;if(typeof v==='string'){try{return JSON.parse(v)}catch{throw new AppError('成绩资料格式无效')}}return v}
function validId(v:unknown){ensure(typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v),'档案或记录标识无效');return v}
export function validateWorkspace(values:unknown){
 ensure(object(values),'成绩资料格式无效');ensure(Object.keys(values).every(k=>allowed.has(k)),'包含未知的成绩资料字段')
 ensure(Buffer.byteLength(JSON.stringify(values))<=1500000,'成绩资料过大，请按学生分开保存',413)
 const records=parse(values.records,[]),plans=parse(values.plans,[]),datasets=parse(values.datasets,[])
 ensure(Array.isArray(records)&&records.length<=2000,'考试记录格式或数量无效');ensure(Array.isArray(plans)&&plans.length<=5000,'复盘记录格式或数量无效');ensure(Array.isArray(datasets)&&datasets.length<=30,'参照数据格式或数量无效')
 for(const [items,kind]of [[records,'考试'],[plans,'复盘']]as const){const ids=new Set<string>();for(const item of items){ensure(object(item),kind+'记录格式无效');validId(item.id);ensure(!ids.has(item.id),'存在重复记录');ids.add(item.id)}}
 for(const r of records){ensure(typeof r.examName==='string'&&r.examName.length<=200&&/^\d{4}-\d{2}-\d{2}$/.test(r.examDate)&&['school','group','city'].includes(r.scope)&&typeof r.datasetVersion==='string'&&object(r.input)&&object(r.derivedSnapshot),'考试记录缺少有效字段')}
 for(const p of plans){ensure(typeof p.title==='string'&&p.title.length<=1000&&['todo','doing','done'].includes(p.status),'复盘计划格式无效')}
 if(values.settings!==undefined)ensure(object(parse(values.settings,{})),'学生设置格式无效')
 return values
}
export async function executeGrades(userId:string,command:string,b:Record<string,any>){
 const action=command.replace(/^grades\./,'');ensure(commands.has(action),'未知的成绩操作',404)
 const args:Record<string,any>={actor:userId,action,student_key:null,student_name:null,expected_revision:null,operation_key:null,body_hash:null,next_values:null}
 if(action==='students.create'){ensure(object(b.student),'请填写学生档案');args.student_key=validId(b.student.id);args.student_name=text(b.student.name,30,true)}
 if(action.startsWith('workspace.'))args.student_key=validId(b.studentId)
 if(action==='workspace.save'){
  ensure(Number.isSafeInteger(b.expectedRevision)&&b.expectedRevision>=0,'资料版本无效');args.expected_revision=b.expectedRevision;args.operation_key=validId(b.operationId);args.next_values=validateWorkspace(b.values);args.body_hash=hash(JSON.stringify({revision:b.expectedRevision,values:b.values}))
 }
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY,url=process.env.NEXT_PUBLIC_SUPABASE_URL;ensure(key&&url,'成绩云端服务尚未配置',503,'CONFIG')
 const response=await fetch(url+'/rest/v1/rpc/hui_grades',{method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+key},body:JSON.stringify(args),cache:'no-store',signal:AbortSignal.timeout(20000)})
 if(!response.ok)throw new AppError('成绩云端暂不可用，请确认数据库迁移已执行后重试',503,'GRADES_DATABASE')
 const result=await response.json();if(result.error)throw new AppError(result.error,result.status||400,result.code||'GRADES');return result
}
