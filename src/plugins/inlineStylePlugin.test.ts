import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import { inlineStylePlugin } from './inlineStylePlugin'
import { wechatGreen } from '../themes/wechat-green'

function process(md: string) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(inlineStylePlugin, wechatGreen)
    .use(rehypeStringify)
    .processSync(md)
    .toString()
}

function processWithMath(md: string) {
  return unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex, { output: 'mathml' })
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
    expect(html).toContain('monospace') // code font-family stack
  })

  it('inlines white-space:pre on <pre> so WeChat keeps indentation', () => {
    const html = process('```ts\nfunction f() {\n  return 1\n}\n```')
    expect(html).toContain('white-space:pre')
    expect(html).toContain('tab-size:2')
  })

  it('inlines task-list checkbox as a single ☐ + text run inside <li>', () => {
    const html = process('- [ ] todo item\n')
    expect(html).not.toContain('<input')
    expect(html).not.toContain('<span')
    // li content should be exactly "☐ todo item" with no element wrapper inside
    expect(html).toMatch(/<li[^>]*>☐ todo item<\/li>/)
  })

  it('inlines checked task-list checkbox as ☑ + text', () => {
    const html = process('- [x] done item\n')
    expect(html).not.toContain('<input')
    expect(html).toMatch(/<li[^>]*>☑ done item<\/li>/)
  })

  it('wraps mixed <strong> + text inside <li> into a single <span>', () => {
    const html = process('1. **专注** - 一个明确的问题域\n')
    expect(html).toMatch(/<li[^>]*><span style="display:inline;[^"]*"><strong/)
    expect(html).toContain('一个明确的问题域')
  })

  it('does not wrap pure-text <li> content', () => {
    const html = process('- just plain text\n')
    expect(html).not.toMatch(/<li[^>]*><span style="display:inline/)
  })

  it('does not wrap <li> with a single inline element', () => {
    const html = process('- **only bold**\n')
    expect(html).not.toMatch(/<li[^>]*><span style="display:inline/)
  })

  it('preserves nested sub-lists when wrapping <li> inline run', () => {
    const html = process('1. **bold** text\n   - sub one\n')
    // inline run wrapped, but <ul> sub-list still present at <li> top level
    expect(html).toMatch(/<li[^>]*><span style="display:inline;[^"]*"><strong/)
    expect(html).toMatch(/<\/span>[\s\S]*<ul/)
  })

  it('removes disc bullet on task-list <ul>', () => {
    const html = process('- [ ] one\n- [x] two\n')
    expect(html).toMatch(/<ul[^>]*list-style:none/)
  })

  it('replaces newlines in <pre> with <br> and leading spaces with U+00A0', () => {
    const html = process('```ts\nfunction f() {\n  return 1\n}\n```')
    expect(html).toContain('<br>')
    // U+00A0 (no-break space) replaces the 2-space indent that precedes a line
    expect(html).toMatch(/<br>  /)
    // raw "\n  return" (newline + ASCII spaces) should no longer appear in code
    expect(html).not.toMatch(/\n {2}return/)
  })

  it('renders inline math as <img> with SVG src and inline styles', () => {
    const html = processWithMath('Energy: $E=mc^2$ done.')
    expect(html).not.toContain('<math')
    expect(html).not.toContain('class="math')
    expect(html).toContain('<img')
    expect(html).toContain('src="https://www.zhihu.com/equation?tex=E%3Dmc%5E2"')
    expect(html).toContain('alt="E=mc^2"')
    expect(html).toContain('display:inline-block')
    expect(html).toContain('vertical-align:middle')
  })

  it('renders display math as block <img>', () => {
    const html = processWithMath('$$\n\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}\n$$')
    expect(html).not.toContain('<math')
    expect(html).toContain('<img')
    expect(html).toMatch(/src="https:\/\/www\.zhihu\.com\/equation\?tex=[^"]*sum/)
    expect(html).toContain('display:block')
    expect(html).toContain('margin:1em auto')
  })
})
