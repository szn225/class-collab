// Guards against the undersized local overrides that caused the 2.3.0 regression.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const root=path.resolve(__dirname,'../miniprogram'),app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8')),seen=new Set(),styles=new Set()
function style(file){if(styles.has(file))return;styles.add(file);const src=fs.readFileSync(file,'utf8');for(const match of src.matchAll(/@import\s+["']([^"']+)/g))style(path.resolve(path.dirname(file),match[1]));for(const m of src.matchAll(/font-size\s*:\s*([\d.]+)(rpx|px)/g)){const px=Number(m[1])/(m[2]==='rpx'?2:1);assert.ok(px>=15,`${path.relative(root,file)} has ${m[0]}`)}}
function component(base){if(seen.has(base)||base.includes('miniprogram_npm'))return;seen.add(base);style(base+'.wxss');const cfg=JSON.parse(fs.readFileSync(base+'.json','utf8'));for(const rel of Object.values(cfg.usingComponents||{}))component(rel.startsWith('/')?path.join(root,rel):path.resolve(path.dirname(base),rel))}
style(path.join(root,'app.wxss'))
for(const page of [...app.pages,...app.subPackages.flatMap(p=>p.pages.map(v=>p.root+'/'+v))])component(path.join(root,page))
const tokens=JSON.parse(fs.readFileSync(path.join(root,'packages/grades/styles/design-tokens.json'),'utf8')),css=fs.readFileSync(path.join(root,'packages/grades/styles/design-tokens.wxss'),'utf8')
for(const [k,n] of Object.entries({xs:15,sm:15,base:17,lg:20,xl:24,'2xl':28,'3xl':34,'4xl':40})){assert.equal(tokens.font.size[k].value,n+'px');assert.match(css,new RegExp('--text-'+k+':\\s*'+n+'px'))}
function l(hex){const a=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722}
for(const [fg,bg] of [['#263B37','#FAFAF7'],['#65736B','#FAFAF7'],['#4D6B82','#EDF2F7'],['#855C35','#F7F0E6'],['#756683','#F0EDF5'],['#FFFFFF','#245D50']]){const a=[l(fg),l(bg)].sort((a,b)=>a-b);assert.ok((a[1]+.05)/(a[0]+.05)>=4.5,fg+' on '+bg)}
console.log(`PASS ${styles.size} active styles: no body/UI font below 15px; role tokens match; six semantic text/background pairs meet 4.5:1`)
