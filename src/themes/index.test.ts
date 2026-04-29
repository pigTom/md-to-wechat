import { themes, type Theme } from './index'

describe('themes', () => {
  it('exports 4 themes', () => {
    expect(themes).toHaveLength(4)
  })

  it('each theme has required fields', () => {
    themes.forEach((theme: Theme) => {
      expect(theme.id).toBeTruthy()
      expect(theme.name).toBeTruthy()
      expect(theme.accentColor).toBeTruthy()
      expect(typeof theme.styles).toBe('object')
      expect(typeof theme.hljs).toBe('object')
    })
  })

  it('each theme styles covers required tags', () => {
    const requiredTags = ['h1', 'h2', 'h3', 'p', 'blockquote', 'pre', 'code', 'strong', 'em', 'li']
    themes.forEach((theme: Theme) => {
      requiredTags.forEach(tag => {
        expect(theme.styles[tag], `${theme.id} missing style for ${tag}`).toBeTruthy()
      })
    })
  })
})
