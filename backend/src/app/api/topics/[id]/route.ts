import { NextRequest, NextResponse } from 'next/server'
import { select, update } from '@/lib/supabase'
import { getMockTopic, updateMockTopic } from '@/lib/mock'
import type { ApiResponse, Topic } from '@/types'

interface Params { params: { id: string } }

export async function GET(_: NextRequest, { params }: Params) {
  try {
    try {
      const topic = await select<Topic>('Topic', {
        eq: { id: params.id },
        single: true,
      })

      if (!topic) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '主题不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json<ApiResponse>({ ok: true, data: topic })
    } catch (dbErr) {
      // Production requests must never succeed using transient demo records.
      if (process.env.NODE_ENV === 'production') {
        console.error('Database request failed')
        return NextResponse.json({ ok: false, error: '数据服务暂时不可用，请稍后重试' }, { status: 503 })
      }
      console.warn('Database unavailable, using mock data:', dbErr)
      const mockTopic = getMockTopic(params.id)
      if (!mockTopic) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '主题不存在' },
          { status: 404 }
        )
      }
      return NextResponse.json<ApiResponse>({ ok: true, data: mockTopic })
    }
  } catch (err) {
    console.error('Get topic error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json()

    try {
      const topics = await update('Topic', params.id, body)
      const topic = topics[0]

      if (!topic) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '更新失败' },
          { status: 500 }
        )
      }

      return NextResponse.json<ApiResponse>({ ok: true, data: topic })
    } catch (dbErr) {
      // Production requests must never succeed using transient demo records.
      if (process.env.NODE_ENV === 'production') {
        console.error('Database request failed')
        return NextResponse.json({ ok: false, error: '数据服务暂时不可用，请稍后重试' }, { status: 503 })
      }
      console.warn('Database unavailable, using mock data:', dbErr)
      const updatedTopic = updateMockTopic(params.id, body)
      if (!updatedTopic) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '更新失败' },
          { status: 500 }
        )
      }
      return NextResponse.json<ApiResponse>({ ok: true, data: updatedTopic })
    }
  } catch (err) {
    console.error('Update topic error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}