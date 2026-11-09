import { NextRequest, NextResponse } from 'next/server'
import { select, insert } from '@/lib/supabase'
import { createMockTopic, getMockTopics } from '@/lib/mock'
import type { ApiResponse, Topic } from '@/types'

export const dynamic = 'force-dynamic'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '缺少用户ID' },
        { status: 400 }
      )
    }

    try {
      const memberTopics = await select<{ topicId: string }[]>('Member', {
        columns: 'topicId',
        eq: { userId },
      })

      const topicIds = memberTopics?.map(m => m.topicId) ?? []

      const createdTopics = await select<{ id: string }[]>('Topic', {
        columns: 'id',
        eq: { createdBy: userId },
      })

      const allIds = [...new Set([
        ...topicIds,
        ...(createdTopics?.map(t => t.id) ?? []),
      ])]

      if (allIds.length === 0) {
        return NextResponse.json<ApiResponse<Topic[]>>({ ok: true, data: [] })
      }

      const topics = await select<any[]>('Topic', {
        columns: '*, member:Member(count), material:Material(count)',
        in: { column: 'id', values: allIds },
        order: { column: 'createdAt', ascending: false },
      })

      const result = (topics ?? []).map((t: any) => ({
        ...t,
        memberCount: t.member?.[0]?.count ?? 0,
        materialCount: t.material?.[0]?.count ?? 0,
      }))

      return NextResponse.json<ApiResponse<Topic[]>>({ ok: true, data: result })
    } catch (dbErr) {
      // Production requests must never succeed using transient demo records.
      if (process.env.NODE_ENV === 'production') {
        console.error('Database request failed')
        return NextResponse.json({ ok: false, error: '数据服务暂时不可用，请稍后重试' }, { status: 503 })
      }
      console.warn('Database unavailable, using mock data:', dbErr)
      const userTopics = getMockTopics().filter(t => 
        t.createdBy === userId || 
        t.status === 'active'
      )
      return NextResponse.json<ApiResponse<Topic[]>>({ ok: true, data: userTopics })
    }
  } catch (err) {
    console.error('Get topics error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, userId } = await request.json()
    if (!title || !userId) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '缺少标题或用户ID' },
        { status: 400 }
      )
    }

    try {
      const user = await select<{ role: string }>('User', {
        columns: 'role',
        eq: { id: userId },
        single: true,
      })

      if (user?.role !== 'admin') {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '仅管理员可创建主题' },
          { status: 403 }
        )
      }

      let inviteCode = generateInviteCode()
      for (let i = 0; i < 10; i++) {
        const existing = await select<{ id: string }>('Topic', {
          columns: 'id',
          eq: { inviteCode },
          single: true,
        })
        if (!existing) break
        inviteCode = generateInviteCode()
      }

      const topics = await insert('Topic', {
        title: title.trim(),
        description: description?.trim(),
        inviteCode,
        createdBy: userId,
      })
      const topic = topics[0]

      if (!topic) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '创建失败' },
          { status: 500 }
        )
      }

      await insert('Member', { topicId: topic.id, userId })

      return NextResponse.json<ApiResponse<Topic>>(
        { ok: true, data: topic },
        { status: 201 }
      )
    } catch (dbErr) {
      // Production requests must never succeed using transient demo records.
      if (process.env.NODE_ENV === 'production') {
        console.error('Database request failed')
        return NextResponse.json({ ok: false, error: '数据服务暂时不可用，请稍后重试' }, { status: 503 })
      }
      console.warn('Database unavailable, using mock data:', dbErr)
      if (!userId.startsWith('mock_')) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '仅管理员可创建主题' },
          { status: 403 }
        )
      }

      const mockTopic = createMockTopic(title.trim(), description?.trim(), userId)
      return NextResponse.json<ApiResponse<Topic>>(
        { ok: true, data: mockTopic },
        { status: 201 }
      )
    }
  } catch (err) {
    console.error('Create topic error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}