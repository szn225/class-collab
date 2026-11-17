import { State, hash } from './model'
// Expose only the version explicitly published through an active share link.
export function publicArticle(s:State, secret:unknown) {
 if(typeof secret!=='string'||!/^[a-zA-Z0-9_-]{20,128}$/.test(secret))return null
 const digest=hash(secret),activity=s.activities.find(a=>a.shareHash&&(a.shareHash===digest||a.shareToken===secret))
 const version=activity?.versions.find((v:any)=>v.id===activity.shareVersion&&v.status==='final')
 if(!version)return null
 return {title:version.title,body:version.body,revision:version.revision,images:(version.images||[]).map((img:any)=>({path:img.path,caption:img.caption||''})),layout:version.layout?{bodyOnly:version.layout.bodyOnly,html:version.layout.html}:undefined}
}
