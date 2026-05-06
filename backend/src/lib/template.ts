// Convert markdown to WeChat Official Account compatible HTML

export function markdownToWeChatHTML(markdown: string, images: { index: number; url: string }[]): string {
  let html = markdown
    // Headers
    .replace(/^### (.+)$/gm, '<h3 style="font-size: 16px;font-weight: bold;margin: 15px 0 8px 0;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size: 17px;font-weight: bold;margin: 15px 0 8px 0;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h2 style="font-size: 17px;font-weight: bold;margin: 15px 0 8px 0;">$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Image placeholders
    .replace(/\[图片：?(\d+)\]/g, (_, idx) => {
      const img = images.find(i => i.index === parseInt(idx))
      if (img) {
        return `<img src="${img.url}" style="width:100%;border-radius:4px;margin:10px 0;" />`
      }
      return ''
    })
    // Paragraphs - wrap remaining lines
    .split('\n')
    .map(line => {
      const trimmed = line.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('<')) return trimmed
      return `<p style="font-size: 15px;line-height: 1.8;margin: 8px 0;text-indent: 2em;">${trimmed}</p>`
    })
    .join('\n')

  // Wrap in a section
  html = `<section style="padding: 5px 10px;font-family: -apple-system, 'Helvetica Neue', sans-serif;color: #333;">\n${html}\n</section>`

  return html
}

export function buildWeChatHTML(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#fff;">
${bodyHtml}
</body>
</html>`
}
