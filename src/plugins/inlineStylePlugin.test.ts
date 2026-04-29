import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import { inlineStylePlugin } from './inlineStylePlugin'
import { wechatGreen } from '../themes/wechat-green'

function process(md: string) {
  return unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(inlineStylePlugin, wechatGreen)
    .use(rehypeStringify)
    .processSync(md)
    .toString()
}

describe('inlineStylePlugin', () => {
  it('injects h1 theme styles', () => {
    const html = process('# Hello')
    expect(html).toContain('font-size:24px')
    expect(html).toContain('Hello')
  })

  it('injects paragraph theme styles', () => {
    const html = process('A paragraph.')
    expect(html).toContain('font-size:15px')
  })

  it('injects blockquote theme styles', () => {
    const html = process('> A quote')
    expect(html).toContain('border-left:3px solid #07c160')
  })

  it('removes class attributes from regular elements', () => {
    const html = process('# Title\n\nParagraph')
    expect(html).not.toContain('class="')
  })

  it('converts hljs-keyword class to inline color style', () => {
    const html = process('```js\nconst x = 1\n```')
    expect(html).not.toContain('class="hljs')
    expect(html).toMatch(/color:#07c160/)
  })

  it('removes href from anchor tags', () => {
    const html = process('[link](https://example.com)')
    expect(html).not.toContain('href=')
    expect(html).toContain('>link<')
  })

  it('preserves existing inline styles when merging', () => {
    // pre gets theme style; code inside also gets theme style — no overwrite
    const html = process('```js\ncode\n```')
    expect(html).toContain('background:#f5f5f5')  // pre style
    expect(html).toContain('font-family:monospace') // code style
  })
})
