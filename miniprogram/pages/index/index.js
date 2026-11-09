import { api } from '../../utils/api'

Page({
  data: {
    name: '',
    loading: false,
    error: '',
  },

  onInput(e) {
    this.setData({ name: e.detail.value, error: '' })
  },

  async handleLogin() {
    if (this.data.loading) return
    const name = this.data.name.trim()
    if (!name) {
      this.setData({ error: '请填写你的真实姓名，方便同学认出你' })
      return
    }

    this.setData({ loading: true, error: '' })

    try {
      const userInfo = await api.login(name)
      getApp().setUserInfo(userInfo)

      wx.showToast({ title: '登录成功', icon: 'success' })
      wx.switchTab({ url: '/pages/topics/topics' })
    } catch (err) {
      this.setData({ error: err.message || '暂时无法进入，请稍后重试' })
      console.error('Login failed', {
        statusCode: err.statusCode,
        errno: err.errno,
        detail: err.diagnostic || '',
      })
    } finally {
      this.setData({ loading: false })
    }
  },
})
