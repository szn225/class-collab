import { api } from '../../utils/api'
import { presentTopic, formatTime } from '../../utils/presentation'
Page({
  data: {
    topic: {},
    materials: [],
    loading: true,
    error: '',
    inputText: '',
    sending: false,
    topicId: '',
    imageDrafts: [],
    imageCanRetry: false,
    imageProgress: '',
    imageBusy: false,
    imageError: '',
    keyboardHeight: 0,
    expanded: false,
    submitError: '',
  },
  onLoad(options) {
    this.setData({ topicId: options.id || '' })
  },
  onShow() {
    if (!getApp().globalData.userInfo) {
      wx.reLaunch({ url: '/pages/index/index' })
      return
    }
    this.loadData()
  },
  onHide() {
    this.setData({ keyboardHeight: 0 })
  },
  async loadData() {
    if (this._loading) return
    if (!this.data.topicId) {
      this.setData({ loading: false, error: '缺少主题编号，请返回列表重新进入' })
      return
    }
    this._loading = true
    this.setData({ loading: true, error: '' })
    try {
      const [topic, materials] = await Promise.all([
        api.getTopic(this.data.topicId),
        api.getMaterials(this.data.topicId),
      ])
      this.setData({
        topic: presentTopic(topic),
        materials: materials.map((m) => ({
          ...m,
          createdAtText: formatTime(m.createdAt),
          initial: (m.userName || '?').slice(0, 1),
          imageFailed: false,
        })),
      })
    } catch (e) {
      this.setData({ error: '素材加载失败，请检查网络后重试' })
    } finally {
      this._loading = false
      this.setData({ loading: false })
    }
  },
  onInput(e) {
    this.setData({ inputText: e.detail.value, submitError: '' })
  },
  toggleExpanded() {
    this.setData({ expanded: !this.data.expanded })
  },
  onKeyboardHeight(e) {
    this.setData({ keyboardHeight: e.detail.height || 0 })
  },
  async sendText() {
    if (this.data.sending || this.data.topic.status !== 'active') return
    const text = this.data.inputText.trim()
    if (!text) return
    this.setData({ sending: true, submitError: '' })
    try {
      await api.addMaterial(this.data.topicId, getApp().globalData.userInfo.id, 'text', text)
      if (this.data.inputText.trim() === text) this.setData({ inputText: '' })
      wx.showToast({ title: '素材已提交' })
      await this.loadData()
    } catch (e) {
      this.setData({ submitError: '发送失败，内容已保留，请重试' })
    } finally {
      this.setData({ sending: false })
    }
  },
  setImageDrafts(images) {
    this.setData({
      imageDrafts: images,
      imageCanRetry: images.some((image) => !image.invalid && image.status === 'failed'),
    })
  },
  updateImage(id, patch) {
    this.setImageDrafts(
      this.data.imageDrafts.map((image) => (image.id === id ? { ...image, ...patch } : image)),
    )
  },
  chooseImage() {
    if (this._choosing || this.data.imageBusy || this.data.topic.status !== 'active') return
    const remaining = 6 - this.data.imageDrafts.length
    if (remaining <= 0) {
      this.setData({ imageError: '最多保留6张待提交图片，请先重试或移除未成功的图片' })
      return
    }
    this._choosing = true
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      complete: () => {
        this._choosing = false
      },
      success: async (res) => {
        const files = (res.tempFiles || []).slice(0, remaining)
        if (!files.length) return
        const images = files.map((file) => {
          let error = ''
          if (file.size > 10 * 1024 * 1024) error = '超过10MB，请压缩后重选'
          else if (!/\.(jpe?g|png|webp|gif)$/i.test(file.tempFilePath))
            error = '请选择 JPG、PNG、WebP 或 GIF'
          this._imageSequence = (this._imageSequence || 0) + 1
          return {
            id: 'image-' + this._imageSequence,
            path: file.tempFilePath,
            uploadedUrl: '',
            status: error ? 'failed' : 'queued',
            statusLabel: error ? '无法提交' : '等待上传',
            invalid: !!error,
            error,
          }
        })
        this.setData({ imageError: '' })
        this.setImageDrafts([...this.data.imageDrafts, ...images])
        await this.sendImage()
      },
      fail: (err) => {
        if (!/cancel/i.test(err.errMsg || ''))
          this.setData({ imageError: '无法选择图片，请检查相册权限与隐私授权后重试' })
      },
    })
  },
  async sendImage() {
    if (this.data.imageBusy || this.data.topic.status !== 'active') return
    const pending = this.data.imageDrafts.filter(
      (image) => !image.invalid && image.status !== 'done',
    )
    if (!pending.length) return
    this.setData({ imageBusy: true, imageError: '' })
    const userId = getApp().globalData.userInfo.id
    let succeeded = 0
    try {
      // Keep each upload independent: a failed file must not discard other selected photos.
      for (let index = 0; index < pending.length; index++) {
        const image = pending[index]
        this.setData({ imageProgress: `正在提交 ${index + 1}/${pending.length}` })
        try {
          let url = image.uploadedUrl
          if (!url) {
            this.updateImage(image.id, { status: 'uploading', statusLabel: '正在上传', error: '' })
            url = await api.uploadImage(image.path, userId)
            this.updateImage(image.id, { uploadedUrl: url })
          }
          this.updateImage(image.id, { status: 'saving', statusLabel: '正在保存', error: '' })
          await api.addMaterial(this.data.topicId, userId, 'image', null, url)
          this.updateImage(image.id, { status: 'done', statusLabel: '提交成功' })
          succeeded++
        } catch (err) {
          this.updateImage(image.id, {
            status: 'failed',
            statusLabel: '提交失败',
            error: err.message || '请检查网络后重试',
          })
        }
      }
      const remaining = this.data.imageDrafts.filter((image) => image.status !== 'done')
      this.setImageDrafts(remaining)
      this.setData({
        imageError: remaining.length ? `有 ${remaining.length} 张未提交，请查看图片提示` : '',
      })
      if (succeeded) {
        wx.showToast({
          title: `已提交 ${succeeded} 张图片`,
          icon: remaining.length ? 'none' : 'success',
        })
        await this.loadData()
      }
    } finally {
      this.setData({ imageBusy: false, imageProgress: '' })
    }
  },
  clearImage(e) {
    if (this.data.imageBusy) return
    const id = e.currentTarget.dataset.id
    this.setImageDrafts(this.data.imageDrafts.filter((image) => image.id !== id))
    if (!this.data.imageDrafts.length) this.setData({ imageError: '' })
  },
  onImageError(e) {
    this.setData({ [`materials[${e.currentTarget.dataset.index}].imageFailed`]: true })
  },
  previewImage(e) {
    const current = e.currentTarget.dataset.url
    if (current)
      wx.previewImage({
        current,
        urls: this.data.materials
          .filter((m) => m.type === 'image' && m.imageUrl)
          .map((m) => m.imageUrl),
      })
  },
  copyInvite() {
    wx.setClipboardData({
      data: this.data.topic.inviteCode || '',
      fail: () => wx.showToast({ title: '复制失败，请长按邀请码复制', icon: 'none' }),
    })
  },
  goToArticle() {
    wx.navigateTo({ url: `/pages/article/article?topicId=${this.data.topicId}` })
  },
})
