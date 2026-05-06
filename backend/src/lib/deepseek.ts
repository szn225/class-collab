const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const API_URL = 'https://api.deepseek.com/v1/chat/completions'

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function callDeepSeek(
  messages: DeepSeekMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      stream: false,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// Build the system prompt for article generation
export function buildArticlePrompt(materials: {
  userName: string
  type: string
  content?: string
  imageUrl?: string
  createdAt: string
}[]): DeepSeekMessage[] {
  const materialList = materials
    .map((m, i) => {
      if (m.type === 'image') {
        return `[素材 ${i + 1}] ${m.userName} 上传了一张图片 (图片位置: #${i + 1})`
      }
      if (m.type === 'voice') {
        return `[素材 ${i + 1}] ${m.userName} 语音转文字: ${m.content}`
      }
      return `[素材 ${i + 1}] ${m.userName} 说: ${m.content}`
    })
    .join('\n')

  return [
    {
      role: 'system',
      content: `你是一位班级公众号的编辑。请根据提供的活动素材，撰写一篇适合发布在微信公众号上的文章。

要求：
1. 标题要吸引人，能激发阅读兴趣
2. 开头简要概述活动背景和意义
3. 正文按逻辑分段（时间顺序或主题分类），每段使用小标题
4. 在合适的位置插入图片占位标记，格式为 [图片：对应素材编号]
5. 结尾进行总结和展望
6. 语气积极向上，符合班级氛围
7. 段落简短，每段不超过200字，适合手机阅读
8. 全文800-1500字

输出格式：先输出标题（用 # 开头），再输出正文 Markdown。`,
    },
    {
      role: 'user',
      content: `以下是本次活动的全部素材，请据此撰写公众号文章：\n\n${materialList}`,
    },
  ]
}
