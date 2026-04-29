import { useState, useCallback } from 'react'

type CopyButtonProps = { html: string }

export function CopyButton({ html }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!html) return
    await navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [html])

  return (
    <button
      className={`copy-btn${copied ? ' copy-btn--success' : ''}`}
      onClick={handleCopy}
      disabled={!html}
    >
      {copied ? '✓ 已复制' : '复制到微信'}
    </button>
  )
}
