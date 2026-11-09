import { NextRequest, NextResponse } from 'next/server'
import { select, count, insert } from '@/lib/supabase'
import { getOrCreateMockUser } from '@/lib/mock'
import type { ApiResponse, User } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()
    if (!name || typeof name !== 'string') {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '请提供姓名' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()

    try {
      const existing = await select<User>('User', {
        eq: { name: trimmedName },
        single: true,
      })

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

      const userCount = await count('User')
      const role = userCount === 0 ? 'admin' : 'member'

      const newUsers = await insert('User', { name: trimmedName, role })
      const newUser = newUsers[0]

      if (!newUser) {
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
    } catch (dbErr) {
      // Production requests must never succeed using transient demo records.
      if (process.env.NODE_ENV === 'production') {
        console.error('Database request failed')
        return NextResponse.json({ ok: false, error: '数据服务暂时不可用，请稍后重试' }, { status: 503 })
      }
      console.warn('Database unavailable, using mock data:', dbErr)
      const mockUser = getOrCreateMockUser(trimmedName)
      return NextResponse.json<ApiResponse<User>>({
        ok: true,
        data: mockUser,
      })
    }
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}