import type { User, Topic, Material, Article } from '@/types'

interface MockData {
  users: Record<string, User>
  userIdCounter: number
  isFirstUser: boolean
  topics: Topic[]
  topicIdCounter: number
  materials: Material[]
  materialIdCounter: number
  articles: Article[]
  articleIdCounter: number
}

const getMockData = (): MockData => {
  if (!(globalThis as any).__MOCK_DATA__) {
    ;(globalThis as any).__MOCK_DATA__ = {
      users: {},
      userIdCounter: 1,
      isFirstUser: true,
      topics: [],
      topicIdCounter: 1,
      materials: [],
      materialIdCounter: 1,
      articles: [],
      articleIdCounter: 1,
    }
  }
  return (globalThis as any).__MOCK_DATA__
}

export function getOrCreateMockUser(name: string): User {
  const data = getMockData()
  
  if (data.users[name]) {
    return data.users[name]
  }
  
  const role = data.isFirstUser ? 'admin' : 'member'
  data.isFirstUser = false
  
  const user: User = {
    id: `mock_${data.userIdCounter++}`,
    name,
    role,
    createdAt: new Date().toISOString(),
  }
  data.users[name] = user
  return user
}

export function createMockTopic(title: string, description: string | undefined, userId: string): Topic {
  const data = getMockData()
  
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let inviteCode = ''
  for (let i = 0; i < 6; i++) {
    inviteCode += chars[Math.floor(Math.random() * chars.length)]
  }
  
  const topic: Topic = {
    id: `mock_topic_${data.topicIdCounter++}`,
    title,
    description,
    inviteCode,
    createdBy: userId,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    memberCount: 1,
    materialCount: 0,
  }
  data.topics.push(topic)
  return topic
}

export function getMockTopic(id: string): Topic | undefined {
  const data = getMockData()
  return data.topics.find(t => t.id === id)
}

export function getMockTopics(): Topic[] {
  const data = getMockData()
  return data.topics
}

export function updateMockTopic(id: string, updateData: Partial<Topic>): Topic | undefined {
  const data = getMockData()
  const index = data.topics.findIndex(t => t.id === id)
  if (index === -1) return undefined
  
  data.topics[index] = {
    ...data.topics[index],
    ...updateData,
    updatedAt: new Date().toISOString(),
  }
  return data.topics[index]
}

export function createMockMaterial(topicId: string, userId: string, type: 'text' | 'image' | 'voice', content: string | undefined, imageUrl: string | undefined): Material {
  const data = getMockData()
  
  const user = Object.values(data.users).find(u => u.id === userId)
  
  const material: Material = {
    id: `mock_mat_${data.materialIdCounter++}`,
    topicId,
    userId,
    userName: user?.name,
    type,
    content,
    imageUrl,
    createdAt: new Date().toISOString(),
  }
  data.materials.push(material)
  
  const topic = data.topics.find(t => t.id === topicId)
  if (topic) {
    topic.materialCount = (topic.materialCount || 0) + 1
  }
  
  return material
}

export function getMockMaterials(topicId: string): Material[] {
  const data = getMockData()
  return data.materials.filter(m => m.topicId === topicId)
}

export function createOrUpdateMockArticle(topicId: string, title: string, content: string, html: string): Article {
  const data = getMockData()
  const existing = data.articles.find(a => a.topicId === topicId)
  
  if (existing) {
    existing.title = title
    existing.content = content
    existing.html = html
    existing.updatedAt = new Date().toISOString()
    return existing
  }
  
  const article: Article = {
    id: `mock_art_${data.articleIdCounter++}`,
    topicId,
    title,
    content,
    html,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  data.articles.push(article)
  return article
}

export function getMockArticle(topicId: string): Article | undefined {
  const data = getMockData()
  return data.articles.find(a => a.topicId === topicId)
}