import { NextRequest, NextResponse } from 'next/server'
import { select, insert, update } from '@/lib/supabase'
import { callDeepSeek, buildArticlePrompt } from '@/lib/deepseek'
import { markdownToWeChatHTML, buildWeChatHTML } from '@/lib/template'
import { getMockTopic, getMockMaterials, createOrUpdateMockArticle, updateMockTopic } from '@/lib/mock'
import type { ApiResponse, Article } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { topicId, userId } = await request.json()
    if (!topicId || !userId) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '缺少参数' },
        { status: 400 }
      )
    }

    try {
      const user = await select<{ role: string }>('User', {
        columns: 'role',
        eq: { id: userId },
        single: true,
      })

      if (user?.role !== 'admin') {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '仅管理员可生成文章' },
          { status: 403 }
        )
      }

      const topic = await select<any>('Topic', {
        eq: { id: topicId },
        single: true,
      })

      if (!topic) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '主题不存在' },
          { status: 404 }
        )
      }

      const materials = await select<any[]>('Material', {
        columns: '*, user:User(name)',
        eq: { topicId },
        order: { column: 'createdAt', ascending: true },
      })

      if (!materials || materials.length === 0) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '该主题暂无素材，无法生成文章' },
          { status: 400 }
        )
      }

      const formattedMaterials = materials.map((m: any) => ({
        userName: m.user?.name ?? '匿名',
        type: m.type,
        content: m.content,
        imageUrl: m.imageUrl,
        createdAt: m.createdAt,
      }))

      const messages = buildArticlePrompt(formattedMaterials)
      let articleMarkdown = ''

      try {
        articleMarkdown = await callDeepSeek(messages)
      } catch (aiErr) {
        console.error('DeepSeek API error:', aiErr)
        return NextResponse.json<ApiResponse>(
          { ok: false, error: 'AI 生成失败，请稍后重试' },
          { status: 502 }
        )
      }

      const titleMatch = articleMarkdown.match(/^#\s+(.+)/m)
      const title = titleMatch?.[1] ?? topic.title

      const imageUrls: { index: number; url: string }[] = []
      for (let i = 0; i < materials.length; i++) {
        const m = materials[i]
        if (m.type === 'image' && m.imageUrl) {
          imageUrls.push({ index: i + 1, url: m.imageUrl })
        }
      }

      const bodyHtml = markdownToWeChatHTML(articleMarkdown, imageUrls)
      const fullHtml = buildWeChatHTML(title, bodyHtml)

      const existing = await select<{ id: string }>('Article', {
        columns: 'id',
        eq: { topicId },
        single: true,
      })

      let articleData: any
      if (existing) {
        const articles = await update('Article', existing.id, {
          title,
          content: articleMarkdown,
          html: fullHtml,
        })
        articleData = articles[0]
      } else {
        const articles = await insert('Article', { topicId, title, content: articleMarkdown, html: fullHtml })
        articleData = articles[0]
      }

      await update('Topic', topicId, { status: 'generated' })

      return NextResponse.json<ApiResponse<Article>>({
        ok: true,
        data: articleData,
      })
    } catch (dbErr) {
      // Production requests must never succeed using transient demo records.
      if (process.env.NODE_ENV === 'production') {
        console.error('Database request failed')
        return NextResponse.json({ ok: false, error: '数据服务暂时不可用，请稍后重试' }, { status: 503 })
      }
      console.warn('Database unavailable, using mock data:', dbErr)
      if (!userId.startsWith('mock_')) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '仅管理员可生成文章' },
          { status: 403 }
        )
      }

      const mockTopic = getMockTopic(topicId)
      if (!mockTopic) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '主题不存在' },
          { status: 404 }
        )
      }

      const materials = getMockMaterials(topicId)
      if (!materials || materials.length === 0) {
        return NextResponse.json<ApiResponse>(
          { ok: false, error: '该主题暂无素材，无法生成文章' },
          { status: 400 }
        )
      }

      const formattedMaterials = materials.map((m) => ({
        userName: m.userName ?? '匿名',
        type: m.type,
        content: m.content,
        imageUrl: m.imageUrl,
        createdAt: m.createdAt,
      }))

      const messages = buildArticlePrompt(formattedMaterials)
      let articleMarkdown = ''

      try {
        articleMarkdown = await callDeepSeek(messages)
      } catch (aiErr) {
        console.error('DeepSeek API error:', aiErr)
        return NextResponse.json<ApiResponse>(
          { ok: false, error: 'AI 生成失败，请稍后重试' },
          { status: 502 }
        )
      }

      const titleMatch = articleMarkdown.match(/^#\s+(.+)/m)
      const title = titleMatch?.[1] ?? mockTopic.title

      const imageUrls: { index: number; url: string }[] = []
      for (let i = 0; i < materials.length; i++) {
        const m = materials[i]
        if (m.type === 'image' && m.imageUrl) {
          imageUrls.push({ index: i + 1, url: m.imageUrl })
        }
      }

      const bodyHtml = markdownToWeChatHTML(articleMarkdown, imageUrls)
      const fullHtml = buildWeChatHTML(title, bodyHtml)

      const articleData = createOrUpdateMockArticle(topicId, title, articleMarkdown, fullHtml)
      updateMockTopic(topicId, { status: 'generated' })

      return NextResponse.json<ApiResponse<Article>>({
        ok: true,
        data: articleData,
      })
    }
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}