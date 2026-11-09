const auth=require('../../utils/auth'),grades=require('../../utils/grades')
Page({
 data:{saveId:'',consent:false,busy:false,error:'',signedIn:false,privacy:false},
 onLoad(options){this.setData({saveId:options.save||'',signedIn:auth.isLoggedIn()})},
 consent(e){this.setData({consent:e.detail.value.length>0})},
 privacy(){this.setData({privacy:!this.data.privacy})},
 async login(){
  if(this.data.busy)return
  if(!this.data.consent&&!auth.isLoggedIn())return this.setData({error:'请先阅读并同意隐私说明'})
  this.setData({busy:true,error:''})
  try{
   if(!auth.isLoggedIn())await auth.login()
   this.setData({signedIn:true})
   if(this.data.saveId){auth.claimGradeSave(this.data.saveId);await grades.refreshStudents();wx.reLaunch({url:'/packages/grades/pages/record/index?save='+encodeURIComponent(this.data.saveId)})}
   else wx.navigateBack({fail:()=>wx.reLaunch({url:'/pages/home/index'})})
  }catch(e){this.setData({error:e.message||'登录未完成，请重试'})}finally{this.setData({busy:false})}
 },
 cancel(){if(!this.data.busy)wx.navigateBack({fail:()=>wx.reLaunch({url:'/pages/home/index'})})},
})
