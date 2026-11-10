const grades=require('../../utils/grades')
Page({
 data:{hasRecords:false,user:null},
 onShow(){this.refresh()},
 onIdentityChanged(){this.refresh()},
 refresh(){grades.stopDemo();const state=getApp().globalData;this.setData({hasRecords:grades.count()>0,user:state.sessionToken ? state.userInfo : null})},
 account(){wx.navigateTo({url:'/pages/account/index'})},
 signIn(){wx.navigateTo({url:'/pages/login/index'})},
 coCreate(){wx.navigateTo({url:'/pages/co-create/index'})},
 grades(){grades.stopDemo();wx.navigateTo({url:grades.count()>0?'/packages/grades/pages/dashboard/index':'/packages/grades/pages/record/index'})},
 onShareAppMessage(){return {title:'慧共创',path:'/pages/home/index'}}
})
