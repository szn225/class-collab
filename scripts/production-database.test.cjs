const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')
const assert = require('node:assert/strict')
const root = process.env.CLASS_COLLAB_ROOT || path.resolve(__dirname, '..')
const ts = require(path.join(root, 'backend/node_modules/typescript'))
let mockCalls = 0
const database = new Proxy({}, { get: () => async () => { throw new Error('Database unavailable') } })
const demo = new Proxy({}, { get: () => () => { mockCalls++; throw new Error('Production used demo data') } })
function load(route) {
  const filename = path.join(root, 'backend/src/app/api', route, 'route.ts')
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const module = { exports: {} }
  const requireStub = name => name === 'next/server' ? { NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) } } : name === '@/lib/mock' ? demo : name === '@/lib/supabase' ? database : {}
  vm.runInNewContext(code, { module, exports: module.exports, require: requireStub, process: { env: { NODE_ENV: 'production' } }, console: { error() {}, warn() {} } })
  return module.exports
}
async function main() {
  const request = { nextUrl: { searchParams: new URLSearchParams({ userId: 'u', topicId: 't' }) }, json: async () => ({ name: '测试', title: '活动', topicId: 't', userId: 'u', type: 'text', content: '文字' }) }
  for (const [route, method] of [['auth','POST'], ['topics','GET'], ['topics','POST'], ['materials','GET'], ['materials','POST'], ['topics/[id]','GET'], ['topics/[id]','PATCH'], ['generate','POST'], ['article','GET']]) {
    const result = await load(route)[method](request, { params: { id: 't' } })
    assert.equal(result.status, 503, `${method} ${route} should fail closed`)
    assert.equal(result.body.ok, false)
    console.log(`PASS production database outage: ${method} /api/${route}`)
  }
  assert.equal(mockCalls, 0)
  const health = await load('health').GET()
  assert.equal(health.status, 503)
  assert.equal(health.body.database, 'unavailable')
  console.log('PASS health endpoint reports database outage without demo fallback')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
