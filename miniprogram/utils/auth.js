const {call}=require('./v2')
const PENDING='hui.pendingGradeSave'
function isLoggedIn(){const app=getApp();return !!(app.globalData.sessionToken&&app.globalData.userInfo?.id)}
async function login(){
 const result=await new Promise((resolve,reject)=>wx.login({success:resolve,fail:reject}))
 if(!result.code)throw new Error('微信登录未完成，请重试')
 const session=await call('auth.login',{code:result.code})
 getApp().setSession(session.token,session.user)
 return session.user
}
function beginGradeSave(form,dataset){
 const pending={id:'rec_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12),form:JSON.parse(JSON.stringify(form)),dataset:JSON.parse(JSON.stringify(dataset)),userId:isLoggedIn()?getApp().globalData.userInfo.id:null,createdAt:Date.now()}
 wx.setStorageSync(PENDING,pending);return pending
}
function pendingGradeSave(id){
 const p=wx.getStorageSync(PENDING)
 if(!p||p.id!==id||Date.now()-p.createdAt>3600000||!p.form||!p.dataset)throw new Error('请返回录入页面，重新点击保存')
 if(p.userId&&isLoggedIn()&&p.userId!==getApp().globalData.userInfo.id)throw new Error('这次填写属于另一个账号，请切回原账号后保存')
 return p
}
function claimGradeSave(id){
 if(!isLoggedIn())throw new Error('请先登录')
 const p=pendingGradeSave(id);p.userId=getApp().globalData.userInfo.id;wx.setStorageSync(PENDING,p);return p
}
function finishGradeSave(id){if(wx.getStorageSync(PENDING)?.id===id)wx.removeStorageSync(PENDING)}
module.exports={isLoggedIn,login,beginGradeSave,pendingGradeSave,claimGradeSave,finishGradeSave}
