const endpoints = require('./config/endpoints')
App({
 globalData:{userInfo:null,sessionToken:'',baseUrl:'https://gongchuang.chaohuiwan.com.cn'},
 onLaunch(){let env='release';try{env=wx.getAccountInfoSync().miniProgram.envVersion||'release'}catch{}this.globalData.baseUrl=endpoints[env]||endpoints.release;this.globalData.environment=env;this.globalData.sessionToken=wx.getStorageSync('hui.session')||'';this.globalData.userInfo=wx.getStorageSync('hui.user')||null;if(wx.onNetworkStatusChange)wx.onNetworkStatusChange(r=>{if(r.isConnected)require('./utils/grades').sync().catch(()=>{})})},
 notifyIdentity(){for(const page of getCurrentPages()){if(typeof page.onIdentityChanged==='function')page.onIdentityChanged()}},
 setSession(token,user){this.globalData.sessionToken=token;this.globalData.userInfo=user;wx.setStorageSync('hui.session',token);wx.setStorageSync('hui.user',user);this.notifyIdentity()},
 setUserInfo(user){this.globalData.userInfo=user;wx.setStorageSync('hui.user',user)},
 clearSession(){this.globalData.sessionToken='';this.globalData.userInfo=null;wx.removeStorageSync('hui.session');wx.removeStorageSync('hui.user');this.notifyIdentity()},
 logout(){this.clearSession();wx.reLaunch({url:'/pages/home/index'})},
})
