import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import type { ApiResponse, User } from '@/types'

// POST /api/auth/login
// Simple login with name (for class use)
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()
    if (!name || typeof name !== 'string') {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '请提供姓名' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Check if user exists
    const { data: existing } = await supabase
      .from('User')
      .select('*')
      .eq('name', name.trim())
      .single()

    if (existing) {
      return NextResponse.json<ApiResponse<User>>({
        ok: true,
        data: {
          id: existing.id,
          name: existing.name,
          avatar: existing.avatar ?? undefined,
          role: existing.role,
          createdAt: existing.createdAt,
        },
      })
    }

    // First user becomes admin, others are members
    const { count } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true })

    const role = count === 0 ? 'admin' : 'member'

    const { data: newUser, error } = await supabase
      .from('User')
      .insert({ name: name.trim(), role })
      .select()
      .single()

    if (error || !newUser) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '注册失败' },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<User>>({
      ok: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
