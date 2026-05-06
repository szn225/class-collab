// /api/topics/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import type { ApiResponse, Topic } from '@/types'

interface Params { params: { id: string } }

// GET /api/topics/:id
export async function GET(_: NextRequest, { params }: Params) {
  try {
    const supabase = getSupabaseClient()
    const { data: topic } = await supabase
      .from('Topic')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!topic) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '主题不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>({ ok: true, data: topic })
  } catch (err) {
    console.error('Get topic error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}

// PATCH /api/topics/:id
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json()
    const supabase = getSupabaseClient()

    const { data: topic, error } = await supabase
      .from('Topic')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error || !topic) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '更新失败' },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse>({ ok: true, data: topic })
  } catch (err) {
    console.error('Update topic error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
