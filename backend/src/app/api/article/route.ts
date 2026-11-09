import { NextRequest, NextResponse } from 'next/server'
import { select } from '@/lib/supabase'
import { getMockArticle } from '@/lib/mock'
import type { ApiResponse, Article } from '@/types'

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
      const article = await select<Article>('Article', {
        eq: { topicId },
        single: true,
      })

      if (!article) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '文章尚未生成' },
          { status: 404 }
        )
      }

      return NextResponse.json<ApiResponse<Article>>({ ok: true, data: article })
    } catch (dbErr) {
      // Production requests must never succeed using transient demo records.
      if (process.env.NODE_ENV === 'production') {
        console.error('Database request failed')
        return NextResponse.json({ ok: false, error: '数据服务暂时不可用，请稍后重试' }, { status: 503 })
      }
      console.warn('Database unavailable, using mock data:', dbErr)
      const mockArticle = getMockArticle(topicId)
      if (!mockArticle) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '文章尚未生成' },
          { status: 404 }
        )
      }
      return NextResponse.json<ApiResponse<Article>>({ ok: true, data: mockArticle })
    }
  } catch (err) {
    console.error('Get article error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}