import { NextRequest, NextResponse } from 'next/server'
// Legacy APIs trusted userId/name from clients. Disable them rather than leave an
// alternate path to accounts, private materials or unmetered model calls.
export function middleware(request:NextRequest){
 const path=request.nextUrl.pathname
 if(path.startsWith('/api/')&&!path.startsWith('/api/v2/')&&path!=='/api/health')return NextResponse.json({ok:false,error:'请更新至慧共创新版后重新登录',code:'UPGRADE'},{status:410})
 return NextResponse.next()
}
export const config={matcher:['/api/:path*']}
