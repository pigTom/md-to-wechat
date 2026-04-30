import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { dotPlugin } from './dotPlugin'

async function process(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(dotPlugin)
    .use(rehypeStringify)
    .process(md)
  return file.toString()
}

describe('dotPlugin', () => {
  it('renders a digraph code block as an SVG data-URL <img>', async () => {
    const html = await process(
      '```dot\ndigraph { a -> b; }\n```',
    )
    expect(html).toContain('<img')
    expect(html).toContain('src="data:image/svg+xml,')
    expect(html).not.toContain('<pre>')
    expect(html).not.toContain('<code')
  })

  it('also accepts the language-graphviz alias', async () => {
    const html = await process(
      '```graphviz\ngraph { a -- b; }\n```',
    )
    expect(html).toContain('<img')
    expect(html).toContain('data:image/svg+xml')
  })

  it('leaves non-dot code blocks untouched', async () => {
    const html = await process(
      '```js\nconsole.log(1)\n```',
    )
    expect(html).toContain('<pre>')
    expect(html).toContain('console.log')
  })

  it('renders an error block on invalid DOT', async () => {
    const html = await process(
      '```dot\nthis is not graphviz {{{\n```',
    )
    expect(html).toContain('[graphviz]')
  })
})
