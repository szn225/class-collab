import { api } from '../../utils/api'

Page({
  data: {
    name: '',
    loading: false,
  },

  async handleLogin() {
    const name = this.data.name.trim()
    if (!name) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      const userInfo = await api.login(name)
      getApp().setUserInfo(userInfo)

      wx.showToast({ title: '登录成功', icon: 'success' })
      wx.switchTab({ url: '/pages/topics/topics' })
    } catch (err) {
      console.error('Login failed:', err)
    } finally {
      this.setData({ loading: false })
    }
  },
})
