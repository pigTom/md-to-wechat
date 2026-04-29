import { visit, SKIP } from 'unist-util-visit'
import type { Root, Element, Text } from 'hast'
import type { Plugin } from 'unified'
import type { Theme } from '../themes/index'

const MATH_SVG_ENDPOINT = 'https://www.zhihu.com/equation?tex='

export const inlineStylePlugin: Plugin<[Theme], Root> = (theme) => {
  return (tree) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      const props = node.properties ?? {}
      const classes = (props.className as string[]) ?? []

      // rehype-katex (output:'mathml') wraps formulas in
      //   <span class="katex"><math [display="block"]>…<annotation encoding="application/x-tex">LATEX</annotation>…</math></span>
      // WeChat strips MathML and CSS classes, so the formula collapses to text.
      // Replace the wrapper with an <img> rendered by a remote LaTeX→SVG service.
      if (
        node.tagName === 'span' &&
        classes.some(c => String(c) === 'katex') &&
        parent &&
        typeof index === 'number'
      ) {
        const mathEl = node.children.find(
          (c): c is Element => c.type === 'element' && c.tagName === 'math'
        )
        const latex = mathEl ? extractTexAnnotation(mathEl) : null
        if (latex) {
          const isDisplay = (mathEl!.properties ?? {}).display === 'block'
          parent.children[index] = buildMathImage(latex, isDisplay)
          return SKIP
        }
      }

      // Preserve any remaining KaTeX HTML subtrees (defensive)
      if (classes.some(cls => String(cls).startsWith('katex'))) {
        return SKIP
      }

      // Preserve any remaining MathML subtrees (defensive)
      if (node.tagName === 'math') {
        return SKIP
      }

      // Merge theme style for this tag with any existing style (existing wins over theme)
      const themeStyle = theme.styles[node.tagName] ?? ''
      const existingStyle = String(props.style ?? '')
      props.style = mergeStyles(themeStyle, existingStyle)

      // Map hljs-* class names to inline color styles
      const hljsColor = classes
        .filter(cls => String(cls).startsWith('hljs-'))
        .map(cls => theme.hljs[String(cls)])
        .filter(Boolean)
        .map(color => `color:${color};`)
        .join('')

      if (hljsColor) {
        props.style = mergeStyles(String(props.style ?? ''), hljsColor)
      }

      // Strip all class attributes (WeChat ignores external CSS)
      delete props.className

      // Remove href from links (WeChat blocks external URLs)
      if (node.tagName === 'a') {
        delete props.href
      }

      node.properties = props
    })
  }
}

function mergeStyles(existing: string, incoming: string): string {
  if (!existing?.trim()) return incoming
  if (!incoming?.trim()) return existing
  const base = existing.trimEnd()
  return base.endsWith(';') ? base + incoming : base + ';' + incoming
}

function extractTexAnnotation(root: Element): string | null {
  let result: string | null = null
  visit(root, 'element', (n: Element) => {
    if (n.tagName !== 'annotation') return
    if ((n.properties ?? {}).encoding !== 'application/x-tex') return
    const text = n.children.find(c => c.type === 'text') as Text | undefined
    if (text) {
      result = text.value
      return false
    }
  })
  return result
}

function buildMathImage(latex: string, isDisplay: boolean): Element {
  const src = MATH_SVG_ENDPOINT + encodeURIComponent(latex)
  const style = isDisplay
    ? 'display:block;margin:1em auto;max-width:100%;'
    : 'display:inline-block;vertical-align:middle;margin:0 2px;'
  return {
    type: 'element',
    tagName: 'img',
    properties: { src, alt: latex, style },
    children: [],
  }
}
