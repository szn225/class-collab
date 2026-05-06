import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient, getStorageBucket } from '@/lib/supabase'
import type { ApiResponse } from '@/types'

// POST /api/upload
// Upload image to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file || !userId) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '缺少文件或用户ID' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '不支持的图片格式，仅支持 JPG/PNG/WebP/GIF' },
        { status: 400 }
      )
    }

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '图片太大，请压缩后上传（最大10MB）' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { data, error } = await supabase.storage
      .from(getStorageBucket())
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: '3600',
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json<ApiResponse>(
        { ok: false, error: '上传失败' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(getStorageBucket())
      .getPublicUrl(data.path)

    return NextResponse.json<ApiResponse<{ url: string }>>({
      ok: true,
      data: { url: publicUrl },
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json<ApiResponse>(
      { ok: false, error: '服务器错误' },
      { status: 500 }
    )
  }
}
