const auth=require('../../utils/auth'),grades=require('../../utils/grades')
const {call,requestId,uploadAvatar}=require('../../utils/v2')
Page({
 data:{profileProbe:false,probeBusy:false,probeResult:'',probeNickname:'',probeAvatar:'',saveId:'',consent:false,busy:false,error:'',signedIn:false,privacy:false,profileStep:false,editingProfile:false,nickname:'',avatarPreview:'',avatarBroken:false,avatarPickerSupported:true,choosingAvatar:false,reviewing:false},
 onLoad(options){this.setData({profileProbe:options.probe==='1'});this.canReview=!!wx.canIUse?.('input.bindnicknamereview');this.setData({avatarPickerSupported:wx.canIUse?!!wx.canIUse('button.open-type.chooseAvatar'):true});this.setData({saveId:options.save||'',signedIn:auth.isLoggedIn(),editingProfile:options.profile==='1'});if(options.profile==='1'&&auth.isLoggedIn())this.openProfile(getApp().globalData.userInfo)},
 onUnload(){this.disposed=true},
 onIdentityChanged(){this.probeEpoch=(this.probeEpoch||0)+1;this.setData({probeBusy:false,probeResult:'',probeNickname:'',probeAvatar:''});if(this.profileUserId&&this.profileUserId!==getApp().globalData.userInfo?.id){this.photo=null;this.profileUserId=null;this.setData({profileStep:false,nickname:'',avatarPreview:'',choosingAvatar:false,signedIn:auth.isLoggedIn(),error:'账号已切换，请重新打开个人资料'})}},
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
   if(this.data.editingProfile||!user.profileSetupDone&&(!user.name||!(user.hasAvatar||user.avatarUrl))&&!wx.getStorageSync('hui.profile.dismissed.'+user.id))this.openProfile(user)
   else await this.finish()
  }catch(e){if(!this.disposed)this.setData({error:e.message||'登录未完成，请重试'})}finally{if(!this.disposed)this.setData({busy:false})}
 },
 probeWechatProfile(){
  if(!this.data.profileProbe||this.data.probeBusy||this.data.busy)return
  if(typeof wx.getUserProfile!=='function')return this.setData({probeResult:'当前微信没有提供该授权接口。'})
  const token=getApp().globalData.sessionToken,owner=getApp().globalData.userInfo?.id,epoch=this.probeEpoch=(this.probeEpoch||0)+1
  const current=()=>!this.disposed&&epoch===this.probeEpoch&&token===getApp().globalData.sessionToken&&owner===getApp().globalData.userInfo?.id
  this.setData({probeBusy:true,probeResult:'正在等待微信授权结果…',probeNickname:'',probeAvatar:''})
  const fail=e=>{if(current())this.setData({probeBusy:false,probeResult:'微信未返回资料：'+(e.errMsg||e.message||'未知错误')})}
  try{wx.getUserProfile({desc:'用于验证当前账号能否一次授权取得头像和昵称',success:r=>{if(!current())return;const nickname=String(r.userInfo?.nickName||''),avatar=String(r.userInfo?.avatarUrl||'');this.setData({probeBusy:false,probeNickname:nickname,probeAvatar:/^https:\/\//i.test(avatar)?avatar:'',probeResult:nickname==='微信用户'?'接口调用成功，但返回的是“微信用户”，不能据此确认已取得真实资料。':nickname&&avatar?'微信返回了昵称和头像，请核对是否为你本人当前资料。':'接口调用成功，但没有同时返回头像和昵称。'})},fail})}catch(e){fail(e)}
 },
 chooseAvatar(e){if(this.data.busy||!this.data.profileStep||this.profileUserId!==getApp().globalData.userInfo?.id||!e.detail?.avatarUrl)return;this.applyAvatar(e.detail.avatarUrl)},
 applyAvatar(path){this.photo={path,requestId:requestId()};this.profileSaveId=null;this.setData({avatarPreview:path,avatarBroken:false,error:''})},
 avatarPickerError(e){const message=e.detail?.errMsg||e.detail?.message||'';if(/cancel/i.test(message))return;this.setData({error:/privacy|authorize/i.test(message)?'请同意微信的隐私授权后重试，也可从相册选择头像。':'微信头像选择未完成，请重试或从相册选择。'})},
 async chooseAvatarFromAlbum(){
  if(this.data.busy||this.data.choosingAvatar)return
  const token=getApp().globalData.sessionToken,owner=this.profileUserId
  this.setData({choosingAvatar:true,error:''})
  try{
   this.assertOwner(token)
   const path=await new Promise((resolve,reject)=>{
    if(wx.chooseMedia)wx.chooseMedia({count:1,mediaType:['image'],sourceType:['album'],sizeType:['compressed'],success:r=>r.tempFiles?.[0]?.tempFilePath?resolve(r.tempFiles[0].tempFilePath):reject(new Error('未取得图片，请重新选择')),fail:reject})
    else if(wx.chooseImage)wx.chooseImage({count:1,sourceType:['album'],sizeType:['compressed'],success:r=>r.tempFilePaths?.[0]?resolve(r.tempFilePaths[0]):reject(new Error('未取得图片，请重新选择')),fail:reject})
    else reject(new Error('当前微信不支持图片选择，请更新微信后重试'))
   })
   if(this.disposed||this.profileUserId!==owner)return
   this.assertOwner(token);this.applyAvatar(path)
  }catch(e){if(!this.disposed&&this.profileUserId===owner&&getApp().globalData.sessionToken===token&&!/cancel/i.test(e.errMsg||e.message||''))this.setData({error:/privacy|authorize/i.test(e.errMsg||e.message||'')?'请同意微信的隐私授权后再选择照片。':e.message||'相册打开失败，请检查微信的相册权限后重试'})}finally{if(!this.disposed&&this.profileUserId===owner&&getApp().globalData.sessionToken===token)this.setData({choosingAvatar:false})}
 },
 avatarError(){this.setData({avatarBroken:true})},
 nicknameInput(e){if(this.data.busy)return;this.profileSaveId=null;this.setData({nickname:e.detail.value,error:''})},
 nicknameBlur(e){this.reviewNickname=String(e.detail.value||'').trim();this.nicknameInput(e);if(!this.canReview)this.reviewedNickname=this.reviewNickname},
 nicknameReview(e){if(e.detail.pass){this.reviewedNickname=this.reviewNickname;this.rejectedNickname=null}else{this.rejectedNickname=this.reviewNickname;this.setData({error:'昵称未通过检查，请修改后重试'})}},
 assertOwner(token){if(!token||getApp().globalData.sessionToken!==token||getApp().globalData.userInfo?.id!==this.profileUserId)throw new Error('账号已切换，请重新打开个人资料')},
 async saveProfile(e){
  if(this.data.busy||this.data.choosingAvatar)return
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
 async skipProfile(){if(this.data.busy||this.data.choosingAvatar)return;const token=getApp().globalData.sessionToken;try{this.assertOwner(token);wx.setStorageSync('hui.profile.dismissed.'+this.profileUserId,true);this.setData({busy:true,error:''});await this.finish()}catch(e){if(!this.disposed)this.setData({error:e.message||'请重试'})}finally{if(!this.disposed)this.setData({busy:false})}},
 async finish(){if(this.disposed)return;if(this.data.saveId){auth.claimGradeSave(this.data.saveId);await grades.refreshStudents();if(!this.disposed)wx.reLaunch({url:'/packages/grades/pages/record/index?save='+encodeURIComponent(this.data.saveId)})}else wx.navigateBack({fail:()=>wx.reLaunch({url:'/pages/home/index'})})},
 cancel(){if(!this.data.busy&&!this.data.choosingAvatar)wx.navigateBack({fail:()=>wx.reLaunch({url:'/pages/home/index'})})},
})
