import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import type { ApiResponse, Topic } from '@/types'

// POST /api/topics/join
export async function POST(request: NextRequest) {
  try {
    const { inviteCode, userId } = await request.json()
    if (!inviteCode || !userId) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '缺少邀请码或用户ID' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Find topic by invite code
    const { data: topic } = await supabase
      .from('Topic')
      .select('*')
      .eq('inviteCode', inviteCode.toUpperCase())
      .single()

    if (!topic) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '邀请码无效' },
        { status: 404 }
      )
    }

    if (topic.status === 'closed' || topic.status === 'generated') {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '该主题已关闭' },
        { status: 400 }
      )
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('Member')
      .select('id')
      .eq('topicId', topic.id)
      .eq('userId', userId)
      .single()

    if (existing) {
      return NextResponse.json<ApiResponse<Topic>>({
        ok: true,
        data: topic,
      })
    }

    // Add member
    const { error } = await supabase.from('Member').insert({
      topicId: topic.id,
      userId,
    })

    if (error) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '加入失败' },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<Topic>>({ ok: true, data: topic })
  } catch (err) {
    console.error('Join topic error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
