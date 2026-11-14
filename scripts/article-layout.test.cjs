const {test}=require('node:test')
const assert=require('node:assert/strict')
const {articleLayout}=require('../miniprogram/utils/article-layout')
test('photos appear between paragraphs, in author order, without dropping text',()=>{
 const html=articleLayout('第一段\n\n第二段\n\n第三段\n\n最后一段',[{url:'https://example.com/1'},{url:'https://example.com/2'}])
 assert.ok(html.indexOf('第二段')<html.indexOf('https://example.com/1'))
 assert.ok(html.indexOf('https://example.com/1')<html.indexOf('第三段'))
 assert.ok(html.indexOf('https://example.com/2')<html.indexOf('最后一段'))
 assert.equal((html.match(/<img /g)||[]).length,2)
})
test('caption matching places photo with related text',()=>{
 const html=articleLayout('开场\n\n接力赛的精彩时刻\n\n结束',[{url:'https://example.com/race',caption:'接力赛'}])
 assert.ok(html.indexOf('接力赛的精彩时刻')<html.indexOf('<img '))
 assert.ok(html.indexOf('<img ')<html.indexOf('结束'))
})
test('formats headings and quotes and escapes source HTML and URL attributes',()=>{
 const html=articleLayout('## 小标题\n\n> 引用\n\n<script>alert(1)</script>',[{url:'javascript:alert(1)'},{url:'https://example.com/" onerror="x',caption:'<img>'}])
 assert.ok(html.includes('<h2 '));assert.ok(html.includes('&lt;script&gt;'))
 assert.ok(!html.includes('javascript:'));assert.ok(!html.includes(' onerror="'))
 assert.ok(html.includes('&lt;img&gt;'))
})
test('empty and image only articles render safely',()=>{
 assert.ok(articleLayout(''))
 assert.equal((articleLayout('',[{url:'https://example.com/a'}]).match(/<img /g)||[]).length,1)
})
test('all themes decorate plain articles and preserve source content',()=>{
 const {articleThemes}=require('../miniprogram/utils/article-layout')
 const body='开场文字\n\n正文内容\n\n最后段落'
 const images=[{url:'https://example.com/photo',caption:'真实说明'}]
 const before=JSON.stringify(images)
 for(const theme of articleThemes){
  const html=articleLayout(body,images,{title:'故事标题',theme:theme.id})
  for(const text of ['故事标题','开场文字','正文内容','最后段落','真实说明','卷首','END'])assert.ok(html.includes(text))
  assert.ok(html.includes(theme.color));assert.ok(html.includes(theme.light));assert.ok(html.includes(theme.label))
 }
 assert.equal(JSON.stringify(images),before)
 assert.equal(articleLayout(body,[],{theme:'missing'}),articleLayout(body))
})
test('recognizes existing Chinese headings without inventing new ones',()=>{
 const html=articleLayout('开场\n\n一、阳光下相遇\n\n大家来到操场。')
 assert.equal((html.match(/<h2 /g)||[]).length,1)
 assert.ok(html.includes('CHAPTER 01'))
})
