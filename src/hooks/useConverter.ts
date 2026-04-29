import { unified } from 'unified'
import remarkParse from 'remark-parse'
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
    .use(remarkToc, { heading: '目录', tight: true })
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
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
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const result = await convertMarkdown(markdown, theme)
      setHtml(result)
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [markdown, theme])

  return html
}
