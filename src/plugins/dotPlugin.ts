import { visit } from 'unist-util-visit'
import type { Root, Element, Node, Text } from 'hast'
import type { Plugin } from 'unified'
import { instance as vizInstance, type Viz } from '@viz-js/viz'

const DOT_LANGUAGES = new Set(['language-dot', 'language-graphviz'])

let vizPromise: Promise<Viz> | null = null
function getViz(): Promise<Viz> {
  if (!vizPromise) vizPromise = vizInstance()
  return vizPromise
}

interface Target {
  parent: { children: Node[] }
  index: number
  source: string
}

export const dotPlugin: Plugin<[], Root> = () => {
  return async (tree) => {
    const targets: Target[] = []

    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || !parent || typeof index !== 'number') return
      const code = node.children.find(
        (c): c is Element => c.type === 'element' && c.tagName === 'code',
      )
      if (!code) return
      const classes = (code.properties?.className as string[] | undefined) ?? []
      if (!classes.some(c => DOT_LANGUAGES.has(String(c)))) return
      const source = textOf(code)
      if (!source.trim()) return
      targets.push({ parent: parent as { children: Node[] }, index, source })
    })

    if (!targets.length) return

    const viz = await getViz()

    // Process in reverse so earlier indices stay valid as we replace.
    for (let i = targets.length - 1; i >= 0; i--) {
      const { parent, index, source } = targets[i]
      const result = viz.render(source, { format: 'svg' })
      parent.children[index] =
        result.status === 'success'
          ? svgToImg(result.output ?? '')
          : errorBlock(result.errors.map(e => e.message).join('\n') || 'render failed')
    }
  }
}

function textOf(el: Element): string {
  let out = ''
  visit(el, 'text', (n: Text) => {
    out += n.value
  })
  return out
}

function svgToImg(svg: string): Element {
  const cleaned = svg.replace(/<\?xml[^?]*\?>\s*/, '').trim()
  const src = `data:image/svg+xml,${encodeURIComponent(cleaned)}`
  return {
    type: 'element',
    tagName: 'img',
    properties: {
      src,
      alt: 'graphviz diagram',
      style: 'display:block;margin:1em auto;max-width:100%;',
    },
    children: [],
  }
}

function errorBlock(message: string): Element {
  return {
    type: 'element',
    tagName: 'pre',
    properties: {
      style:
        'color:#c00;background:#fee;border:1px solid #fcc;padding:8px 12px;border-radius:4px;white-space:pre-wrap;',
    },
    children: [{ type: 'text', value: `[graphviz] ${message}` }],
  }
}
