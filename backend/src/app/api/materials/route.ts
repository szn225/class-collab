import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import type { ApiResponse, Material } from '@/types'

// GET /api/materials?topicId=xxx
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
    const { data: materials } = await supabase
      .from('Material')
      .select('*, user:User(name, avatar)')
      .eq('topicId', topicId)
      .order('createdAt', { ascending: true })

    const result = (materials ?? []).map((m: any) => ({
      id: m.id,
      topicId: m.topicId,
      userId: m.userId,
      userName: m.user?.name,
      userAvatar: m.user?.avatar,
      type: m.type,
      content: m.content,
      imageUrl: m.imageUrl,
      createdAt: m.createdAt,
    }))

    return NextResponse.json<ApiResponse<Material[]>>({ ok: true, data: result })
  } catch (err) {
    console.error('Get materials error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}

// POST /api/materials
export async function POST(request: NextRequest) {
  try {
    const { topicId, userId, type, content, imageUrl } = await request.json()
    if (!topicId || !userId || !type) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Verify member
    const { data: member } = await supabase
      .from('Member')
      .select('id')
      .eq('topicId', topicId)
      .eq('userId', userId)
      .single()

    if (!member) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '你未加入该主题' },
        { status: 403 }
      )
    }

    const { data: material, error } = await supabase
      .from('Material')
      .insert({ topicId, userId, type, content, imageUrl })
      .select()
      .single()

    if (error || !material) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '提交失败' },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<Material>>(
      { ok: true, data: material },
      { status: 201 }
    )
  } catch (err) {
    console.error('Create material error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
