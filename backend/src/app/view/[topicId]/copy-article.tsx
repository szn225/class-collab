'use client'
import { useRef, useState } from 'react'
import { prepareWeChatArticle } from '@/lib/wechat-export'
export default function CopyArticle() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const copying = useRef(false)
  async function copy() {
    if (copying.current) return
    const article = document.getElementById('article-content')
    if (!article) return
    copying.current = true
    setBusy(true)
    setMessage('')
    setFailed(false)
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined')
        throw new Error('unsupported')
      const exported = prepareWeChatArticle(article)
      if (exported.localImages) throw new Error('local-images')
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([exported.html], { type: 'text/html' }),
          'text/plain': new Blob([exported.text], { type: 'text/plain' }),
        }),
      ])
      setMessage(exported.hasImages ? '正文已复制。请等待公众号处理图片；未出现的图片需通过编辑器上传，确认后再保存草稿。' : '正文已复制，请粘贴到公众号编辑器。')
    } catch {
      setFailed(true)
      setMessage('自动复制未成功，请点击下方按钮选中正文，再使用系统复制功能。')
    } finally {
      copying.current = false
      setBusy(false)
    }
  }
  function selectArticle() {
    const article = document.getElementById('article-content')
    if (!article) return
    const range = document.createRange()
    range.selectNodeContents(article)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    setMessage('正文已选中。电脑按 Ctrl+C（Mac：Cmd+C），手机请使用系统复制菜单。')
  }
  return (
    <section className="copy-panel" aria-labelledby="publish-title">
      <h2 id="publish-title">复制到公众号</h2>
      <p>复制后，在微信公众号后台新建图文并粘贴。</p>
      <button className="copy-button" onClick={copy} disabled={busy}>
        {busy ? '正在复制…' : '复制文章正文'}
      </button>
      <div className="copy-status" role="status" aria-live="polite">
        {message}
      </div>
      {failed ? (
        <button className="selection-button" onClick={selectArticle}>
          选中文章正文
        </button>
      ) : null}
      <p>发布前请核对标题、图片与排版。复制内容仅包含文章，不含本页操作说明。</p>
    </section>
  )
}
