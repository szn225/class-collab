const grades=require('../../utils/grades')
Page({
 data:{hasRecords:false},
 onShow(){grades.stopDemo();this.setData({hasRecords:grades.count()>0})},
 account(){wx.navigateTo({url:'/pages/account/index'})},
 coCreate(){wx.navigateTo({url:'/pages/co-create/index'})},
 grades(){grades.stopDemo();wx.navigateTo({url:grades.count()>0?'/packages/grades/pages/dashboard/index':'/packages/grades/pages/record/index'})},
 onShareAppMessage(){return {title:'慧共创',path:'/pages/home/index'}}
})
