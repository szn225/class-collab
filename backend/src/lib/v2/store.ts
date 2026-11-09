import { State, initialState, AppError } from './model'
// One small-team installation is an optimistic aggregate transaction. PostgreSQL CAS
// serializes accounting, requests and task ownership across serverless instances.
// No process-local or filesystem fallback exists in production.
const headers = () => {
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY
 if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL) throw new AppError('数据库尚未配置',503,'CONFIG')
 return { 'Content-Type':'application/json', apikey:key, Authorization:`Bearer ${key}` }
}
async function rpc(name: string, body: object) {
 const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/${name}`, { method:'POST',headers:headers(),body:JSON.stringify(body), cache:'no-store',signal:AbortSignal.timeout(15000) })
 if (!res.ok) throw new AppError('数据服务暂时不可用，请稍后重试',503,'DATABASE')
 return res.json()
}
export interface Store { read(): Promise<{revision:number; state:State}>; cas(revision:number,state:State):Promise<boolean> }
export const database: Store = {
 async read() { const row = await rpc('hui_read',{}); return { revision:Number(row.revision),state:row.state?.config ? row.state : initialState() } },
 async cas(revision,state) { return (await rpc('hui_commit',{ expected_revision:revision, next_state:state })) === true }
}
export async function transaction<T>(fn: (s:State)=>T, store:Store=database):Promise<T> {
 for(let attempt=0;attempt<8;attempt++) { const {revision,state}=await store.read();const result=fn(state);if(await store.cas(revision,state))return result }
 throw new AppError('其他操作正在保存，请稍后重试',409,'CONFLICT')
}
export async function readState() { return (await database.read()).state }
