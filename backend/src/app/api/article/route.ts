import { NextRequest, NextResponse } from 'next/server'
import { select } from '@/lib/supabase'
import type { ApiResponse, Article } from '@/types'

// GET /api/article?topicId=xxx
export async function GET(request: NextRequest) {
  try {
    const topicId = request.nextUrl.searchParams.get('topicId')
    if (!topicId) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '缺少主题ID' },
        { status: 400 }
      )
    }

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
  } catch (err) {
    console.error('Get article error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
