import { api } from '../../utils/api'
import { presentTopic } from '../../utils/presentation'
Page({
  data: {
    topics: [],
    visibleTopics: [],
    loading: true,
    error: '',
    inviteCode: '',
    joining: false,
    joinError: '',
    filter: 'all',
    userName: '',
    filters: [
      { id: 'all', label: '全部' },
      { id: 'active', label: '进行中' },
      { id: 'closed', label: '已结束' },
      { id: 'generated', label: '已出文' },
    ],
  },
  onShow() {
    const user = getApp().globalData.userInfo
    if (!user) {
      wx.reLaunch({ url: '/pages/index/index' })
      return
    }
    this.setData({ userName: user.name })
    this.loadTopics()
  },
  onPullDownRefresh() {
    this.loadTopics().finally(() => wx.stopPullDownRefresh())
  },
  async loadTopics() {
    const user = getApp().globalData.userInfo
    if (!user || this._loading) return
    this._loading = true
    this.setData({ loading: true, error: '' })
    try {
      const topics = (await api.getTopics(user.id)).map(presentTopic)
      this.setData({ topics })
      this.applyFilter()
    } catch (e) {
      this.setData({ error: '主题加载失败，请重试' })
    } finally {
      this._loading = false
      this.setData({ loading: false })
    }
  },
  applyFilter() {
    this.setData({
      visibleTopics: this.data.topics.filter(
        (t) => this.data.filter === 'all' || t.status === this.data.filter,
      ),
    })
  },
  selectFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.id })
    this.applyFilter()
  },
  onInviteCodeInput(e) {
    this.setData({ inviteCode: e.detail.value.trim().toUpperCase(), joinError: '' })
  },
  async handleJoin() {
    if (this.data.joining) return
    const code = this.data.inviteCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      this.setData({ joinError: '请输入6位字母或数字邀请码' })
      return
    }
    this.setData({ joining: true, joinError: '' })
    try {
      await api.joinTopic(code, getApp().globalData.userInfo.id)
      this.setData({ inviteCode: '' })
      wx.showToast({ title: '加入成功' })
      await this.loadTopics()
    } catch (e) {
      this.setData({ joinError: e.message || '加入失败，请重试' })
    } finally {
      this.setData({ joining: false })
    }
  },
  goToTopic(e) {
    wx.navigateTo({ url: `/pages/topic/topic?id=${e.currentTarget.dataset.id}` })
  },
})
