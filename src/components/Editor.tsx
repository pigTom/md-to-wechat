import { useRef, useCallback } from 'react'

const ALLOWED_EXTENSIONS = ['.md', '.txt']

type EditorProps = {
  value: string
  onChange: (value: string) => void
}

export function Editor({ value, onChange }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const readFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => onChange(ev.target?.result as string)
    reader.onerror = () => console.error('Failed to read file:', file.name)
    reader.readAsText(file)
  }, [onChange])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) readFile(file)
    e.target.value = ''
  }, [readFile])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
      readFile(file)
    }
  }, [readFile])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.currentTarget
      const start = el.selectionStart
      const end = el.selectionEnd
      onChange(value.substring(0, start) + '  ' + value.substring(end))
      requestAnimationFrame(() => {
        el.selectionStart = start + 2
        el.selectionEnd = start + 2
      })
    }
  }, [value, onChange])

  return (
    <div
      className="editor-panel"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="panel-toolbar">
        <span className="panel-title">Markdown</span>
        <button className="toolbar-btn" onClick={() => fileInputRef.current?.click()}>
          导入文件
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      <textarea
        className="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="在此输入 Markdown，或拖拽 .md / .txt 文件到此区域..."
        spellCheck={false}
      />
    </div>
  )
}
