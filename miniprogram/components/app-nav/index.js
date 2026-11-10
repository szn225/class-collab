Component({
 properties:{title:{type:String,value:''},showBack:{type:Boolean,value:false},showHome:{type:Boolean,value:true},customBack:{type:Boolean,value:false}},
 data:{statusBarHeight:20,navBarHeight:44,totalHeight:64,rightPad:96},
 lifetimes:{attached(){let status=20,width=375,height=44,right=96;try{const info=wx.getSystemInfoSync();status=info.statusBarHeight||20;width=info.windowWidth||375;const c=wx.getMenuButtonBoundingClientRect();if(c&&c.height>0){height=(c.top-status)*2+c.height;right=width-c.left+8}}catch{}this.setData({statusBarHeight:status,navBarHeight:height,totalHeight:status+height,rightPad:right})}},
 methods:{onHome(){if(this.data.customBack){this.triggerEvent('home');return}wx.reLaunch({url:'/pages/home/index'})},onBack(){if(this.data.customBack){this.triggerEvent('back');return}wx.navigateBack({fail:()=>wx.reLaunch({url:'/pages/home/index'})})}}
})
