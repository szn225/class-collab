export const statusLabels = { active: '进行中', closed: '已结束', generated: '已出文' }
export function formatTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
export const presentTopic = (topic) => ({
  ...topic,
  statusLabel: statusLabels[topic.status] || '未知状态',
})
export function articleBody(html = '') {
  return html
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<!DOCTYPE[^>]*>|<\/?(?:html|body)[^>]*>/gi, '')
    .trim()
}
