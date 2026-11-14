// Shared by the mini program and the public article page. Never mutate source text.
function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}
function inline(text) {
  return escapeHtml(text).replace(/\*\*([^*\n]+)\*\*/g, '<strong style="color:#285b4b;font-weight:700;">$1</strong>').replace(/\n/g, '<br/>')
}
const articleThemes = [
  { id: 'forest', name: '清新校园', color: '#285b4b', light: '#eef5ef', border: '#bdd2c1', ink: '#435c4c', label: '校园 · 故事集' },
  { id: 'warm', name: '暖色纪实', color: '#97512e', light: '#fcf3e8', border: '#e4c5a5', ink: '#795e46', label: '时光 · 纪念册' },
  { id: 'blue', name: '雅致蓝调', color: '#305889', light: '#edf3fa', border: '#bdcfe5', ink: '#4b6280', label: '共创 · 精彩记录' },
]
function articleLayout(body, images = [], options = {}) {
  const theme = articleThemes.find(t => t.id === options.theme) || articleThemes[0]
  const {color, light, border, ink} = theme
  const format = text => inline(text).replace(/#285b4b/g, color)
  let headingCount = 0
  const paragraphs = String(body || '').replace(/\r\n?/g, '\n').split(/\n\s*\n|\n(?=#{1,3}\s)/).map(p => p.trim()).filter(Boolean)
  const slots = paragraphs.map(() => [])
  let articleLayoutSlot = 0
  images.forEach((image, index) => {
    if (!slots.length) return
    // Keep photo order chosen by the author; use captions when there is a clear match.
    const words = String(image.caption || '').match(/[\u4e00-\u9fff]{2,}|[a-zA-Z]{3,}/g) || []
    let target = Math.min(slots.length - 1, Math.floor((index + 1) * slots.length / (images.length + 1)))
    let best = 0
    paragraphs.forEach((p, i) => {
      const score = words.reduce((sum, word) => sum + (p.includes(word) ? word.length : 0), 0)
      if (score > best) { best = score; target = i }
    })
    // Monotonic placement preserves explicit image ordering from the editor.
    target = Math.max(target, articleLayoutSlot)
    slots[target].push(image)
    articleLayoutSlot = target
  })
  function photo(image) {
    const url = String(image.url || '')
    if (!/^https?:\/\//i.test(url)) return ''
    return `<section style="margin:26px 0;padding:7px;border:1px solid ${border};background:#ffffff;border-radius:3px;"><img src="${escapeHtml(url)}" alt="${escapeHtml(image.caption || '活动照片')}" style="display:block;width:100%;height:auto;border-radius:2px;"/><p style="margin:10px 4px 5px;text-align:center;font-size:12px;line-height:1.7;letter-spacing:1px;color:${ink};">${image.caption ? escapeHtml(image.caption) : '— 精彩瞬间 —'}</p></section>`
  }
  const content = paragraphs.map((p, i) => {
    let html
    // Recognize explicit headings, including common Chinese section numbering.
    const heading = /^#{1,3}\s+/.test(p) || (p.length <= 32 && !/[。！？!?\n]/.test(p) && /^(?:[一二三四五六七八九十]+[、．.]|[（(][一二三四五六七八九十0-9]+[）)]|\d+[、．.])/.test(p))
    if (heading) {
      headingCount++
      html = `<section style="margin:32px 0 20px;"><p style="margin:0;color:${color};font-size:12px;font-weight:700;letter-spacing:3px;">CHAPTER ${String(headingCount).padStart(2, '0')}</p><h2 style="margin:7px 0 0;padding:12px 14px;border-left:4px solid ${color};background:${light};color:${color};font-size:19px;line-height:1.6;font-weight:700;">${format(p.replace(/^#{1,3}\s+/, ''))}</h2></section>`
    } else if (/^>\s?/.test(p)) {
      html = `<section style="margin:24px 0;padding:16px 20px;background:${light};border-left:3px solid ${border};color:${ink};font-size:15px;line-height:1.9;"><p style="font-size:32px;line-height:1;margin:0 0 4px;color:${color};">“</p>${format(p.replace(/^>\s?/gm, ''))}</section>`
    } else if (i === 0) {
      html = `<section style="margin:0 0 28px;padding:20px 18px;background:${light};border:1px solid ${border};border-radius:4px;"><p style="margin:0 0 12px;font-size:11px;letter-spacing:3px;font-weight:700;color:${color};">卷首 · OPENING</p><p style="margin:0;font-size:16px;line-height:1.95;color:${ink};text-align:justify;">${format(p)}</p></section>`
    } else {
      const divider = i > 1 && i % 2 === 0 && !slots[i - 1].length ? `<p style="text-align:center;margin:28px 0 22px;font-size:12px;letter-spacing:8px;color:${color};">◇ ─ ◇</p>` : ''
      html = divider + `<p style="margin:0 0 22px;font-size:16px;line-height:2;letter-spacing:0.5px;color:#333333;text-align:justify;overflow-wrap:break-word;">${format(p)}</p>`
    }
    return html + slots[i].map(photo).join('')
  }).join('')
  const title = options.title ? `<h1 style="margin:16px 0 18px;font-size:26px;line-height:1.55;font-weight:700;color:${color};">${escapeHtml(options.title)}</h1>` : ''
  return `<section style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;padding:8px 10px;background:#ffffff;"><section style="text-align:center;padding:22px 8px 26px;border-top:3px solid ${color};"><p style="margin:0;font-size:11px;letter-spacing:4px;color:${ink};">${theme.label}</p>${title}<p style="margin:12px 0 0;font-size:12px;letter-spacing:6px;color:${color};">── ◇ ──</p></section>${content}${paragraphs.length ? '' : images.map(photo).join('')}<section style="text-align:center;margin:36px 0 12px;padding:22px 12px;border-top:1px solid ${border};border-bottom:3px solid ${color};background:${light};"><p style="margin:0;color:${color};font-size:13px;letter-spacing:5px;">— END —</p><p style="margin:10px 0 0;color:${ink};font-size:12px;letter-spacing:2px;">共同记录 · 珍藏此刻</p></section></section>`
}
module.exports = { articleLayout, articleThemes }
