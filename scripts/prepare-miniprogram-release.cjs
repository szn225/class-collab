// Builds a clean release from registered pages and their runtime dependencies.
// No local device storage, backend credentials, tests or legacy pages are copied.
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const root = path.resolve(__dirname, '..')
const src = path.join(root, 'miniprogram')
const version = process.argv[2] || require('../miniprogram/config/release.json').version
assert.match(version, /^\d+\.\d+\.\d+$/)
const target = fs.mkdtempSync('/private/tmp/hui-miniprogram-' + version + '-')
const app = JSON.parse(fs.readFileSync(path.join(src, 'app.json'), 'utf8'))
assert.equal(app.pages[0], 'pages/home/index')
assert.ok(app.pages.includes('pages/account/index'))
assert.ok(app.pages.includes('pages/co-create/index'))
assert.equal(app.subPackages.find(p => p.root === 'packages/grades').pages.length, 6)
function copy(relative) {
 const from = path.join(src, relative), to = path.join(target, relative)
 if (fs.statSync(from).isDirectory()) {
  for (const name of fs.readdirSync(from)) {
   if (['__tests__', 'node_modules', 'typings'].includes(name)) continue
   copy(path.join(relative, name))
  }
  return
 }
 assert.ok(/\.(js|ts|json|wxml|wxss|wxs|svg|png|jpg|woff2?)$/.test(relative), 'Unexpected release file: ' + relative)
 assert.ok(!relative.endsWith('.test.ts') && !relative.endsWith('.local'))
 fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to)
}
for (const name of ['app.js', 'app.json', 'app.wxss', 'sitemap.json', 'project.config.json', 'styles', 'components/app-nav', 'components/ui-icon', 'assets/ui', 'assets/redesign', 'config', 'utils/v2.js', 'utils/grades.js', 'utils/auth.js']) copy(name)
for (const page of app.pages) copy(path.dirname(page))
for (const pack of app.subPackages) copy(pack.root)
const configFile = path.join(target, 'project.config.json')
const config = JSON.parse(fs.readFileSync(configFile, 'utf8'))
assert.equal(config.appid, 'wxfd53c8b15bc8fa51'); assert.equal(config.setting.urlCheck, true)
config.projectname = '慧共创整合版' + version
fs.writeFileSync(configFile, JSON.stringify(config, null, 2) + '\n')
const manifest = { version, appid: config.appid, entry: app.pages[0], pages: app.pages, subPackages: app.subPackages, files: {} }
function inventory(directory) {
 for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
  const file = path.join(directory, entry.name)
  if (entry.isDirectory()) inventory(file)
  else manifest.files[path.relative(target, file)] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
 }
}
inventory(target)
// Fail the package build if a registered screen lost a stylesheet or local image.
for (const relative of Object.keys(manifest.files)) {
 const file = path.join(target, relative)
 if (relative.endsWith('.wxss')) {
  for (const match of fs.readFileSync(file, 'utf8').matchAll(/@import\s+["']([^"']+)/g)) {
   assert.ok(fs.existsSync(path.resolve(path.dirname(file), match[1])), 'Missing packaged stylesheet: ' + relative + ' -> ' + match[1])
  }
 }
 if (relative.endsWith('.wxml')) {
  for (const match of fs.readFileSync(file, 'utf8').matchAll(/src="(\/assets\/[^"{]+)"/g)) {
   assert.ok(fs.existsSync(path.join(target, match[1])), 'Missing packaged image: ' + match[1])
  }
 }
}
const output = path.join(root, 'docs/device-test/release-' + version)
fs.mkdirSync(output, { recursive: true })
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
fs.writeFileSync(path.join(root, 'backend/miniprogram-release-path.local'), target, { mode: 0o600 })
console.log(JSON.stringify({ target, version, appid: manifest.appid, entry: manifest.entry, files: Object.keys(manifest.files).length, subPackages: app.subPackages.length }))
