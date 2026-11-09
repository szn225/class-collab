Page({
 account(){wx.navigateTo({url:'/pages/account/index'})},
 coCreate(){wx.navigateTo({url:'/pages/co-create/index'})},
 grades(){require('../../utils/grades').stopDemo();wx.navigateTo({url:'/packages/grades/pages/record/index'})},
 onShareAppMessage(){return {title:'慧共创',path:'/pages/home/index'}}
})
