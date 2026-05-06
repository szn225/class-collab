import { api } from '../../utils/api'

let recorderManager = null
let audioCtx = null

Page({
  data: {
    topic: {},
    materials: [],
    loading: false,
    inputText: '',
    recording: false,
    topicId: '',
  },

  onLoad(options) {
    this.setData({ topicId: options.id })
    this.loadData()

    // Initialize recorder
    recorderManager = wx.getRecorderManager()
    recorderManager.onStop((res) => {
      // For now, voice is converted to a text note
      // In production, integrate with a STT service
      this.sendVoiceNote(res.tempFilePath)
    })

    // Listen for page scroll to hide keyboard
    wx.onKeyboardHeightChange?.()
  },

  onShow() {
    const userInfo = getApp().globalData.userInfo
    if (!userInfo) {
      wx.reLaunch({ url: '/pages/index/index' })
    }
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const [topic, materials] = await Promise.all([
        api.getTopic(this.data.topicId),
        api.getMaterials(this.data.topicId),
      ])
      this.setData({ topic, materials })
    } catch (err) {
      console.error('Load topic failed:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  // Text input
  async sendText() {
    const text = this.data.inputText.trim()
    if (!text) return

    const userInfo = getApp().globalData.userInfo
    try {
      await api.addMaterial(this.data.topicId, userInfo.id, 'text', text)
      this.setData({ inputText: '' })
      this.loadData()
    } catch (err) {
      console.error('Send text failed:', err)
    }
  },

  // Image upload
  async chooseImage() {
    const userInfo = getApp().globalData.userInfo
    try {
      const res = await wx.chooseImage({
        count: 9,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })

      wx.showLoading({ title: '上传中...' })
      for (const filePath of res.tempFilePaths) {
        const url = await api.uploadImage(filePath, userInfo.id)
        await api.addMaterial(this.data.topicId, userInfo.id, 'image', null, url)
      }
      wx.hideLoading()
      this.loadData()
    } catch (err) {
      wx.hideLoading()
      console.error('Upload failed:', err)
    }
  },

  // Voice recording
  startRecording() {
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.setData({ recording: true })
        recorderManager.start({
          format: 'mp3',
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 48000,
        })
      },
      fail: () => {
        wx.showToast({ title: '需要录音权限', icon: 'none' })
      },
    })
  },

  stopRecording() {
    this.setData({ recording: false })
    recorderManager.stop()
  },

  async sendVoiceNote(filePath) {
    const userInfo = getApp().globalData.userInfo
    try {
      // For MVP, send voice as text note
      // In production, upload audio file and transcribe
      wx.showToast({ title: '语音已提交（文字版）', icon: 'none' })
      await api.addMaterial(this.data.topicId, userInfo.id, 'voice', '[语音消息]')
      this.loadData()
    } catch (err) {
      console.error('Send voice failed:', err)
    }
  },

  goToArticle() {
    wx.navigateTo({
      url: `/pages/article/article?topicId=${this.data.topicId}`,
    })
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({ urls: [url] })
  },

  formatTime(t) {
    if (!t) return ''
    const d = new Date(t)
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  },

  statusText(status) {
    const map = { active: '进行中', closed: '已结束', generated: '已出文' }
    return map[status] || status
  },
})
