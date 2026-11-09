import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: '慧共创',
  description: '一起共创活动文章',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
