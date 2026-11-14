function networkFailure(error) {
 const diagnostic=String(error.errMsg||'');let message='网络连接失败，请重试';
 if(/domain list|url not in domain|合法域名/i.test(diagnostic))message='服务域名尚未配置或生效，请刷新后重试';
 else if(/ssl|certificate|cert_/i.test(diagnostic))message='服务器安全连接失败，请稍后重试';
 else if(/timeout|timed out/i.test(diagnostic))message='请求超时，请重试；AI 任务可继续查看原进度';
 const result=new Error(message);result.uncertain=true;result.diagnostic=diagnostic;return result;
}
const requestId = () => 'r_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 14)
// Share only simultaneous reads, never settled results or mutations/quotes.
const reads=new Set(['me','activities.list','activity.get','materials.list','members.list','article.get','articles.list','points.list','grades.students.list','grades.workspace.get'])
const inflight=new Map()
function call(command, data = {}, operationId) {
  const app = getApp()
  const sessionToken = app.globalData.sessionToken || ''
  if(!reads.has(command))inflight.clear()
  const key=reads.has(command)&&!operationId?JSON.stringify([app.globalData.baseUrl,sessionToken,command,data]):null
  // Clone results because callers decorate article/material objects in place.
  const copy=value=>value===undefined?value:JSON.parse(JSON.stringify(value))
  if(key&&inflight.has(key))return inflight.get(key).then(copy)
  const request=new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + '/api/v2/' + command.replace(/\./g, '/'), method: 'POST',
      data: { ...data, requestId: operationId || requestId() }, timeout: command === 'task.run' ? 300000 : 25000,
      header: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sessionToken },
      success(res) {
        if ((app.globalData.sessionToken || '') !== sessionToken) return reject(new Error('账号已切换，请重新操作'))
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data && res.data.ok) return resolve(res.data.data)
        const error = new Error(res.data && res.data.error || '服务暂不可用，请稍后重试')
        error.status = res.statusCode; error.code = res.data && res.data.code; error.command=command
        if (res.statusCode === 401) app.clearSession()
        reject(error)
      },
      fail(error) { reject(networkFailure(error)) },
    })
  })
  if(!key)return request
  const shared=request.finally(()=>{if(inflight.get(key)===shared)inflight.delete(key)})
  inflight.set(key,shared)
  return shared.then(copy)
}
function fileData(path) { return new Promise((resolve,reject) => wx.getFileSystemManager().readFile({filePath:path,success:r=>resolve(r.data),fail:reject})) }
function mimeOf(buffer) { const b=new Uint8Array(buffer);if(b[0]===255&&b[1]===216)return 'image/jpeg';if(b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71)return 'image/png';if(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')return 'image/webp';throw new Error('仅支持 JPEG、PNG、WebP 图片') }
async function upload(activityId, photo, onProgress) {
  if (photo.uploadId) return photo.uploadId
  const data = await fileData(photo.path), mime = mimeOf(data)
  if (!photo.prepared) photo.prepared = await call('upload.prepare', {activityId,size:data.byteLength,mime}, photo.requestId)
  // If an earlier PUT succeeded but its response was lost, reuse the same object.
  try { const complete=await call('upload.complete',{activityId,uploadId:photo.prepared.id});photo.uploadId=complete.id;return complete.id } catch(error) { if(error.status===401||error.status===403)throw error }
  onProgress && onProgress('正在上传')
  await new Promise((resolve,reject)=>wx.request({url:photo.prepared.url,method:'PUT',data,header:{'Content-Type':mime},timeout:120000,success:r=>r.statusCode>=200&&r.statusCode<300?resolve():reject(new Error('图片上传失败，请重试')),fail:error=>reject(networkFailure(error))}))
  const complete=await call('upload.complete',{activityId,uploadId:photo.prepared.id});photo.uploadId=complete.id;return complete.id
}
async function uploadAvatar(photo) {
 const token=getApp().globalData.sessionToken
 const current=()=>{if(!token||getApp().globalData.sessionToken!==token)throw new Error('账号已切换，请重新操作')}
 current();if(photo.uploadId)return photo.uploadId
 const data=await fileData(photo.path);current()
 if(data.byteLength>1048576)throw new Error('头像不能超过 1 MB，请重新选择')
 const mime=mimeOf(data)
 if(photo.prepared){
  try{const complete=await call('profile.avatar.complete',{uploadId:photo.prepared.id});current();photo.uploadId=complete.id;return complete.id}
  catch(error){current();if(error.status!==409||error.code==='AVATAR_EXPIRED')throw error}
 }
 if(!photo.prepared)photo.prepared=await call('profile.avatar.prepare',{size:data.byteLength,mime},photo.requestId)
 current()
 await new Promise((resolve,reject)=>wx.request({url:photo.prepared.url,method:'PUT',data,header:{'Content-Type':mime},timeout:30000,success:r=>r.statusCode>=200&&r.statusCode<300||r.statusCode===409?resolve():reject(new Error('头像上传失败，请重试')),fail:e=>reject(networkFailure(e))}))
 current()
 const complete=await call('profile.avatar.complete',{uploadId:photo.prepared.id});current();photo.uploadId=complete.id;return complete.id
}
module.exports = {call,requestId,upload,uploadAvatar,networkFailure}
