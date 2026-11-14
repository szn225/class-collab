import { AsyncLocalStorage } from 'node:async_hooks'

const timings = new AsyncLocalStorage<Map<string, number>>()

export async function measure<T>(name: string, work: () => Promise<T>): Promise<T> {
 const context = timings.getStore()
 if (!context) return work()
 const start = performance.now()
 try { return await work() }
 finally { context.set(name, (context.get(name) || 0) + performance.now() - start) }
}

// Request-local diagnostics only. No payloads, identities, or credentials in headers.
export async function timedResponse<T extends Response>(work: () => Promise<T>): Promise<T> {
 return timings.run(new Map(), async () => {
  const start = performance.now()
  const result = await work()
  const entries = [...timings.getStore()!].map(([name, duration]) => `${name};dur=${duration.toFixed(1)}`)
  entries.push(`app;dur=${(performance.now() - start).toFixed(1)}`)
  result.headers.set('Server-Timing', entries.join(', '))
  return result
 })
}
