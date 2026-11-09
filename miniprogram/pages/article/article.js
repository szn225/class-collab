import { api } from '../../utils/api'
import { articleBody, formatTime } from '../../utils/presentation'
Page({
  data: {
    article: null,
    materialCount: 0,
    countKnown: false,
    loading: true,
    error: '',
    displayHtml: '',
    topicId: '',
    previewUrl: '',
    guideOpen: false,
    copying: false,
    steps: [
      '复制预览链接，在浏览器中打开；电脑端操作更方便',
      '点击网页上的「复制文章正文」',
      '在微信公众号后台新建图文，粘贴正文',
      '检查标题、图片与排版后发布',
    ],
  },
  onLoad(options) {
    this.setData({ topicId: options.topicId || '' })
  },
  onShow() {
    if (!getApp().globalData.userInfo) {
      wx.reLaunch({ url: '/pages/index/index' })
      return
    }
    this.loadArticle()
  },
  async loadArticle() {
    if (this._loading) return
    this._loading = true
    this.setData({ loading: true, error: '' })
    try {
      if (!this.data.topicId) throw new Error('缺少主题编号，请返回主题重新进入')
      const [article, materials] = await Promise.all([
        api.getArticle(this.data.topicId),
        api.getMaterials(this.data.topicId).catch(() => null),
      ])
      this.setData({
        article: article ? { ...article, createdAtText: formatTime(article.createdAt) } : null,
        displayHtml: articleBody(article?.html || ''),
        materialCount: materials?.length || 0,
        countKnown: materials !== null,
      })
    } catch (e) {
      if (e.statusCode === 404) this.setData({ article: null, displayHtml: '' })
      else this.setData({ error: e.message || '文章加载失败，请重试' })
    } finally {
      this._loading = false
      this.setData({ loading: false })
    }
  },
  toggleGuide() {
    this.setData({ guideOpen: !this.data.guideOpen })
  },
  copyURL() {
    if (this.data.copying || !this.data.topicId) return
    const url =
      getApp().globalData.baseUrl.replace(/\/+$/, '') +
      '/view/' +
      encodeURIComponent(this.data.topicId)
    this.setData({ previewUrl: url, copying: true })
    wx.setClipboardData({
      data: url,
      success: () => wx.showToast({ title: '链接已复制' }),
      fail: () => wx.showToast({ title: '请长按下方链接复制', icon: 'none' }),
      complete: () => this.setData({ copying: false }),
    })
  },
})
