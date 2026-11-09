const fs = require('node:fs'),
  vm = require('node:vm'),
  assert = require('node:assert/strict')
const root = require('node:path').resolve(__dirname, '..')
const ts = require(root + '/backend/node_modules/typescript')
let app, dispatch
const moduleObject = { exports: {} }
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync(root + '/miniprogram/utils/api.js', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
  {
    module: moduleObject,
    exports: moduleObject.exports,
    getApp: () => app,
    wx: { request: (options) => dispatch(options), showToast() {} },
  },
)
const { api, networkError } = moduleObject.exports
async function main() {
  for (const [raw, expected] of [
    ['request:fail url not in domain list', '域名'],
    ['request:fail timeout', '超时'],
    ['request:fail ssl certificate error', '安全连接'],
    ['request:fail net::ERR_CONNECTION_RESET', '切换网络'],
  ]) {
    const e = networkError({ errMsg: raw, errno: 1 })
    assert.ok(e.message.includes(expected))
    assert.equal(e.diagnostic, raw)
    assert.equal(e.errno, 1)
    console.log('PASS network failure:', expected)
  }
  app = { globalData: { baseUrl: 'https://example.com' } }
  dispatch = (o) => {
    assert.equal(o.url, 'https://example.com/api/auth')
    o.success({ statusCode: 200, data: { ok: true, data: { id: 'test' } } })
  }
  assert.equal((await api.login('test')).id, 'test')
  console.log('PASS successful request resolves app after initialization')
  dispatch = (o) =>
    o.success({ statusCode: 503, data: { ok: false, error: '数据服务暂时不可用，请稍后重试' } })
  await assert.rejects(
    api.login('test'),
    (e) => e.statusCode === 503 && e.message.includes('数据服务'),
  )
  console.log('PASS backend error preserved')
  dispatch = (o) => o.success({ statusCode: 403, data: '<html>blocked</html>' })
  await assert.rejects(
    api.login('test'),
    (e) => e.statusCode === 403 && e.message.includes('HTTP 403'),
  )
  console.log('PASS non-JSON HTTP error identified')
  dispatch = (o) => o.fail({ errMsg: 'request:fail timeout' })
  await assert.rejects(api.login('test'), (e) => e.message.includes('超时'))
  console.log('PASS request failure normalized')
  let page
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(root + '/miniprogram/pages/index/index.js', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    {
      exports: {},
      require: () => ({
        api: {
          login: async () => {
            throw new Error('连接服务器超时，请切换网络后重试')
          },
        },
      }),
      Page: (p) => (page = p),
      console: { error() {} },
    },
  )
  page.setData = function (d) {
    Object.assign(this.data, d)
  }
  page.data.name = '测试'
  await page.handleLogin()
  assert.equal(page.data.error, '连接服务器超时，请切换网络后重试')
  assert.equal(page.data.loading, false)
  console.log('PASS login UI shows actual failure and unlocks')
}
main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
