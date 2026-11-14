const fs=require('node:fs'),assert=require('node:assert/strict'),{test}=require('node:test'),ts=require('../backend/node_modules/typescript')
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f)
const {validateLayout}=require('../backend/src/lib/v2/layout.ts')
const {renderArticle}=require('../backend/src/lib/article-presentation.js')
const article={title:'校园 <故事>',body:'第一段：我们相聚。\n\n第二段：记录时光。',images:[{path:'a/photo.jpg',caption:'活动照片',url:'https://fixture.invalid/photo?x="'}]}
const valid='<section style="color:#72351a;background-color:#fff7e8;padding:18px"><p>{{p1}}</p><img src="asset:img1" style="width:100%;height:auto"/><p>{{p2}}</p></section>'
test('AI controls HTML styles without choosing templates; source content is preserved exactly',()=>{
 const html=validateLayout(valid,article);assert.ok(html.includes('color:#72351a'));assert.ok(!html.includes('校园'));assert.ok(html.includes('第一段：我们相聚。'));assert.ok(!html.includes('活动照片'))
 const minimal=validateLayout('<p style="color:#334455">{{p1}}</p><p>{{p2}}</p><img src="asset:img1"/>',article)
 assert.notEqual(html,minimal);assert.ok(!minimal.includes('border'))
 const rendered=renderArticle({...article,layout:{bodyOnly:true,html}});assert.ok(!rendered.includes('asset:'));assert.ok(rendered.includes('&quot;'))
})
test('rejects omitted/duplicated/reordered paragraphs, extra facts and bad image references',()=>{
 for(const html of [valid.replace('{{p2}}',''),valid.replace('{{p2}}','{{p1}}'),valid.replace('{{p1}}','{{p2}}').replace(/<p>\{\{p2\}\}<\/p><\/section>/,'<p>{{p1}}</p></section>'),valid.replace('{{p1}}','据悉有100人参与{{p1}}'),valid.replace('asset:img1','https://evil.invalid/photo'),valid.replace('asset:img1','asset:img2'),valid.replace('{{p1}}','{{p<span>1</span>}}')])assert.throws(()=>validateLayout(html,article),e=>e.code==='LAYOUT_INVALID')
})
test('drops event attributes and dangerous CSS and rejects active/raw-text elements',()=>{
 const html=validateLayout(valid.replace('<section style="','<section onclick="alert(1)" style="position:fixed;display:none;background-image:url(https://evil.invalid);').replace('<img src=','<img onerror="x" src='),article)
 assert.ok(!/onclick|onerror|position|display:none|url\(/.test(html))
 for(const tag of ['script','style','svg','iframe','textarea','xmp','object'])assert.throws(()=>validateLayout(valid+`<${tag}>{{p1}}</${tag}>`,article))
})
test('optional captions can only reference existing descriptions once',()=>{
 assert.ok(validateLayout(valid.replace('<p>{{p2}}','<p>{{c1}}</p><p>{{p2}}'),article).includes('活动照片'))
 assert.throws(()=>validateLayout(valid.replace('<p>{{p2}}','<p>{{c2}}</p><p>{{p2}}'),article))
 assert.throws(()=>validateLayout(valid.replace('<p>{{p2}}','<p>{{c1}}{{c1}}</p><p>{{p2}}'),article))
})
test('oversized/deep HTML is rejected; renderer mirror matches mini program',()=>{
 assert.throws(()=>validateLayout('x'.repeat(100001),article))
 assert.throws(()=>validateLayout('<section>'.repeat(30)+valid+'</section>'.repeat(30),article))
 assert.equal(fs.readFileSync(require.resolve('../backend/src/lib/article-presentation.js'),'utf8'),fs.readFileSync(require.resolve('../miniprogram/utils/ai-article.js'),'utf8'))
})
test('AI can create contextual kicker labels from source excerpts without adding facts',()=>{
 const input=valid.replace('<p>{{p1}}','<p style="background:#f4dfbb">{{s:我们}}</p><p>{{p1}}').replace('<p>{{p2}}','<p>{{s:记录时光}}</p><p>{{p2}}')
 const html=validateLayout(input,article)
 assert.ok(html.includes('background:#f4dfbb'));assert.ok(html.includes('记录时光'))
 assert.throws(()=>validateLayout(input.replace('{{s:我们}}','{{s:百年名校}}'),article))
 assert.throws(()=>validateLayout(input.replace('{{s:记录时光}}','{{s:我们}}'),article))
})
test('safe gradients and shadows survive; arbitrary URLs and unsafe CSS are removed',()=>{
 const html=validateLayout(valid.replace('padding:18px','padding:18px;background-image:linear-gradient(to right, #ffffff, #f4dfbb);box-shadow:0 4px 20px #00000018'),article)
 assert.ok(html.includes('linear-gradient(to right'));assert.ok(html.includes('box-shadow:0 4px 20px #00000018'))
 const bad=validateLayout(valid.replace('padding:18px','padding:18px;background-image:url(https://evil.invalid);box-shadow:expression(alert(1))'),article)
 assert.ok(!bad.includes('evil.invalid'));assert.ok(!bad.includes('expression'))
})
test('article title is metadata only and never enters copied body HTML',()=>{
 assert.throws(()=>validateLayout(valid.replace('<p>{{p1}}','<p>{{title}}</p><p>{{p1}}'),article))
 assert.throws(()=>validateLayout(valid.replace('<p>{{p1}}','<p>{{s:校园}}</p><p>{{p1}}'),article))
 const plain=renderArticle(article);assert.ok(!plain.includes(article.title));assert.ok(!plain.includes('<h1'))
 const html=validateLayout(valid,article);assert.ok(!html.includes('校园'))
 const rendered=renderArticle({...article,layout:{bodyOnly:true,html}});assert.equal(rendered.includes('<h1'),false)
 // Earlier experimental title-containing designs must not leak into body-only exports.
 assert.ok(!renderArticle({...article,layout:{html:'<h1>校园 &lt;故事&gt;</h1>'}}).includes('<h1'))
})
test('decorative numbering may reuse existing list ordinals without allowing invented statistics',()=>{
 const numbered={title:'清单',body:'1. 第一点。\n\n2. 第二点。',images:[]}
 const html=validateLayout('<h2><span>1</span>{{s:第一点}}</h2><p>{{p1}}</p><h2><span>2</span>{{s:第二点}}</h2><p>{{p2}}</p>',numbered)
 assert.ok(html.includes('<span>1</span>'))
 assert.throws(()=>validateLayout('<span>99</span><p>{{p1}}</p><p>{{p2}}</p>',numbered))
 assert.throws(()=>validateLayout('<span>1</span><span>1</span><p>{{p1}}</p><p>{{p2}}</p>',numbered))
})
