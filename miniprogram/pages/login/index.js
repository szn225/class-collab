const auth=require('../../utils/auth'),grades=require('../../utils/grades')
const {call,requestId,uploadAvatar}=require('../../utils/v2')
Page({
 data:{saveId:'',consent:false,busy:false,error:'',signedIn:false,privacy:false,profileStep:false,editingProfile:false,nickname:'',avatarPreview:'',avatarBroken:false,reviewing:false},
 onLoad(options){this.canReview=!!wx.canIUse?.('input.bindnicknamereview');this.setData({saveId:options.save||'',signedIn:auth.isLoggedIn(),editingProfile:options.profile==='1'});if(options.profile==='1'&&auth.isLoggedIn())this.openProfile(getApp().globalData.userInfo)},
 onUnload(){this.disposed=true},
 onIdentityChanged(){if(this.profileUserId&&this.profileUserId!==getApp().globalData.userInfo?.id){this.photo=null;this.profileUserId=null;this.setData({profileStep:false,nickname:'',avatarPreview:'',signedIn:auth.isLoggedIn(),error:'账号已切换，请重新打开个人资料'})}},
 consent(e){this.setData({consent:e.detail.value.length>0})},
 privacy(){this.setData({privacy:!this.data.privacy})},
 openProfile(user){this.profileUserId=user.id;this.originalNickname=user.name||'';this.reviewedNickname=this.originalNickname;this.photo=null;this.profileSaveId=null;this.setData({profileStep:true,signedIn:true,nickname:user.name||'',avatarPreview:user.avatarUrl||'',avatarBroken:false,error:''})},
 async login(){
  if(this.data.busy)return
  if(!this.data.consent&&!auth.isLoggedIn())return this.setData({error:'请先阅读并同意隐私说明'})
  this.setData({busy:true,error:''})
  try{
   const user=auth.isLoggedIn()?getApp().globalData.userInfo:await auth.login()
   if(this.disposed)return
   this.setData({signedIn:true})
   if(this.data.editingProfile||!user.profileSetupDone&&!user.name&&!user.avatarUrl&&!wx.getStorageSync('hui.profile.dismissed.'+user.id))this.openProfile(user)
   else await this.finish()
  }catch(e){if(!this.disposed)this.setData({error:e.message||'登录未完成，请重试'})}finally{if(!this.disposed)this.setData({busy:false})}
 },
 chooseAvatar(e){if(this.data.busy||!e.detail.avatarUrl)return;this.photo={path:e.detail.avatarUrl,requestId:requestId()};this.profileSaveId=null;this.setData({avatarPreview:e.detail.avatarUrl,avatarBroken:false,error:''})},
 avatarError(){this.setData({avatarBroken:true})},
 nicknameInput(e){if(this.data.busy)return;this.profileSaveId=null;this.setData({nickname:e.detail.value,error:''})},
 nicknameBlur(e){this.reviewNickname=String(e.detail.value||'').trim();this.nicknameInput(e);if(!this.canReview)this.reviewedNickname=this.reviewNickname},
 nicknameReview(e){if(e.detail.pass){this.reviewedNickname=this.reviewNickname;this.rejectedNickname=null}else{this.rejectedNickname=this.reviewNickname;this.setData({error:'昵称未通过检查，请修改后重试'})}},
 assertOwner(token){if(!token||getApp().globalData.sessionToken!==token||getApp().globalData.userInfo?.id!==this.profileUserId)throw new Error('账号已切换，请重新打开个人资料')},
 async saveProfile(e){
  if(this.data.busy)return
  const nickname=String(e?.detail?.value?.nickname??this.data.nickname).trim(),token=getApp().globalData.sessionToken
  this.setData({busy:true,error:'',nickname})
  try{
   this.assertOwner(token)
   if(nickname.length>30)throw new Error('昵称最多 30 个字')
   if(nickname&&nickname!==this.originalNickname&&this.canReview){
    this.setData({reviewing:true});const until=Date.now()+3000
    while(this.reviewedNickname!==nickname&&this.rejectedNickname!==nickname&&Date.now()<until&&!this.disposed)await new Promise(r=>setTimeout(r,50))
    if(this.disposed)return
    this.assertOwner(token)
    if(this.rejectedNickname===nickname)throw new Error('昵称未通过检查，请修改后重试')
    if(this.reviewedNickname!==nickname)throw new Error('昵称检查尚未完成，请收起键盘后重试')
   }
   const avatarUploadId=this.photo?await uploadAvatar(this.photo):undefined;this.assertOwner(token)
   this.profileSaveId=this.profileSaveId||requestId()
   const user=await call('profile.update',{...(nickname?{name:nickname}:{}),...(avatarUploadId?{avatarUploadId}:{}),profileSetupDone:true},this.profileSaveId)
   this.assertOwner(token);getApp().setUserInfo(user)
   if(!this.disposed)await this.finish()
  }catch(e){if(!this.disposed)this.setData({error:e.message||'资料保存失败，请重试'})}finally{if(!this.disposed)this.setData({busy:false,reviewing:false})}
 },
 async skipProfile(){if(this.data.busy)return;const token=getApp().globalData.sessionToken;try{this.assertOwner(token);wx.setStorageSync('hui.profile.dismissed.'+this.profileUserId,true);this.setData({busy:true,error:''});await this.finish()}catch(e){if(!this.disposed)this.setData({error:e.message||'请重试'})}finally{if(!this.disposed)this.setData({busy:false})}},
 async finish(){if(this.disposed)return;if(this.data.saveId){auth.claimGradeSave(this.data.saveId);await grades.refreshStudents();if(!this.disposed)wx.reLaunch({url:'/packages/grades/pages/record/index?save='+encodeURIComponent(this.data.saveId)})}else wx.navigateBack({fail:()=>wx.reLaunch({url:'/pages/home/index'})})},
 cancel(){if(!this.data.busy)wx.navigateBack({fail:()=>wx.reLaunch({url:'/pages/home/index'})})},
})
