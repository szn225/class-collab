import { NextResponse } from 'next/server'
import { readState } from '@/lib/v2/store'
import { timedResponse } from '@/lib/v2/timing'
export const dynamic='force-dynamic'
export const runtime='nodejs'
const features={aiLayout:true,bundledGeneration:true,wholePointBilling:true,automaticMemberReading:true,publicArticleReader:true,explicitMaterialSelection:true,configurableActivityImages:true}
export function GET(){return timedResponse(async()=>{try{await readState();return NextResponse.json({ok:true,database:'connected',version:2,features,build:'2026-11-17.1'},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({ok:false,database:'unavailable',version:2,features,build:'2026-11-17.1'},{status:503,headers:{'Cache-Control':'no-store'}})}})}
