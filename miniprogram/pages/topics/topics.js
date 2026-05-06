import { api } from '../../utils/api'

Page({
  data: {
    topics: [],
    loading: false,
    inviteCode: '',
    joining: false,
  },

  onShow() {
    this.checkAuth()
    this.loadTopics()
  },

  onPullDownRefresh() {
    this.loadTopics().then(() => wx.stopPullDownRefresh())
  },

  checkAuth() {
    const userInfo = getApp().globalData.userInfo
    if (!userInfo) {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  async loadTopics() {
    const userInfo = getApp().globalData.userInfo
    if (!userInfo) return

    this.setData({ loading: true })
    try {
      const topics = await api.getTopics(userInfo.id)
      this.setData({ topics })
    } catch (err) {
      console.error('Load topics failed:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  async handleJoin() {
    const code = this.data.inviteCode.trim().toUpperCase()
    if (!code || code.length !== 6) {
      wx.showToast({ title: '请输入6位邀请码', icon: 'none' })
      return
    }

    const userInfo = getApp().globalData.userInfo
    this.setData({ joining: true })

    try {
      await api.joinTopic(code, userInfo.id)
      wx.showToast({ title: '加入成功', icon: 'success' })
      this.setData({ inviteCode: '' })
      this.loadTopics()
    } catch (err) {
      console.error('Join failed:', err)
    } finally {
      this.setData({ joining: false })
    }
  },

  goToTopic(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/topic/topic?id=${id}` })
  },

  statusText(status) {
    const map = { active: '进行中', closed: '已结束', generated: '已出文' }
    return map[status] || status
  },
})
