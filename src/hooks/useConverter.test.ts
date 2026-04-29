import { renderHook, act } from '@testing-library/react'
import { convertMarkdown, useConverter } from './useConverter'
import { wechatGreen } from '../themes/wechat-green'

describe('convertMarkdown', () => {
  it('converts heading to styled h1', async () => {
    const html = await convertMarkdown('# Hello', wechatGreen)
    expect(html).toContain('<h1')
    expect(html).toContain('font-size:24px')
    expect(html).toContain('Hello')
  })

  it('converts paragraph with theme styles', async () => {
    const html = await convertMarkdown('A paragraph.', wechatGreen)
    expect(html).toContain('<p')
    expect(html).toContain('font-size:15px')
  })

  it('syntax-highlights code block and removes class attrs', async () => {
    const html = await convertMarkdown('```js\nconst x = 1\n```', wechatGreen)
    expect(html).toContain('<pre')
    expect(html).not.toContain('class=')
  })

  it('removes href from links', async () => {
    const html = await convertMarkdown('[link](https://example.com)', wechatGreen)
    expect(html).not.toContain('href=')
    expect(html).toContain('link')
  })

  it('returns empty string for empty input', async () => {
    const html = await convertMarkdown('', wechatGreen)
    expect(html.trim()).toBe('')
  })

  it('handles bold and italic', async () => {
    const html = await convertMarkdown('**bold** and *italic*', wechatGreen)
    expect(html).toContain('<strong')
    expect(html).toContain('<em')
  })

  it('expands ## 目录 into a TOC list', async () => {
    const md = '## 目录\n\n## Section One\n\nContent\n\n## Section Two\n\nContent'
    const html = await convertMarkdown(md, wechatGreen)
    expect(html).toContain('Section One')
    expect(html).toContain('Section Two')
    // TOC list items should appear before the first section
    expect(html.indexOf('Section One')).toBeLessThan(html.lastIndexOf('Section One'))
  })
})

describe('useConverter hook', () => {
  it('debounces and returns html after 300ms', async () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ md }: { md: string }) => useConverter(md, wechatGreen),
      { initialProps: { md: '' } }
    )
    expect(result.current).toBe('')
    rerender({ md: '# Hi' })
    await act(() => vi.runAllTimersAsync())
    expect(result.current).toContain('<h1')
    vi.useRealTimers()
  })
})
