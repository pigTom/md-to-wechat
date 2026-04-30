import { visit } from 'unist-util-visit'
import type { Root, Element, Node, Text } from 'hast'
import type { Plugin } from 'unified'
import type { Viz } from '@viz-js/viz'

const DOT_LANGUAGES = new Set(['language-dot', 'language-graphviz'])

let vizPromise: Promise<Viz> | null = null
function getViz(): Promise<Viz> {
  if (!vizPromise) {
    vizPromise = import('@viz-js/viz').then(m => m.instance())
  }
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
      if (result.status !== 'success') {
        parent.children[index] = errorBlock(
          result.errors.map(e => e.message).join('\n') || 'render failed',
        )
        continue
      }
      const svg = (result.output ?? '').replace(/<\?xml[^?]*\?>\s*/, '').trim()
      // WeChat's pasted-image whitelist is bmp/png/jpeg/gif/webp — SVG data URLs are
      // dropped on paste. Rasterize to PNG client-side; fall back to SVG only when
      // the browser APIs are unavailable (e.g. jsdom in tests).
      const png = await svgToPngDataUrl(svg)
      const src = png ?? `data:image/svg+xml,${encodeURIComponent(svg)}`
      parent.children[index] = imgNode(src)
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

function imgNode(src: string): Element {
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

async function svgToPngDataUrl(svg: string): Promise<string | null> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return null
  // Probe canvas capability before kicking off the async Image load. jsdom (test
  // env) returns null here and we bail out — without this guard, jsdom would
  // accept the URL.createObjectURL + Image() calls but never fire onload, and
  // every test using dotPlugin would hang on the 5s timeout.
  if (!document.createElement('canvas').getContext('2d')) return null

  let url: string | null = null
  try {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    url = URL.createObjectURL(blob)
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('svg image load timeout')),
        4000,
      )
      img.onload = () => { clearTimeout(timeout); resolve() }
      img.onerror = () => { clearTimeout(timeout); reject(new Error('svg load failed')) }
      img.src = url!
    })
    const w = img.naturalWidth || img.width
    const h = img.naturalHeight || img.height
    if (!w || !h) return null
    const scale = 2 // render at 2x for sharpness on retina
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.scale(scale, scale)
    // Paint a white background so the PNG isn't transparent — keeps the diagram
    // legible against any WeChat editor / reader theme.
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0)
    const dataUrl = canvas.toDataURL('image/png')
    return dataUrl.startsWith('data:image/png') ? dataUrl : null
  } catch {
    return null
  } finally {
    if (url) URL.revokeObjectURL(url)
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
