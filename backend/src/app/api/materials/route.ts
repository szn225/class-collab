import { NextRequest, NextResponse } from 'next/server'
import { select, insert } from '@/lib/supabase'
import { createMockMaterial, getMockMaterials } from '@/lib/mock'
import type { ApiResponse, Material } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const topicId = request.nextUrl.searchParams.get('topicId')
    if (!topicId) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '缺少主题ID' },
        { status: 400 }
      )
    }

    try {
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
    } catch (dbErr) {
      // Production requests must never succeed using transient demo records.
      if (process.env.NODE_ENV === 'production') {
        console.error('Database request failed')
        return NextResponse.json({ ok: false, error: '数据服务暂时不可用，请稍后重试' }, { status: 503 })
      }
      console.warn('Database unavailable, using mock data:', dbErr)
      const mockMaterials = getMockMaterials(topicId)
      return NextResponse.json<ApiResponse<Material[]>>({ ok: true, data: mockMaterials })
    }
  } catch (err) {
    console.error('Get materials error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { topicId, userId, type, content, imageUrl } = await request.json()
    if (!topicId || !userId || !type) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    try {
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
    } catch (dbErr) {
      // Production requests must never succeed using transient demo records.
      if (process.env.NODE_ENV === 'production') {
        console.error('Database request failed')
        return NextResponse.json({ ok: false, error: '数据服务暂时不可用，请稍后重试' }, { status: 503 })
      }
      console.warn('Database unavailable, using mock data:', dbErr)
      if (!userId.startsWith('mock_')) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '你未加入该主题' },
          { status: 403 }
        )
      }

      const mockMaterial = createMockMaterial(topicId, userId, type, content, imageUrl)
      return NextResponse.json<ApiResponse<Material>>(
        { ok: true, data: mockMaterial },
        { status: 201 }
      )
    }
  } catch (err) {
    console.error('Create material error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}