// Lightweight Supabase client using fetch (no JS client dependency)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const API_BASE = `${supabaseUrl}/rest/v1`

function headers() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
  return {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Prefer': 'return=representation',
  }
}

// Select
export async function select<T = any>(table: string, options?: {
  columns?: string
  eq?: Record<string, string>
  in?: { column: string; values: string[] }
  single?: boolean
  count?: 'exact'
  order?: { column: string; ascending: boolean }
  limit?: number
}): Promise<T> {
  const params = new URLSearchParams()
  params.set('select', options?.columns || '*')

  if (options?.eq) {
    for (const [key, val] of Object.entries(options.eq)) {
      params.set(key, `eq.${val}`)
    }
  }

  if (options?.in) {
    params.set(options.in.column, `in.(${options.in.values.join(',')})`)
  }

  if (options?.order) {
    params.set('order', `${options.order.column}.${options.order.ascending ? 'asc' : 'desc'}`)
  }

  if (options?.limit) {
    params.set('limit', String(options.limit))
  }

  const queryStr = params.toString()
  let path = `/${table}${queryStr ? '?' + queryStr : ''}`

  const res = await fetch(`${API_BASE}${path}`, {
    headers: headers(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return (options?.single ? (data[0] || null) : data) as T
}

// Insert
export async function insert(table: string, values: Record<string, any>) {
  const res = await fetch(`${API_BASE}/${table}`, {
    method: 'POST',
    headers: { ...headers(), 'Prefer': 'return=representation' },
    body: JSON.stringify(Array.isArray(values) ? values : [values]),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase error ${res.status}: ${text}`)
  }
  return res.json()
}

// Update
export async function update(table: string, id: string, values: Record<string, any>) {
  const res = await fetch(`${API_BASE}/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers(), 'Prefer': 'return=representation' },
    body: JSON.stringify(values),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase error ${res.status}: ${text}`)
  }
  return res.json()
}

// Delete
export async function del(table: string, filters: Record<string, string>) {
  const params = new URLSearchParams()
  for (const [key, val] of Object.entries(filters)) {
    params.set(key, `eq.${val}`)
  }
  const res = await fetch(`${API_BASE}/${table}?${params.toString()}`, {
    method: 'DELETE',
    headers: { ...headers(), 'Prefer': 'return=representation' },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase error ${res.status}: ${text}`)
  }
  return res.status === 204 ? null : res.json()
}

// Count
export async function count(table: string): Promise<number> {
  const res = await fetch(`${API_BASE}/${table}?select=id`, {
    method: 'HEAD',
    headers: { ...headers(), Prefer: 'count=exact' },
  })
  return parseInt(res.headers.get('content-range')?.split('/')[1] || '0', 10)
}

// Raw query (for complex queries with joins)
export async function rawQuery(url: string) {
  const res = await fetch(`${supabaseUrl}/rest/v1${url}`, { headers: headers() })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase error ${res.status}: ${text}`)
  }
  return res.json()
}

// Upload file to Supabase Storage
export async function uploadFile(bucket: string, path: string, file: File) {
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey}`,
      'Content-Type': file.type,
    },
    body: file,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Upload error ${res.status}: ${text}`)
  }
  return res.json()
}

// Get public URL
export function getPublicUrl(bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}
