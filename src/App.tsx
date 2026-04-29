import { useState } from 'react'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { CopyButton } from './components/CopyButton'
import { useConverter } from './hooks/useConverter'
import { defaultTheme, type Theme } from './themes/index'
import { SAMPLE_MARKDOWN } from './constants/sampleMarkdown'

export default function App() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN)
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const html = useConverter(markdown, theme)

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">MD2WeChat</span>
        </div>
        <div className="header-center">
          <ThemeSwitcher current={theme} onChange={setTheme} />
        </div>
        <div className="header-right">
          <CopyButton html={html} />
        </div>
      </header>
      <main className="app-main">
        <Editor value={markdown} onChange={setMarkdown} />
        <div className="divider" />
        <Preview html={html} />
      </main>
    </div>
  )
}
