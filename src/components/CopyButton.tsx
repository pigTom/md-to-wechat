import { useState, useCallback } from 'react'

type CopyButtonProps = {
  html: string
  contentRef: React.RefObject<HTMLDivElement | null>
}

export function CopyButton({ html, contentRef }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    const el = contentRef.current
    if (!el || !html) return

    const range = document.createRange()
    range.selectNodeContents(el)
    const selection = window.getSelection()
    if (!selection) return
    selection.removeAllRanges()
    selection.addRange(range)
    document.execCommand('copy')
    selection.removeAllRanges()

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [html, contentRef])

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
