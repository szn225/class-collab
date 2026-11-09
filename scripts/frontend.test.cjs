const fs = require('node:fs'),
  vm = require('node:vm'),
  assert = require('node:assert/strict')
const root = require('node:path').resolve(__dirname, '..')
const ts = require(root + '/backend/node_modules/typescript')
function instantiate(name, api = {}, wx = {}) {
  let page
  const user = { id: 'user-1', name: '小云', role: 'admin' }
  const context = {
    console,
    wx: { showToast() {}, ...wx },
    getApp: () => ({ globalData: { userInfo: user, baseUrl: 'https://example.com/' } }),
    Page: (p) => (page = p),
  }
  const cache = {}
  function load(file) {
    if (cache[file]) return cache[file]
    const module = { exports: {} }
    const require = (spec) =>
      spec.endsWith('/api') ? { api } : load(root + '/miniprogram/utils/presentation.js')
    vm.runInNewContext(
      ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
      }).outputText,
      { ...context, module, exports: module.exports, require },
      { filename: file },
    )
    cache[file] = module.exports
    return module.exports
  }
  load(`${root}/miniprogram/pages/${name}/${name}.js`)
  page.data = JSON.parse(JSON.stringify(page.data))
  page.setData = function (updates) {
    for (const [key, value] of Object.entries(updates)) {
      const parts = key.replace(/\[(\d+)\]/g, '.$1').split('.')
      let obj = this.data
      for (const p of parts.slice(0, -1)) obj = obj[p] ??= isNaN(Number(parts.at(-1))) ? {} : []
      obj[parts.at(-1)] = value
    }
  }
  return page
}
const deferred = () => {
  let resolve
  return {
    promise: new Promise((r) => (resolve = r)),
    get resolve() {
      return resolve
    },
  }
}
const tests = []
function test(name, fn) {
  tests.push([name, fn])
}
test('failed topic load preserves old records and exposes retry', async () => {
  const p = instantiate('topics', {
    getTopics: async () => {
      throw Error('offline')
    },
  })
  p.data.topics = [{ id: 'old' }]
  await p.loadTopics()
  assert.equal(p.data.topics[0].id, 'old')
  assert.ok(p.data.error)
  assert.equal(p.data.loading, false)
})
test('topic status is computed; filtering preserves original collection', async () => {
  const p = instantiate('topics', {
    getTopics: async () => [
      { id: 'a', status: 'active' },
      { id: 'b', status: 'generated' },
    ],
  })
  await p.loadTopics()
  assert.equal(p.data.topics[0].statusLabel, '进行中')
  p.selectFilter({ currentTarget: { dataset: { id: 'generated' } } })
  assert.equal(p.data.visibleTopics.length, 1)
  assert.equal(p.data.topics.length, 2)
})
test('join validates invite code and prevents duplicate requests', async () => {
  let calls = 0
  const gate = deferred()
  const p = instantiate('topics', {
    joinTopic: async () => {
      calls++
      await gate.promise
    },
    getTopics: async () => [],
  })
  p.data.inviteCode = 'bad'
  await p.handleJoin()
  assert.ok(p.data.joinError)
  assert.equal(calls, 0)
  p.data.inviteCode = 'ab2345'
  const pending = p.handleJoin()
  await p.handleJoin()
  assert.equal(calls, 1)
  gate.resolve()
  await pending
  assert.equal(p.data.joining, false)
})
test('text send preserves failure draft and locks duplicates', async () => {
  let calls = 0
  const gate = deferred()
  const p = instantiate('topic', {
    addMaterial: async () => {
      calls++
      await gate.promise
      throw Error('offline')
    },
  })
  Object.assign(p.data, { topic: { status: 'active' }, inputText: '我的活动记录' })
  const pending = p.sendText()
  await p.sendText()
  assert.equal(calls, 1)
  gate.resolve()
  await pending
  assert.equal(p.data.inputText, '我的活动记录')
  assert.ok(p.data.submitError)
  assert.equal(p.data.sending, false)
})
const photo = (name, size = 1024) => ({ tempFilePath: '/tmp/' + name, size })
function imagePage(api = {}) {
  let options
  let selections = 0
  const p = instantiate(
    'topic',
    {
      getTopic: async () => ({ status: 'active' }),
      getMaterials: async () => [],
      ...api,
    },
    {
      chooseMedia: (value) => {
        options = value
        selections++
      },
    },
  )
  Object.assign(p.data, { topicId: 't', topic: { status: 'active' } })
  return { p, options: () => options, selections: () => selections }
}
test('selects up to six images and saves each sequentially', async () => {
  let active = 0,
    maximum = 0,
    uploads = 0,
    saves = 0
  const { p, options } = imagePage({
    uploadImage: async (file) => {
      uploads++
      active++
      maximum = Math.max(active, maximum)
      await new Promise((resolve) => setImmediate(resolve))
      active--
      return 'https://example.com/' + file
    },
    addMaterial: async (topic, user, type) => {
      assert.equal(type, 'image')
      saves++
    },
  })
  p.chooseImage()
  assert.equal(options().count, 6)
  await options().success({ tempFiles: Array.from({ length: 7 }, (_, i) => photo(i + '.jpg')) })
  options().complete()
  assert.equal(uploads, 6)
  assert.equal(saves, 6)
  assert.equal(maximum, 1)
  assert.equal(p.data.imageDrafts.length, 0)
  assert.equal(p.data.imageBusy, false)
})
test('partial batch retry preserves URLs and never resubmits successful photos', async () => {
  const uploads = {},
    saves = {}
  const { p, options } = imagePage({
    uploadImage: async (file) => {
      uploads[file] = (uploads[file] || 0) + 1
      if (file.endsWith('c.jpg') && uploads[file] === 1) throw Error('upload failed')
      return 'https://example.com/' + file
    },
    addMaterial: async (topic, user, type, content, url) => {
      saves[url] = (saves[url] || 0) + 1
      if (url.endsWith('b.jpg') && saves[url] === 1) throw Error('save failed')
    },
  })
  p.chooseImage()
  await options().success({ tempFiles: [photo('a.jpg'), photo('b.jpg'), photo('c.jpg')] })
  options().complete()
  assert.equal(p.data.imageDrafts.length, 2)
  assert.ok(p.data.imageDrafts.find((image) => image.path.endsWith('b.jpg')).uploadedUrl)
  assert.equal(p.data.imageCanRetry, true)
  await p.sendImage()
  assert.equal(uploads['/tmp/a.jpg'], 1)
  assert.equal(uploads['/tmp/b.jpg'], 1)
  assert.equal(uploads['/tmp/c.jpg'], 2)
  assert.equal(saves['https://example.com//tmp/a.jpg'], 1)
  assert.equal(saves['https://example.com//tmp/b.jpg'], 2)
  assert.equal(saves['https://example.com//tmp/c.jpg'], 1)
  assert.equal(p.data.imageDrafts.length, 0)
})
test('cancel is silent and invalid photos do not block valid photos', async () => {
  let uploads = 0
  const { p, options } = imagePage({
    uploadImage: async () => {
      uploads++
      return 'https://example.com/a.jpg'
    },
    addMaterial: async () => {},
  })
  p.chooseImage()
  options().fail({ errMsg: 'chooseMedia:fail cancel' })
  options().complete()
  assert.equal(p.data.imageError, '')
  p.chooseImage()
  await options().success({
    tempFiles: [photo('big.jpg', 11 * 1024 * 1024), photo('bad.heic'), photo('good.jpg')],
  })
  options().complete()
  assert.equal(uploads, 1)
  assert.equal(p.data.imageDrafts.length, 2)
  assert.ok(p.data.imageDrafts.every((image) => image.invalid))
  assert.equal(p.data.imageCanRetry, false)
  await p.sendImage()
  assert.equal(uploads, 1)
})
test('failed drafts count toward six-image limit and removal frees capacity', async () => {
  const { p, options, selections } = imagePage({
    uploadImage: async () => {
      throw Error('offline')
    },
  })
  p.chooseImage()
  await options().success({ tempFiles: Array.from({ length: 6 }, (_, i) => photo(i + '.jpg')) })
  options().complete()
  assert.equal(p.data.imageDrafts.length, 6)
  p.chooseImage()
  assert.equal(selections(), 1)
  p.clearImage({ currentTarget: { dataset: { id: p.data.imageDrafts[0].id } } })
  assert.equal(p.data.imageDrafts.length, 5)
  p.chooseImage()
  assert.equal(options().count, 1)
})
test('active upload locks duplicate submission, picker and removal', async () => {
  const gate = deferred()
  let uploads = 0
  const { p, options, selections } = imagePage({
    uploadImage: async () => {
      uploads++
      await gate.promise
      return 'https://example.com/a.jpg'
    },
    addMaterial: async () => {},
  })
  p.chooseImage()
  const pending = options().success({ tempFiles: [photo('a.jpg'), photo('b.jpg')] })
  options().complete()
  await p.sendImage()
  p.chooseImage()
  p.clearImage({ currentTarget: { dataset: { id: p.data.imageDrafts[0].id } } })
  assert.equal(uploads, 1)
  assert.equal(selections(), 1)
  assert.equal(p.data.imageDrafts.length, 2)
  gate.resolve()
  await pending
  assert.equal(uploads, 2)
  assert.equal(p.data.imageDrafts.length, 0)
})
test('closed topics reject image selection and upload', async () => {
  const { p, selections } = imagePage({
    uploadImage: async () => {
      throw Error('should not upload')
    },
  })
  p.data.topic.status = 'closed'
  p.chooseImage()
  await p.sendImage()
  assert.equal(selections(), 0)
})
test('member selection ignores stale responses', async () => {
  const a = deferred(),
    b = deferred()
  const p = instantiate('admin', { getMembers: (id) => (id === 'a' ? a.promise : b.promise) })
  p.data.topics = [
    { id: 'a', title: '运动会' },
    { id: 'b', title: '秋游' },
  ]
  p.selectTopic({ detail: { value: '0' } })
  p.selectTopic({ detail: { value: '1' } })
  b.resolve([{ id: 'b-user' }])
  await new Promise((r) => setImmediate(r))
  a.resolve([{ id: 'a-user' }])
  await new Promise((r) => setImmediate(r))
  assert.equal(p.data.members[0].id, 'b-user')
  assert.equal(p.data.selectedTopicTitle, '秋游')
})
test('generation locks selected topic only and clears on failure', async () => {
  const gate = deferred()
  let calls = 0
  const p = instantiate('admin', {
    generateArticle: async () => {
      calls++
      await gate.promise
      throw Error('failed')
    },
  })
  const e = { currentTarget: { dataset: { id: 'topic-1' } } }
  const pending = p.generateArticle(e)
  await p.generateArticle(e)
  assert.equal(calls, 1)
  assert.equal(p.data.busyIds['topic-1'], true)
  assert.equal(p.data.busyIds['topic-2'], undefined)
  gate.resolve()
  await pending
  assert.equal(p.data.busyIds['topic-1'], false)
})
test('article fetch failure retains article, 404 becomes empty', async () => {
  let status = 500
  const p = instantiate('article', {
    getArticle: async () => {
      const e = Error('failed')
      e.statusCode = status
      throw e
    },
    getMaterials: async () => [],
  })
  Object.assign(p.data, { topicId: 'a', article: { title: 'old' } })
  await p.loadArticle()
  assert.equal(p.data.article.title, 'old')
  assert.ok(p.data.error)
  status = 404
  await p.loadArticle()
  assert.equal(p.data.article, null)
  assert.equal(p.data.error, '')
})
test('article body removes head and copy URL uses shared config', async () => {
  let copied
  const p = instantiate(
    'article',
    {
      getArticle: async () => ({
        html: '<!DOCTYPE html><html><head><title>X</title></head><body><p>正文</p></body></html>',
        createdAt: '2026-11-04T00:00:00Z',
      }),
      getMaterials: async () => [],
    },
    {
      setClipboardData: (o) => {
        copied = o.data
        o.complete()
      },
    },
  )
  p.data.topicId = 'a'
  await p.loadArticle()
  assert.equal(p.data.displayHtml, '<p>正文</p>')
  p.copyURL()
  assert.equal(copied, 'https://example.com/view/a')
  assert.equal(p.data.copying, false)
})
;(async () => {
  let failed = 0
  for (const [name, fn] of tests) {
    try {
      await fn()
      console.log('PASS', name)
    } catch (e) {
      failed++
      console.error('FAIL', name, e)
    }
  }
  process.exitCode = failed ? 1 : 0
})()
