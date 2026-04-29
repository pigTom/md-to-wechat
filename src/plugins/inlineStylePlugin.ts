import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'
import type { Plugin } from 'unified'
import type { Theme } from '../themes/index'

export const inlineStylePlugin: Plugin<[Theme], Root> = (theme) => {
  return (tree) => {
    visit(tree, 'element', (node: Element) => {
      const props = node.properties ?? {}
      const classes = (props.className as string[]) ?? []

      // Preserve KaTeX elements — they need class-based CSS to render math
      if (classes.some(cls => String(cls).startsWith('katex'))) {
        node.properties = props
        return
      }

      // Merge theme style for this tag with any existing style (preserves plugin-injected styles)
      const themeStyle = theme.styles[node.tagName] ?? ''
      const existingStyle = String(props.style ?? '')
      props.style = mergeStyles(existingStyle, themeStyle)

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
  if (!existing) return incoming
  if (!incoming) return existing
  const base = existing.trimEnd()
  return base.endsWith(';') ? base + incoming : base + ';' + incoming
}
