// Resolve app state when a request starts, after application initialization.
export function networkError(error) {
  const detail = String(error.errMsg || '')
  let message = '无法连接服务器，请切换网络后重试'
  if (/domain list|url not in domain|合法域名/i.test(detail)) {
    message = '服务域名尚未生效，请联系管理员检查域名配置'
  } else if (/timeout|timed out/i.test(detail)) {
    message = '连接服务器超时，请切换网络后重试'
  } else if (/ssl|certificate|cert_/i.test(detail)) {
    message = '服务器安全连接失败，请联系管理员'
  }
  const result = new Error(message)
  result.diagnostic = detail
  result.errno = error.errno
  return result
}

function request(method, path, data) {
  const url = getApp().globalData.baseUrl + path
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      header: { 'Content-Type': 'application/json' },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data && res.data.ok) {
          resolve(res.data.data)
        } else {
          const message =
            typeof res.data?.error === 'string'
              ? res.data.error
              : `服务请求失败（HTTP ${res.statusCode}），请稍后重试`
          wx.showToast({ title: message, icon: 'none' })
          const error = new Error(message)
          error.statusCode = res.statusCode
          reject(error)
        }
      },
      fail(err) {
        const error = networkError(err)
        wx.showToast({ title: error.message, icon: 'none' })
        reject(error)
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
  joinTopic: (inviteCode, userId) => request('POST', '/api/topics/join', { inviteCode, userId }),

  // Materials
  getMaterials: (topicId) => request('GET', `/api/materials?topicId=${topicId}`),
  addMaterial: (topicId, userId, type, content, imageUrl) =>
    request('POST', '/api/materials', { topicId, userId, type, content, imageUrl }),

  // Upload
  uploadImage: (filePath, userId) => {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: getApp().globalData.baseUrl + '/api/upload',
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
  generateArticle: (topicId, userId) => request('POST', '/api/generate', { topicId, userId }),

  // Article
  getArticle: (topicId) => request('GET', `/api/article?topicId=${topicId}`),

  // Members
  getMembers: (topicId) => request('GET', `/api/members?topicId=${topicId}`),
  removeMember: (topicId, userId) => request('DELETE', '/api/members', { topicId, userId }),
}
