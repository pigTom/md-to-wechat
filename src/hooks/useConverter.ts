import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkToc from 'remark-toc'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import { useEffect, useState, useRef } from 'react'
import { inlineStylePlugin } from '../plugins/inlineStylePlugin'
import type { Theme } from '../themes/index'

export async function convertMarkdown(markdown: string, theme: Theme): Promise<string> {
  if (!markdown.trim()) return ''

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkToc, { heading: '目录', tight: true })
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex, { output: 'mathml' })
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(inlineStylePlugin, theme)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown)

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
