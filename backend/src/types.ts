// Shared type definitions

export interface User {
  id: string
  name: string
  avatar?: string
  role: 'admin' | 'member'
  createdAt: string
}

export interface Topic {
  id: string
  title: string
  description?: string
  coverImage?: string
  status: 'active' | 'closed' | 'generated'
  inviteCode: string
  createdAt: string
  updatedAt: string
  createdBy: string
  memberCount?: number
  materialCount?: number
}

export interface Material {
  id: string
  topicId: string
  userId: string
  userName?: string
  userAvatar?: string
  type: 'text' | 'image' | 'voice'
  content?: string
  imageUrl?: string
  createdAt: string
}

export interface Article {
  id: string
  topicId: string
  title: string
  content: string    // Markdown
  html: string       // WeChat-compatible HTML
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}
