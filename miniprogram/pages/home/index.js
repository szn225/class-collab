const grades=require('../../utils/grades')
Page({
 data:{user:null,avatarBroken:false,recentActivity:null},
 onShow(){this.refresh()},
 onIdentityChanged(){this.refresh()},
 refresh(){grades.stopDemo();const state=getApp().globalData;const user=state.sessionToken?state.userInfo:null;if(this.avatarUrl!==user?.avatarUrl){this.avatarUrl=user?.avatarUrl;this.setData({avatarBroken:false})}let recentActivity=null;try{if(user)recentActivity=wx.getStorageSync('hui.recent.activity.'+user.id)||null}catch{}this.setData({user,recentActivity});if(user?.hasAvatar&&(!user.avatarUrl||user.avatarExpiresAt<Date.now()+300000)&&!this.refreshingProfile){this.refreshingProfile=true;const token=state.sessionToken;require('../../utils/v2').call('me').then(u=>{if(getApp().globalData.sessionToken!==token)return;getApp().setUserInfo(u);this.avatarUrl=u.avatarUrl;this.setData({user:u,avatarBroken:false})}).catch(()=>{}).finally(()=>{this.refreshingProfile=false})}},
 continueActivity(){if(this.data.recentActivity)wx.navigateTo({url:'/pages/co-create/index?activity='+encodeURIComponent(this.data.recentActivity.id)})},
 avatarError(){this.setData({avatarBroken:true})},
 account(){wx.navigateTo({url:'/pages/account/index'})},
 signIn(){wx.navigateTo({url:'/pages/login/index'})},
 coCreate(){wx.navigateTo({url:'/pages/co-create/index'})},
 grades(){grades.stopDemo();wx.navigateTo({url:grades.count()>0?'/packages/grades/pages/dashboard/index':'/packages/grades/pages/record/index'})},
 onShareAppMessage(){return {title:'慧共创',path:'/pages/home/index'}}
})
