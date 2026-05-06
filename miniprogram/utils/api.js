const app = getApp()

function request(method, path, data) {
  const url = app.globalData.baseUrl + path
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      header: { 'Content-Type': 'application/json' },
      success(res) {
        if (res.data && res.data.ok) {
          resolve(res.data.data)
        } else {
          wx.showToast({ title: res.data?.error || '请求失败', icon: 'none' })
          reject(new Error(res.data?.error || '请求失败'))
        }
      },
      fail(err) {
        wx.showToast({ title: '网络错误，请检查连接', icon: 'none' })
        reject(err)
      },
    })
  })
}

export const api = {
  // Auth
  login: (name) => request('POST', '/api/auth', { name }),

  // Topics
  getTopics: (userId) => request('GET', `/api/topics?userId=${userId}`),
  createTopic: (title, description, userId) =>
    request('POST', '/api/topics', { title, description, userId }),
  getTopic: (id) => request('GET', `/api/topics/${id}`),
  updateTopic: (id, data) => request('PATCH', `/api/topics/${id}`, data),
  joinTopic: (inviteCode, userId) =>
    request('POST', '/api/topics/join', { inviteCode, userId }),

  // Materials
  getMaterials: (topicId) => request('GET', `/api/materials?topicId=${topicId}`),
  addMaterial: (topicId, userId, type, content, imageUrl) =>
    request('POST', '/api/materials', { topicId, userId, type, content, imageUrl }),

  // Upload
  uploadImage: (filePath, userId) => {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: app.globalData.baseUrl + '/api/upload',
        filePath,
        name: 'file',
        formData: { userId },
        success(res) {
          try {
            const data = JSON.parse(res.data)
            if (data.ok) resolve(data.data.url)
            else reject(new Error(data.error))
          } catch {
            reject(new Error('上传失败'))
          }
        },
        fail: reject,
      })
    })
  },

  // Generate
  generateArticle: (topicId, userId) =>
    request('POST', '/api/generate', { topicId, userId }),

  // Article
  getArticle: (topicId) => request('GET', `/api/article?topicId=${topicId}`),

  // Members
  getMembers: (topicId) => request('GET', `/api/members?topicId=${topicId}`),
  removeMember: (topicId, userId) =>
    request('DELETE', '/api/members', { topicId, userId }),
}
