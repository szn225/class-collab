import { api } from '../../utils/api'
import { presentTopic } from '../../utils/presentation'
Page({
  data: {
    userName: '',
    initial: '',
    isAdmin: false,
    topics: [],
    members: [],
    loading: true,
    error: '',
    membersLoading: false,
    membersError: '',
    selectedTopicId: '',
    selectedTopicTitle: '',
    selectedIndex: 0,
    newTopicTitle: '',
    newTopicDesc: '',
    creating: false,
    createOpen: false,
    createError: '',
    busyIds: {},
    busyKinds: {},
  },
  onShow() {
    const user = getApp().globalData.userInfo
    if (!user) {
      wx.reLaunch({ url: '/pages/index/index' })
      return
    }
    this.setData({
      userName: user.name,
      initial: user.name.slice(0, 1),
      isAdmin: user.role === 'admin',
      loading: false,
    })
    if (this.data.isAdmin) this.loadData()
  },
  async loadData() {
    if (this._loading) return
    this._loading = true
    this.setData({ loading: true, error: '' })
    try {
      const topics = (await api.getTopics(getApp().globalData.userInfo.id)).map(presentTopic)
      let index = topics.findIndex((t) => t.id === this.data.selectedTopicId)
      if (index < 0) index = 0
      this.setData({
        topics,
        selectedIndex: index,
        selectedTopicId: topics[index]?.id || '',
        selectedTopicTitle: topics[index]?.title || '',
      })
      if (topics.length) await this.loadMembers()
      else this.setData({ members: [], membersError: '' })
    } catch (e) {
      this.setData({ error: '管理主题加载失败，请重试' })
    } finally {
      this._loading = false
      this.setData({ loading: false })
    }
  },
  selectTopic(e) {
    const index = Number(e.detail.value)
    const topic = this.data.topics[index]
    if (!topic) return
    this.setData({
      selectedIndex: index,
      selectedTopicId: topic.id,
      selectedTopicTitle: topic.title,
      members: [],
    })
    this.loadMembers()
  },
  async loadMembers() {
    const id = this.data.selectedTopicId
    if (!id) return
    const token = (this._memberToken || 0) + 1
    this._memberToken = token
    this.setData({ membersLoading: true, membersError: '' })
    try {
      const members = await api.getMembers(id)
      if (this._memberToken === token) this.setData({ members })
    } catch (e) {
      if (this._memberToken === token) this.setData({ membersError: '成员加载失败，请重试' })
    } finally {
      if (this._memberToken === token) this.setData({ membersLoading: false })
    }
  },
  openCreate() {
    this.setData({ createOpen: true, createError: '' })
  },
  closeCreate() {
    if (!this.data.creating) this.setData({ createOpen: false })
  },
  noop() {},
  onTopicTitleInput(e) {
    this.setData({ newTopicTitle: e.detail.value, createError: '' })
  },
  onTopicDescInput(e) {
    this.setData({ newTopicDesc: e.detail.value })
  },
  async createTopic() {
    if (this.data.creating) return
    const title = this.data.newTopicTitle.trim()
    if (!title) {
      this.setData({ createError: '请填写主题名称' })
      return
    }
    this.setData({ creating: true, createError: '' })
    try {
      await api.createTopic(title, this.data.newTopicDesc.trim(), getApp().globalData.userInfo.id)
      this.setData({ createOpen: false, newTopicTitle: '', newTopicDesc: '' })
      wx.showToast({ title: '主题已创建' })
      await this.loadData()
    } catch (e) {
      this.setData({ createError: e.message || '创建失败，请重试' })
    } finally {
      this.setData({ creating: false })
    }
  },
  setBusy(id, kind) {
    this.setData({ [`busyIds.${id}`]: !!kind, [`busyKinds.${id}`]: kind })
  },
  closeTopic(e) {
    const id = e.currentTarget.dataset.id
    if (this.data.busyIds[id]) return
    this.setBusy(id, 'confirm')
    wx.showModal({
      title: '结束素材收集？',
      content: '结束后同学将无法继续提交素材，已有素材会保留。',
      success: async (res) => {
        if (!res.confirm) {
          this.setBusy(id, '')
          return
        }
        this.setBusy(id, 'close')
        try {
          await api.updateTopic(id, { status: 'closed' })
          wx.showToast({ title: '已结束收集' })
          await this.loadData()
        } catch (e) {
          /* API displays request error */
        } finally {
          this.setBusy(id, '')
        }
      },
      fail: () => this.setBusy(id, ''),
    })
  },
  async generateArticle(e) {
    const id = e.currentTarget.dataset.id
    if (this.data.busyIds[id]) return
    this.setBusy(id, 'generate')
    try {
      await api.generateArticle(id, getApp().globalData.userInfo.id)
      wx.showToast({ title: '文章已生成' })
      await this.loadData()
    } catch (e) {
      /* API displays request error; existing materials remain */
    } finally {
      this.setBusy(id, '')
    }
  },
  viewArticle(e) {
    wx.navigateTo({ url: `/pages/article/article?topicId=${e.currentTarget.dataset.id}` })
  },
  goToTopics() {
    wx.switchTab({ url: '/pages/topics/topics' })
  },
  handleLogout() {
    wx.showModal({
      title: '退出登录？',
      content: '下次输入姓名即可继续记录。',
      success: (res) => {
        if (res.confirm) getApp().logout()
      },
    })
  },
})
