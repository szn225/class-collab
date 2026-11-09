import { NextResponse } from 'next/server'
import { readState } from '@/lib/v2/store'
export const dynamic='force-dynamic'
export async function GET(){try{await readState();return NextResponse.json({ok:true,database:'connected',version:2},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({ok:false,database:'unavailable',version:2},{status:503,headers:{'Cache-Control':'no-store'}})}}
