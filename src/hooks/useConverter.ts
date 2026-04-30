import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkToc from 'remark-toc'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import { useEffect, useState, useRef } from 'react'
import { inlineStylePlugin } from '../plugins/inlineStylePlugin'
import { dotPlugin } from '../plugins/dotPlugin'
import type { Theme } from '../themes/index'

let rehypeKatexPromise: Promise<typeof import('rehype-katex').default> | null = null
function loadRehypeKatex() {
  if (!rehypeKatexPromise) {
    rehypeKatexPromise = import('rehype-katex').then(m => m.default)
  }
  return rehypeKatexPromise
}

export async function convertMarkdown(markdown: string, theme: Theme): Promise<string> {
  if (!markdown.trim()) return ''

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkToc, { heading: '目录', tight: true })
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })

  // KaTeX is only needed when the document actually contains math.
  if (markdown.includes('$')) {
    const rehypeKatex = await loadRehypeKatex()
    processor.use(rehypeKatex, { output: 'mathml' })
  }

  processor
    .use(dotPlugin)
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(inlineStylePlugin, theme)
    .use(rehypeStringify, { allowDangerousHtml: true })

  const result = await processor.process(markdown)
  return String(result)
}

export function useConverter(markdown: string, theme: Theme): string {
  const [html, setHtml] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const result = await convertMarkdown(markdown, theme)
      if (!cancelled) setHtml(result)
    }, 300)

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [markdown, theme])

  return html
}
