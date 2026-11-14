'use client'
import { useEffect, useRef } from 'react'
import { renderArticle } from '@/lib/article-presentation'
import { prepareWeChatArticle } from '@/lib/wechat-export'
export default function StyledArticle({title,body,images,layout}:{title:string;body:string;images:{url:string;caption?:string}[];layout?:{html:string;bodyOnly?:boolean}}) {
 const ref=useRef<HTMLElement>(null)
 const html=renderArticle({title,body,images,layout})
 useEffect(()=>{if(ref.current)ref.current.innerHTML=prepareWeChatArticle(ref.current).html},[html])
 return <><h1 style={{fontSize:24,lineHeight:1.5,margin:'16px 0 24px'}}>{title}</h1><article ref={ref} className="article-paper" id="article-content" dangerouslySetInnerHTML={{__html:html}}/></>
}
