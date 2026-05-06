import { api } from '../../utils/api'

Page({
  data: {
    article: null,
    materialCount: 0,
    loading: true,
  },

  onLoad(options) {
    this.loadArticle(options.topicId)
  },

  async loadArticle(topicId) {
    this.setData({ loading: true })
    try {
      const [article, materials] = await Promise.all([
        api.getArticle(topicId),
        api.getMaterials(topicId),
      ])
      this.setData({
        article,
        materialCount: materials.length,
      })
    } catch (err) {
      console.error('Load article failed:', err)
      this.setData({ article: null })
    } finally {
      this.setData({ loading: false })
    }
  },

  copyHTML() {
    if (!this.data.article) return

    wx.setClipboardData({
      data: this.data.article.html,
      success: () => {
        wx.showToast({ title: 'HTML 已复制', icon: 'success' })
      },
    })
  },

  formatTime(t) {
    if (!t) return ''
    const d = new Date(t)
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  },
})
