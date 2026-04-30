import { visit, SKIP } from 'unist-util-visit'
import type { Root, Element, Text, ElementContent } from 'hast'
import type { Plugin } from 'unified'
import type { Theme } from '../themes/index'

const MATH_SVG_ENDPOINT = 'https://www.zhihu.com/equation?tex='

export const inlineStylePlugin: Plugin<[Theme], Root> = (theme) => {
  return (tree) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      const props = node.properties ?? {}
      const classes = (props.className as string[]) ?? []

      // GFM task list <li>: collapse the leading <input type="checkbox"> + surrounding
      // whitespace text nodes into a single inline ☐/☑ text run so WeChat can't split
      // the checkbox from the text into separate paragraphs.
      if (
        node.tagName === 'li' &&
        classes.some(c => String(c) === 'task-list-item')
      ) {
        flattenTaskListItem(node)
      } else if (node.tagName === 'li') {
        // Generic <li> with mixed inline element + text children (e.g. "**bold** text"):
        // WeChat wraps each top-level child of <li> in its own paragraph, breaking the
        // line. Wrap the leading inline run into a single <span> so WeChat sees one
        // child. Nested block children (sub-lists, paragraphs) are left alone.
        wrapLiInlineRun(node)
      }

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

      // GFM task list <ul class="contains-task-list">: drop the disc bullet
      // (the ☐/☑ glyph above replaces it).
      const isTaskList =
        node.tagName === 'ul' && classes.some(c => String(c) === 'contains-task-list')

      // Merge theme style for this tag with any existing style (existing wins over theme)
      const themeStyle = theme.styles[node.tagName] ?? ''
      const existingStyle = String(props.style ?? '')
      props.style = mergeStyles(themeStyle, existingStyle)
      if (isTaskList) {
        props.style = mergeStyles(String(props.style), 'list-style:none;padding-left:0;')
      }

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

    // Second pass: inside <pre> blocks, replace literal "\n" with <br> and convert
    // leading runs of spaces/tabs into U+00A0 (no-break) so indentation survives even
    // if WeChat strips white-space:pre from the inline style.
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'pre') return
      preserveCodeWhitespace(node)
      return SKIP
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

function flattenTaskListItem(li: Element) {
  const idx = li.children.findIndex(
    (c): c is Element =>
      c.type === 'element' &&
      c.tagName === 'input' &&
      String((c.properties ?? {}).type ?? '') === 'checkbox',
  )
  if (idx < 0) return
  const input = li.children[idx] as Element
  const inputProps = input.properties ?? {}
  const checked =
    inputProps.checked === true ||
    inputProps.checked === 'true' ||
    inputProps.checked === ''
  const glyph: Text = { type: 'text', value: checked ? '☑ ' : '☐ ' }

  // Sweep up leading whitespace-only text nodes that sit between the start
  // of the <li> and the checkbox — those are pretty-print artifacts that
  // would otherwise become extra blank space when WeChat re-flows the <li>.
  let startIdx = idx
  while (startIdx > 0) {
    const prev = li.children[startIdx - 1]
    if (prev.type === 'text' && /^\s*$/.test(prev.value)) startIdx--
    else break
  }
  li.children.splice(startIdx, idx - startIdx + 1, glyph)

  // Trim leading whitespace from whatever text follows so the result reads
  // as "☐ todo" rather than "☐  todo".
  const after = li.children[startIdx + 1]
  if (after && after.type === 'text') {
    after.value = after.value.replace(/^\s+/, '')
  }
}

// Tags that a <li> may contain as its own block-level descendants. Anything not
// in this set is treated as inline content and wrapped together; entries here
// are left in place so e.g. nested <ul>/<ol> still nest correctly.
const LI_BLOCK_CHILD_TAGS = new Set([
  'ul', 'ol', 'dl', 'p', 'div', 'blockquote', 'pre', 'table',
  'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure',
])

function wrapLiInlineRun(li: Element) {
  let blockIdx = li.children.findIndex(
    c => c.type === 'element' && LI_BLOCK_CHILD_TAGS.has(c.tagName),
  )
  if (blockIdx === -1) blockIdx = li.children.length
  if (blockIdx < 2) return // 0 or 1 inline children — nothing for WeChat to split

  const inlineRun = li.children.slice(0, blockIdx)
  // Pure-text inline runs are already a single text run after HTML normalization;
  // WeChat doesn't split those. We only need to defend when there's at least one
  // inline element (strong, em, code, a, …) sitting next to text.
  const hasInlineElement = inlineRun.some(c => c.type === 'element')
  if (!hasInlineElement) return

  const wrapper: Element = {
    type: 'element',
    tagName: 'span',
    properties: { style: 'display:inline;' },
    children: inlineRun as ElementContent[],
  }
  li.children.splice(0, blockIdx, wrapper)
}

function preserveCodeWhitespace(node: Element) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (child.type === 'text') {
      const replaced = expandWhitespace(child.value)
      if (replaced.length === 1 && replaced[0].type === 'text' && replaced[0].value === child.value) {
        continue
      }
      node.children.splice(i, 1, ...replaced)
      i += replaced.length - 1
    } else if (child.type === 'element') {
      preserveCodeWhitespace(child)
    }
  }
}

function expandWhitespace(value: string): ElementContent[] {
  if (!value.includes('\n') && !/^[ \t]+/.test(value)) {
    return [{ type: 'text', value }]
  }
  const parts = value.split('\n')
  const out: ElementContent[] = []
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) {
      out.push({ type: 'element', tagName: 'br', properties: {}, children: [] })
    }
    const piece = parts[i].replace(/^[ \t]+/, m => ' '.repeat(m.length))
    if (piece.length > 0) {
      out.push({ type: 'text', value: piece })
    }
  }
  return out
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
