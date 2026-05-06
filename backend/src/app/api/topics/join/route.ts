import { NextRequest, NextResponse } from 'next/server'
import { select, insert } from '@/lib/supabase'
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

    // Find topic by invite code
    const topic = await select<Topic>('Topic', {
      eq: { inviteCode: inviteCode.toUpperCase() },
      single: true,
    })

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
    const existing = await select<{ id: string }>('Member', {
      columns: 'id',
      eq: { topicId: topic.id, userId },
      single: true,
    })

    if (existing) {
      return NextResponse.json<ApiResponse<Topic>>({
        ok: true,
        data: topic,
      })
    }

    // Add member
    await insert('Member', { topicId: topic.id, userId })

    return NextResponse.json<ApiResponse<Topic>>({ ok: true, data: topic })
  } catch (err) {
    console.error('Join topic error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
