// Browser-only export adapter. Keeps AI design choices; normalizes clipboard HTML.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.WeChatExport=api})(typeof window!=='undefined'?window:null,function(){
 const blocks=new Set(['SECTION','DIV','P','H2','H3','BLOCKQUOTE'])
 const typography=['font-size','font-family','font-weight','font-style','line-height','letter-spacing','color','text-align']
 function prepareWeChatArticle(article){
  const copy=article.cloneNode(true),original=[article,...article.querySelectorAll('*')],clones=[copy,...copy.querySelectorAll('*')]
  for(let i=0;i<clones.length;i++){
   const node=clones[i],source=original[i],computed=getComputedStyle(source)
   typography.forEach(key=>{const value=computed.getPropertyValue(key);if(value)node.style.setProperty(key,value)})
   // All nodes carry their own type styles, so editor defaults do not take over.
   node.removeAttribute('id');node.removeAttribute('class');node.removeAttribute('contenteditable')
   if(blocks.has(node.tagName)){node.style.setProperty('margin','0');node.dataset.exportTop=String(Math.max(0,parseFloat(computed.marginTop)||0));node.dataset.exportBottom=String(Math.max(0,parseFloat(computed.marginBottom)||0))}
   if(node.tagName==='IMG'){node.style.setProperty('display','block');node.style.setProperty('max-width','100%');node.style.setProperty('height','auto');node.removeAttribute('loading');node.removeAttribute('srcset')}
  }
  function normalize(parent){
   for(const text of [...parent.childNodes]){
    if(text.nodeType===3&&!text.textContent.trim()&&/[\r\n\t]/.test(text.textContent))text.remove()
   }
   let previousBottom=0,lastBlock=null
   for(let node of [...parent.children]){
    normalize(node)
    if(blocks.has(node.tagName)){
     const gap=Math.min(16,Math.max(previousBottom,Number(node.dataset.exportTop)||0))
     node.style.paddingTop=((parseFloat(node.style.paddingTop)||0)+gap)+'px'
     previousBottom=Number(node.dataset.exportBottom)||0;lastBlock=node
     delete node.dataset.exportTop;delete node.dataset.exportBottom
     // section is a more stable container for WeChat's paste handling.
     if(node.tagName==='DIV'){const section=document.createElement('section');for(const attr of [...node.attributes])section.setAttribute(attr.name,attr.value);while(node.firstChild)section.appendChild(node.firstChild);node.replaceWith(section);lastBlock=section}
    }
   }
   if(lastBlock&&previousBottom)lastBlock.style.paddingBottom=((parseFloat(lastBlock.style.paddingBottom)||0)+Math.min(16,previousBottom))+'px'
  }
  normalize(copy);delete copy.dataset.exportTop;delete copy.dataset.exportBottom
  const unresolved=[]
  for(const img of copy.querySelectorAll('img')){
   const src=img.getAttribute('src')||''
   if(!/^(?:data:image\/(?:png|jpeg|webp);base64,|https:\/\/)/i.test(src))unresolved.push(src)
  }
  return {html:'<section style="margin:0;padding:0;">'+copy.innerHTML+'</section>',text:article.innerText,localImages:unresolved.length,hasImages:copy.querySelectorAll('img').length>0}
 }
 return {prepareWeChatArticle}
})
