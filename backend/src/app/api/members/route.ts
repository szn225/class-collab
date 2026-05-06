import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import type { ApiResponse } from '@/types'
import type { User } from '@/types'

// GET /api/members?topicId=xxx
export async function GET(request: NextRequest) {
  try {
    const topicId = request.nextUrl.searchParams.get('topicId')
    if (!topicId) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '缺少主题ID' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    const { data: members } = await supabase
      .from('Member')
      .select('user:User(id, name, avatar, role)')
      .eq('topicId', topicId)

    const users = (members ?? []).map((m: any) => m.user).filter(Boolean)
    return NextResponse.json<ApiResponse<User[]>>({ ok: true, data: users })
  } catch (err) {
    console.error('Get members error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}

// DELETE /api/members
export async function DELETE(request: NextRequest) {
  try {
    const { topicId, userId } = await request.json()
    if (!topicId || !userId) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '缺少参数' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    await supabase
      .from('Member')
      .delete()
      .eq('topicId', topicId)
      .eq('userId', userId)

    return NextResponse.json<ApiResponse>({ ok: true })
  } catch (err) {
    console.error('Delete member error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
