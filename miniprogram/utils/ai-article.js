// Mirrored into miniprogram/utils/ai-article.js; checked by the layout tests.
function escapeHtml(value) {return String(value || '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderArticle(article) {
 if(article.layout && article.layout.bodyOnly === true && article.layout.html) {
  return article.layout.html.replace(/src="asset:img([1-9]\d*)"/g,(_all,index)=>{
   const img=(article.images||[])[Number(index)-1]
   return img&&/^https?:\/\//i.test(img.url||'')?'src="'+escapeHtml(img.url)+'"':'alt="图片暂时无法加载"'
  })
 }
 // Unformatted originals have readable typography, without any decorative template.
 const paragraphs=String(article.body||'').replace(/\r\n?/g,'\n').split(/\n\s*\n/).filter(p=>p.trim())
 const images=article.images||[],slots=paragraphs.map(()=>[])
 images.forEach((img,i)=>{if(slots.length)slots[Math.min(slots.length-1,Math.floor((i+1)*slots.length/(images.length+1)))].push(img)})
 const photo=img=>/^https?:\/\//i.test(img.url||'')?'<p style="margin:20px 0;"><img src="'+escapeHtml(img.url)+'" style="width:100%;height:auto;"/></p>':''
 return '<section style="font-size:16px;line-height:1.9;color:#333;overflow-wrap:break-word;">'+paragraphs.map((p,i)=>'<p style="margin:18px 0;">'+escapeHtml(p).replace(/\n/g,'<br/>')+'</p>'+slots[i].map(photo).join('')).join('')+(paragraphs.length?'':images.map(photo).join(''))+'</section>'
}
module.exports={renderArticle}
