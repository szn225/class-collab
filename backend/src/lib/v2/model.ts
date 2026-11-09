import { createHash, randomBytes, randomUUID } from 'node:crypto'
export type Row = Record<string, any>
export interface State {
  users: Row[]; sessions: Row[]; activities: Row[]; uploads: Row[]; quotes: Row[]; tasks: Row[];
  ledger: Row[]; audit: Row[]; cache: Row[]; config: Row; configHistory: Row[]; rates: Row[]; requests: Row[]
}
export const id = () => randomUUID()
export const token = () => randomBytes(32).toString('base64url')
export const hash = (s: string) => createHash('sha256').update(s).digest('hex')
export function initialState(): State {
  return { users: [], sessions: [], activities: [], uploads: [], quotes: [], tasks: [], ledger: [], audit: [], cache: [], configHistory: [], rates: [], requests: [], config: {
    version: 1, confirmed: true, enabled: false, gift: 12, writing: 5, perImage: 0, visionEnabled: false, maxActivities: 30, maxMaterials: 500,
    maxImages: 6, maxImageBytes: 10485760, maxText: 5000, maxInput: 30000, maxOutput: 4000,
    dailyPoints: 200, dailyTasks: 10, dailyBudget: 500, monthlyBudget: 0, taskReserveCents: 100,
    writingInputCentsPerMillion: 200, writingOutputCentsPerMillion: 800, visionInputCentsPerMillion: 0, visionOutputCentsPerMillion: 0, visionImageMaxCents: 0,
    maxPlatformConcurrent: 4, maxUserConcurrent: 1, maxTaskImages: 30, maxStorageBytes: 524288000, maxUserStorageBytes: 1073741824, maxPlatformStorageBytes: 10737418240,
  } }
}
export class AppError extends Error { constructor(message: string, public status = 400, public code = 'INVALID') { super(message) } }
export function ensure(value: unknown, message: string, status = 400, code = 'INVALID'): asserts value { if (!value) throw new AppError(message, status, code) }
export function text(value: unknown, max = 1000, required = false) { ensure(typeof value === 'string' || value == null, '文字格式不正确'); const t = String(value ?? '').trim(); ensure(t.length <= max && (!required || t.length > 0), required ? '请填写有效内容，且不要超出长度限制' : '内容超出长度限制'); return t }
export const userView = (u: Row) => ({ id: u.id, name: u.name, balance: u.balance, frozen: u.frozen, state: u.state, aiPaused: u.aiPaused })
export const activeTask = (t: Row) => ['queued','vision','writing','review'].includes(t.stage)
export function audit(s: State, actor: string, action: string, object: string, reason: string, now: number) { s.audit.push({ id: id(), actor, action, object, reason, at: now }) }
export function rate(s: State, key: string, limit: number, period: number, now: number) {
  s.rates = s.rates.filter(r => r.until > now); let r = s.rates.find(r => r.key === key)
  if (!r) { r = { key, count: 0, until: now + period }; s.rates.push(r) }
  ensure(r.count < limit, '操作过于频繁，请稍后重试', 429, 'RATE'); r.count++
}
export function record(s: State, u: Row, amount: number, frozen: number, kind: string, ref: string, now: number, reason = '') {
  ensure(Number.isSafeInteger(amount) && Number.isSafeInteger(frozen), '点数必须为整数');
  if (s.ledger.some(l => l.ref === ref && l.kind === kind)) return
  const before = u.balance; ensure(u.balance + amount >= 0 && u.frozen + frozen >= 0, '点数不足', 409, 'BALANCE')
  u.balance += amount; u.frozen += frozen
  s.ledger.push({ id: id(), userId: u.id, amount, frozen, kind, ref, before, after: u.balance, at: now, reason })
}
export function member(a: Row, uid: string) { const m = a.members.find((m: Row) => m.userId === uid && !m.removed); ensure(m, '没有活动访问权限', 403, 'FORBIDDEN'); return m }
export function manage(a: Row, uid: string, owner = false) { const m = member(a, uid); ensure(owner ? m.role === 'owner' : ['owner','collaborator'].includes(m.role), '没有操作权限', 403, 'FORBIDDEN'); return m }
export function writable(a: Row) { ensure(a.status !== 'archived', '活动已归档，请先恢复', 409, 'ARCHIVED') }
export function activityView(a: Row, uid: string, s: State) {
 const m = member(a, uid), manager = m.role !== 'participant'
 return { id: a.id, name: a.name, description: a.description, announcement: a.announcement, status: a.status, revision: a.revision,
   role: m.role, aiAuthorized: m.role === 'owner' || !!m.ai, aiPaused: a.aiPaused,
   inviteCode: manager ? a.inviteCode : undefined, memberCount: a.members.filter((x: Row) => !x.removed).length,
   materialCount: a.materials.filter((x: Row) => !x.withdrawn).length, articleStatus: a.versions.length&&a.versions[a.versions.length-1].status==='draft'?'draft':a.publishedVersion===a.finalId&&a.publishedAt?'published':a.finalId?'final':'none',
   latestTask: manager ? s.tasks.filter(t=>t.activityId===a.id).slice(-1).map(t=>({id:t.id,stage:t.stage}))[0] : undefined,
   ownerName: s.users.find(u => u.id === a.ownerId)?.name, ownerBalance: manager ? s.users.find(u => u.id === a.ownerId)?.balance : undefined }
}
export function articleChanged(a: Row, v: Row) { return a.revision !== (v.reviewedRevision??v.sourceRevision) }
