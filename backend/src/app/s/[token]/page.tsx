import { readState } from '@/lib/v2/store'
import { hash } from '@/lib/v2/model'
import { signedImage } from '@/lib/v2/storage'
import CopyArticle from '../../view/[topicId]/copy-article'
export const dynamic='force-dynamic'
export const revalidate=0
export const metadata={title:'慧共创 · 文章',robots:{index:false,follow:false}}
export default async function SharedArticle({params}:{params:{token:string}}){
 try{
  const s=await readState(),a=s.activities.find(a=>a.shareHash===hash(params.token)),v=a?.versions.find((v:any)=>v.id===a.shareVersion)
  if(!v)return <main className="preview-shell"><h1>文章链接已失效</h1><p>请联系分享者获取新链接。</p></main>
  const images=await Promise.all(v.images.map(async(img:any)=>({...img,url:await signedImage(img.path,300)})))
  return <main className="preview-shell"><div className="preview-brand">慧共创</div><article className="article-paper" id="article-content"><h1 style={{fontSize:26,lineHeight:1.5,marginBottom:24}}>{v.title}</h1>{v.body.split(/\n\s*\n/).map((p:string,i:number)=><p key={i} style={{fontSize:16,lineHeight:2,margin:'16px 0',whiteSpace:'pre-wrap'}}>{p}</p>)}{images.map((img:any)=><figure key={img.path} style={{margin:'24px 0'}}><img src={img.url} alt={img.caption||'活动照片'} style={{width:'100%',borderRadius:4}}/>{img.caption?<figcaption style={{fontSize:13,textAlign:'center',color:'#7a8376'}}>{img.caption}</figcaption>:null}</figure>)}</article><CopyArticle/></main>
 }catch{return <main className="preview-shell"><h1>暂时无法加载</h1><p>请稍后刷新重试。</p></main>}
}
