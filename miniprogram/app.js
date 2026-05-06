App({
  globalData: {
    userInfo: null,
    baseUrl: 'http://localhost:3000', // 开发环境，部署后改生产地址
  },

  onLaunch() {
    // 启动时尝试恢复登录状态
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
    }
  },

  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
  },

  logout() {
    this.globalData.userInfo = null
    wx.removeStorageSync('userInfo')
    wx.reLaunch({ url: '/pages/index/index' })
  },
})
