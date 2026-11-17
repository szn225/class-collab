import StyledArticle from './styled-article'
import { readState } from '@/lib/v2/store'
import { publicArticle } from '@/lib/v2/public-article'
import { signedImage } from '@/lib/v2/storage'
import CopyArticle from '../../view/[topicId]/copy-article'
export const dynamic='force-dynamic'
export const revalidate=0
export const metadata={title:'慧共创 · 文章',robots:{index:false,follow:false}}
export default async function SharedArticle({params}:{params:{token:string}}){
 try{
  const v=publicArticle(await readState(),params.token)
  if(!v)return <main className="preview-shell"><h1>文章链接已失效</h1><p>请联系分享者获取新链接。</p></main>
  const images=await Promise.all(v.images.map(async(img:any)=>({...img,url:await signedImage(img.path,300)})))
  return <main className="preview-shell"><div className="preview-brand">慧共创</div><StyledArticle title={v.title} body={v.body} images={images} layout={v.layout}/><CopyArticle/></main>
 }catch{return <main className="preview-shell"><h1>暂时无法加载</h1><p>请稍后刷新重试。</p></main>}
}
