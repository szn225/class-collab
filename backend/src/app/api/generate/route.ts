import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { callDeepSeek, buildArticlePrompt } from '@/lib/deepseek'
import { markdownToWeChatHTML, buildWeChatHTML } from '@/lib/template'
import type { ApiResponse, Article } from '@/types'

// POST /api/generate
export async function POST(request: NextRequest) {
  try {
    const { topicId, userId } = await request.json()
    if (!topicId || !userId) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '缺少参数' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Verify user is admin
    const { data: user } = await supabase
      .from('User')
      .select('role')
      .eq('id', userId)
      .single()

    if (user?.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '仅管理员可生成文章' },
        { status: 403 }
      )
    }

    // Get topic
    const { data: topic } = await supabase
      .from('Topic')
      .select('*')
      .eq('id', topicId)
      .single()

    if (!topic) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '主题不存在' },
        { status: 404 }
      )
    }

    // Get all materials for this topic
    const { data: materials } = await supabase
      .from('Material')
      .select('*, user:User(name)')
      .eq('topicId', topicId)
      .order('createdAt', { ascending: true })

    if (!materials || materials.length === 0) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '该主题暂无素材，无法生成文章' },
        { status: 400 }
      )
    }

    // Format materials for AI prompt
    const formattedMaterials = materials.map((m: any) => ({
      userName: m.user?.name ?? '匿名',
      type: m.type,
      content: m.content,
      imageUrl: m.imageUrl,
      createdAt: m.createdAt,
    }))

    // Call DeepSeek
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

    // Extract title
    const titleMatch = articleMarkdown.match(/^#\s+(.+)/m)
    const title = titleMatch?.[1] ?? topic.title

    // Extract image URLs for template replacement
    const imageUrls: { index: number; url: string }[] = []
    let imgIdx = 1
    for (const m of materials) {
      if (m.type === 'image' && m.imageUrl) {
        imageUrls.push({ index: imgIdx++, url: m.imageUrl })
      }
    }

    // Convert to WeChat HTML
    const bodyHtml = markdownToWeChatHTML(articleMarkdown, imageUrls)
    const fullHtml = buildWeChatHTML(title, bodyHtml)

    // Save or update article
    const { data: existing } = await supabase
      .from('Article')
      .select('id')
      .eq('topicId', topicId)
      .single()

    let articleData: any
    if (existing) {
      const { data } = await supabase
        .from('Article')
        .update({
          title,
          content: articleMarkdown,
          html: fullHtml,
        })
        .eq('topicId', topicId)
        .select()
        .single()
      articleData = data
    } else {
      const { data } = await supabase
        .from('Article')
        .insert({ topicId, title, content: articleMarkdown, html: fullHtml })
        .select()
        .single()
      articleData = data
    }

    // Update topic status
    await supabase
      .from('Topic')
      .update({ status: 'generated' })
      .eq('id', topicId)

    return NextResponse.json<ApiResponse<Article>>({
      ok: true,
      data: articleData,
    })
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
