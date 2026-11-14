import { AppError, ensure } from './model'
import { measure } from './timing'
const bucket='hui-materials'
function storageConfig(){const base=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;ensure(base&&key,'存储服务未配置',503);return {base,key}}
export async function storageCall(path:string,method='POST',body?:object,timeout=15000){const {base,key}=storageConfig();const res=await fetch(`${base}/storage/v1/${path}`,{method,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(timeout)});if(!res.ok)throw new AppError('图片服务暂时不可用',503,'STORAGE');return res.json()}
export async function uploadUrl(path:string){const data=await storageCall(`object/upload/sign/${bucket}/${path}`,'POST',{});const {base}=storageConfig();return `${base}/storage/v1${data.url}`}
export async function signedImage(path:string,seconds=300,timeout=15000){return measure('image_sign',async()=>{const data=await storageCall(`object/sign/${bucket}/${path}`,'POST',{expiresIn:seconds},timeout);const {base}=storageConfig();return `${base}/storage/v1${data.signedURL}`})}
export async function verifyUpload(path:string,size:number,mime:string){const {base,key}=storageConfig();const res=await fetch(`${base}/storage/v1/object/${bucket}/${path}`,{method:'HEAD',headers:{apikey:key,Authorization:`Bearer ${key}`},cache:'no-store',signal:AbortSignal.timeout(15000)});ensure(res.ok&&Number(res.headers.get('content-length'))===size&&res.headers.get('content-type')?.split(';')[0]===mime,'上传文件尚未完成或文件信息不符',409)}
export async function removeImages(paths:string[]){if(paths.length)await storageCall(`object/${bucket}`,'DELETE',{prefixes:paths})}
