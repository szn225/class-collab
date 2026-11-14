// One isolated synthetic article; never accesses or changes production state.
const fs=require('node:fs'),path=require('node:path'),{parseEnv}=require('node:util'),ts=require('../backend/node_modules/typescript')
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f)
const {layoutSource,layoutInstructions,validateLayout}=require('../backend/src/lib/v2/layout.ts'),{renderArticle}=require('../backend/src/lib/article-presentation.js')
async function main(){
 const env={...parseEnv(fs.readFileSync(path.resolve(__dirname,'../backend/.env.local'),'utf8')),...process.env}
 const key=env.WRITING_API_KEY||env.DEEPSEEK_API_KEY;if(!key)throw Error('No configured writing credentials')
 const article={title:'把秋天装进我们的观察册',body:'【虚构排版测试样例】秋日午后，同学们带着观察册来到校园。树叶、光影与微风，成为大家共同记录的主题。\n\n有人蹲下观察落叶的纹理，有人画下枝头的轮廓，也有人把身边的发现写成一句短诗。大家用不同的方式，留下各自眼中的秋天。\n\n分享时，观察册在同学们手中传阅。每个人的小小发现汇在一起，组成了这一页共同的校园记忆。',images:[{path:'fixture-image',caption:'',url:'https://example.invalid/fixture.jpg'}]}
 const source=layoutSource(article),payload={title:source.title,paragraphs:source.paragraphs.map((text,i)=>({id:'p'+(i+1),text})),images:[{id:'img1',caption:'',context:'校园落叶观察活动',description:'未识图，不可猜测画面'}],request:'请自主决定适合这篇文章的正文设计。标题不进入正文，图片是否加框由你判断。'}
 const response=await fetch(env.WRITING_API_URL||'https://api.deepseek.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:env.WRITING_MODEL||'deepseek-flash',messages:[{role:'system',content:layoutInstructions},{role:'user',content:JSON.stringify(payload)}],max_tokens:8000,temperature:.5,stream:false,thinking:{type:'disabled'},response_format:{type:'json_object'}}),signal:AbortSignal.timeout(90000)})
 if(!response.ok)throw Error('Provider HTTP '+response.status)
 const data=await response.json();if(data.choices?.[0]?.finish_reason==='length')throw Error('Provider output truncated')
 const parsed=JSON.parse(data.choices[0].message.content.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'')),html=validateLayout(parsed.html,article)
 const output=path.resolve(__dirname,'../docs/device-test/ai-layout');fs.mkdirSync(output,{recursive:true})
 fs.writeFileSync(path.join(output,'live-layout.json'),JSON.stringify({article,html,rawHtml:parsed.html,designPlan:parsed.designPlan,summary:parsed.summary},null,2)+'\n')
 // Local neutral placeholder instead of downloading or publishing any real image.
 const view=renderArticle({...article,layout:{bodyOnly:true,html}}).replace(/<img [^>]*\/>/g,'<div style="padding:45px 12px;background:#eee;text-align:center;color:#777;">测试配图占位</div>')
 fs.writeFileSync(path.join(output,'live-sample.html'),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI自由排版测试样例</title><body style="margin:0;padding:20px;background:#eee;"><main style="max-width:560px;margin:auto;background:white;">'+view+'</main></body></html>')
 fs.writeFileSync(path.join(output,'live-check.json'),JSON.stringify({model:data.model,usage:data.usage,summary:parsed.summary,designPlan:parsed.designPlan,valid:true,fixture:true},null,2)+'\n')
 console.log(JSON.stringify({valid:true,model:data.model,usage:data.usage,htmlBytes:Buffer.byteLength(html),designPlan:parsed.designPlan,summary:parsed.summary}))
}
main().catch(e=>{console.error(e.name+': '+e.message);process.exitCode=1})
