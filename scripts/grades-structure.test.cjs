const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const root=path.resolve(__dirname,'../miniprogram'),config=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'))
assert.equal(config.pages[0],'pages/home/index');assert.ok(!config.tabBar)
const routes=new Set([...config.pages,...config.subPackages.flatMap(p=>p.pages.map(page=>p.root+'/'+page))])
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','typings'].includes(entry.name))continue;const file=path.join(dir,entry.name);if(entry.isDirectory()){walk(file);continue}const source=fs.readFileSync(file,'utf8')
 if(file.endsWith('.wxss'))for(const match of source.matchAll(/@import\s+['"]([^'"]+)/g))assert.ok(fs.existsSync(path.resolve(path.dirname(file),match[1])),'Missing WXSS: '+file+' -> '+match[1])
 if(file.endsWith('.json')&&path.basename(file)!=='app.json'&&Object.prototype.hasOwnProperty.call(JSON.parse(source),'usingComponents'))assert.ok(fs.existsSync(file.slice(0,-5)+'.wxml'),'Non-page JSON incorrectly declares components: '+file)
 if(file.endsWith('.json')&&!file.includes(path.sep+'data'+path.sep))for(const target of Object.values(JSON.parse(source).usingComponents||{})){const component=target.startsWith('/')?path.join(root,target):path.resolve(path.dirname(file),target);assert.ok(fs.existsSync(component+'.json'),'Missing component '+component)}
 if(file.endsWith('.ts')&&!file.includes('__tests__')&&file.includes('packages/grades')){assert.ok(!source.includes('wx.switchTab('),'Grades must use internal routes');if(!file.includes(path.sep+'datasource'+path.sep))assert.ok(!/wx\.(getStorageSync|setStorageSync|removeStorageSync)\(/.test(source),'Unscoped grade storage in '+file)}
 if(/\.(?:js|ts)$/.test(file)&&(file.includes(path.sep+'utils'+path.sep)||file.includes('packages/grades')||routes.has(path.relative(root,file).replace(/\.(?:js|ts)$/,''))))for(const match of source.matchAll(/(?:url:|pagePath:)\s*['"`]\/(pages\/[^'"`?]+|packages\/grades\/pages\/[^'"`?]+)/g))assert.ok(routes.has(match[1]),'Unknown route '+match[1])
}}
walk(root);for(const route of routes)for(const ext of ['.json','.wxml','.wxss'])assert.ok(fs.existsSync(path.join(root,route+ext)),route+ext)
console.log('PASS registered pages, component imports, styles, internal navigation and scoped storage')
