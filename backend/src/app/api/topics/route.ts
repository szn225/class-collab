import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import type { ApiResponse } from '@/types'
import type { Topic } from '@/types'

// Generate a simple invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// GET /api/topics?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '缺少用户ID' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Get topics where user is a member or creator
    const { data: memberTopics } = await supabase
      .from('Member')
      .select('topicId')
      .eq('userId', userId)

    const topicIds = memberTopics?.map(m => m.topicId) ?? []

    const { data: createdTopics } = await supabase
      .from('Topic')
      .select('id')
      .eq('createdBy', userId)

    const allIds = [...new Set([
      ...topicIds,
      ...(createdTopics?.map(t => t.id) ?? []),
    ])]

    if (allIds.length === 0) {
      return NextResponse.json<ApiResponse<Topic[]>>({ ok: true, data: [] })
    }

    const { data: topics } = await supabase
      .from('Topic')
      .select(`
        *,
        member:Member(count),
        material:Material(count)
      `)
      .in('id', allIds)
      .order('createdAt', { ascending: false })

    const result = (topics ?? []).map((t: any) => ({
      ...t,
      memberCount: t.member?.[0]?.count ?? 0,
      materialCount: t.material?.[0]?.count ?? 0,
    }))

    return NextResponse.json<ApiResponse<Topic[]>>({ ok: true, data: result })
  } catch (err) {
    console.error('Get topics error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}

// POST /api/topics
export async function POST(request: NextRequest) {
  try {
    const { title, description, userId } = await request.json()
    if (!title || !userId) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '缺少标题或用户ID' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Verify user is admin
    const { data: user } = await supabase
      .from('User')
      .select('role')
      .eq('id', userId)
      .single()

    if (user?.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '仅管理员可创建主题' },
        { status: 403 }
      )
    }

    let inviteCode = generateInviteCode()
    // Ensure unique invite code
    for (let i = 0; i < 10; i++) {
      const { data: existing } = await supabase
        .from('Topic')
        .select('id')
        .eq('inviteCode', inviteCode)
        .single()
      if (!existing) break
      inviteCode = generateInviteCode()
    }

    const { data: topic, error } = await supabase
      .from('Topic')
      .insert({
        title: title.trim(),
        description: description?.trim(),
        inviteCode,
        createdBy: userId,
      })
      .select()
      .single()

    if (error || !topic) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '创建失败' },
        { status: 500 }
      )
    }

    // Auto-add creator as member
    await supabase.from('Member').insert({
      topicId: topic.id,
      userId,
    })

    return NextResponse.json<ApiResponse<Topic>>(
      { ok: true, data: topic },
      { status: 201 }
    )
  } catch (err) {
    console.error('Create topic error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
