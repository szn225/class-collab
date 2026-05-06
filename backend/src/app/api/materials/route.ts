import { NextRequest, NextResponse } from 'next/server'
import { select, insert } from '@/lib/supabase'
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

    const materials = await select<any[]>('Material', {
      columns: '*, user:User(name, avatar)',
      eq: { topicId },
      order: { column: 'createdAt', ascending: true },
    })

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

    // Verify member
    const member = await select<{ id: string }>('Member', {
      columns: 'id',
      eq: { topicId, userId },
      single: true,
    })

    if (!member) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '你未加入该主题' },
        { status: 403 }
      )
    }

    const materials = await insert('Material', { topicId, userId, type, content, imageUrl })
    const material = materials[0]

    if (!material) {
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
