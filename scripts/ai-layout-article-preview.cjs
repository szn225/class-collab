// Local article trial using the existing provider. No production database access.
const fs=require('node:fs'),path=require('node:path'),{parseEnv}=require('node:util'),ts=require('../backend/node_modules/typescript')
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f)
const {layoutSource,layoutInstructions,validateLayout}=require('../backend/src/lib/v2/layout.ts')
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
async function main(){
 const sourceFile=path.resolve(process.argv[2]),out=path.dirname(sourceFile),article=JSON.parse(fs.readFileSync(sourceFile,'utf8'))
 const env={...parseEnv(fs.readFileSync(path.resolve(__dirname,'../backend/.env.local'),'utf8')),...process.env},key=env.WRITING_API_KEY||env.DEEPSEEK_API_KEY
 if(!key)throw Error('No configured writing credentials')
 const source=layoutSource(article),payload={title:source.title,paragraphs:source.paragraphs.map((text,i)=>({id:'p'+(i+1),text})),images:article.images.map((img,i)=>({id:'img'+(i+1),caption:img.caption,description:img.description})),request:'请运用你的审美，根据正文和四张配图自主决定适合的商务观点文章排版。颜色、布局、原文短语小标题、重点段落和图片处理由你判断。不改写原文。标题仅供理解主题，不进入正文。图片说明是对用户所给图片的客观描述，由助理根据图片整理，不是新增正文。'}
 let data
 if(process.argv.includes('--reuse')){const saved=JSON.parse(fs.readFileSync(path.join(out,'model-result.json'),'utf8'));data={model:saved.model,usage:saved.usage,choices:[{message:{content:saved.content},finish_reason:saved.finishReason}]}}else{
 const response=await fetch(env.WRITING_API_URL||'https://api.deepseek.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:env.WRITING_MODEL||'deepseek-flash',messages:[{role:'system',content:layoutInstructions},{role:'user',content:JSON.stringify(payload)}],max_tokens:12000,temperature:.5,stream:false,thinking:{type:'disabled'},response_format:{type:'json_object'}}),signal:AbortSignal.timeout(180000)})
 if(!response.ok)throw Error('Provider HTTP '+response.status)
 data=await response.json()
 }
 fs.writeFileSync(path.join(out,'model-result.json'),JSON.stringify({model:data.model,usage:data.usage,finishReason:data.choices?.[0]?.finish_reason,content:data.choices?.[0]?.message?.content},null,2)+'\n')
 if(data.choices?.[0]?.finish_reason==='length')throw Error('Provider output truncated')
 const parsed=JSON.parse(data.choices[0].message.content.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'')),html=validateLayout(parsed.html,article)
 const placeholders=process.argv.includes('--placeholders')
 const body=placeholders?html.replace(/<img\b[^>]*src="asset:img([1-9]\d*)"[^>]*\/?>/g,(_all,index)=>'<section style="background-color:#e8f0f8;border:1px solid #d3e1ee;padding:52px 16px;text-align:center;border-radius:6px;"><p style="margin:0;color:#59758e;font-size:14px;line-height:1.8;">配图'+index+'占位</p></section>'):html.replace(/src="asset:img([1-9]\d*)"/g,(_all,index)=>{const image=article.images[Number(index)-1];const bytes=fs.readFileSync(path.resolve(out,image.path));return 'src="data:image/png;base64,'+bytes.toString('base64')+'"'})
 fs.writeFileSync(path.join(out,'body.html'),body)
 fs.writeFileSync(path.join(out,'layout.json'),JSON.stringify({html,bodyOnly:true,designPlan:parsed.designPlan,summary:parsed.summary,model:data.model,usage:data.usage},null,2)+'\n')
 const adapter=fs.readFileSync(path.resolve(__dirname,'../backend/src/lib/wechat-export.js'),'utf8')
 const downloads=placeholders?'':article.images.map((img,i)=>`<a download="配图${i+1}.png" href="${esc(img.path)}">下载配图${i+1}</a>`).join(' · ')
 const document=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(article.title)} · AI排版预览</title><style>body{margin:0;background:#f1f3f5;color:#222;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}main{max-width:680px;margin:24px auto;background:white}header{padding:24px 24px 18px;border-bottom:1px solid #eee}h1{font-size:23px;line-height:1.5;margin:0 0 18px;font-weight:600}button{padding:10px 18px;background:#202e40;color:white;border:0;border-radius:5px;font-size:14px;cursor:pointer}#status,.downloads{font-size:12px;color:#68707a;margin:10px 0 0;line-height:1.6}#article-content{overflow-wrap:break-word}#article-content img{max-width:100%;height:auto}@media(max-width:700px){main{margin:0}header{padding:22px 20px}}</style><main><header><h1>${esc(article.title)}</h1><button id="copy">复制公众号正文</button><p id="status">${placeholders?'标题不参与复制。四处配图已改为占位色块，正文与复制采用相同间距。':'标题不参与复制。图片已内嵌；若公众号未自动转存，请用下方原图上传替换。'}</p><p class="downloads">${downloads}</p></header><article id="article-content">${body}</article></main><script>${adapter}</script><script>
 const article=document.getElementById('article-content');
 // The preview and clipboard use the same spacing and explicit type styles.
 article.innerHTML=WeChatExport.prepareWeChatArticle(article).html;
 document.getElementById('copy').onclick=async()=>{const status=document.getElementById('status');try{await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([article.innerHTML],{type:'text/html'}),'text/plain':new Blob([article.innerText],{type:'text/plain'})})]);status.textContent=${placeholders?JSON.stringify('正文与占位色块已复制，请粘贴到公众号草稿核对间距。'):JSON.stringify('正文已复制，包含内嵌图片。请等待公众号处理图片；若未显示，请下载原图并在对应位置上传。')}}catch{const r=document.createRange();r.selectNodeContents(article);const s=getSelection();s.removeAllRanges();s.addRange(r);status.textContent='正文已选中，请按 Cmd+C / Ctrl+C 复制。图片未转存时请用原图上传。'}};
 </script></html>`
 fs.writeFileSync(path.join(out,'preview.html'),document)
 console.log(JSON.stringify({valid:true,model:data.model,usage:data.usage,paragraphs:source.paragraphs.length,images:source.images.length,summary:parsed.summary,preview:path.join(out,'preview.html')}))
}
main().catch(e=>{console.error(e.name+': '+e.message);process.exitCode=1})
