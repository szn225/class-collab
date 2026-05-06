import { api } from '../../utils/api'

Page({
  data: {
    userName: '',
    isAdmin: false,
    topics: [],
    members: [],
    newTopicTitle: '',
    newTopicDesc: '',
    creating: false,
  },

  onShow() {
    const userInfo = getApp().globalData.userInfo
    if (!userInfo) {
      wx.reLaunch({ url: '/pages/index/index' })
      return
    }

    this.setData({
      userName: userInfo.name,
      isAdmin: userInfo.role === 'admin',
    })

    if (userInfo.role === 'admin') {
      this.loadData()
    }
  },

  async loadData() {
    const userInfo = getApp().globalData.userInfo
    try {
      const topics = await api.getTopics(userInfo.id)
      this.setData({ topics })

      if (topics.length > 0) {
        // Load members from the first topic (simplified: show all members)
        const members = await api.getMembers(topics[0].id)
        this.setData({ members })
      }
    } catch (err) {
      console.error('Load admin data failed:', err)
    }
  },

  async createTopic() {
    const title = this.data.newTopicTitle.trim()
    if (!title) {
      wx.showToast({ title: '请输入主题名称', icon: 'none' })
      return
    }

    const userInfo = getApp().globalData.userInfo
    this.setData({ creating: true })

    try {
      await api.createTopic(title, this.data.newTopicDesc.trim(), userInfo.id)
      wx.showToast({ title: '创建成功', icon: 'success' })
      this.setData({ newTopicTitle: '', newTopicDesc: '' })
      this.loadData()
    } catch (err) {
      console.error('Create topic failed:', err)
    } finally {
      this.setData({ creating: false })
    }
  },

  async closeTopic(e) {
    const { id } = e.currentTarget.dataset
    try {
      await api.updateTopic(id, { status: 'closed' })
      wx.showToast({ title: '已关闭', icon: 'success' })
      this.loadData()
    } catch (err) {
      console.error('Close topic failed:', err)
    }
  },

  async generateArticle(e) {
    const { id } = e.currentTarget.dataset
    const userInfo = getApp().globalData.userInfo

    wx.showLoading({ title: 'AI 生成中...' })
    try {
      await api.generateArticle(id, userInfo.id)
      wx.hideLoading()
      wx.showToast({ title: '生成成功', icon: 'success' })
      this.loadData()
    } catch (err) {
      wx.hideLoading()
      console.error('Generate failed:', err)
    }
  },

  viewArticle(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/article/article?topicId=${id}` })
  },

  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          getApp().logout()
        }
      },
    })
  },
})
