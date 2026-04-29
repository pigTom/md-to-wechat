import { forwardRef } from 'react'

const EMPTY_STATE = `
<div style="text-align:center;padding:60px 20px;color:#bbb;">
  <div style="font-size:48px;margin-bottom:16px;">📄</div>
  <p style="font-size:15px;color:#999;margin-bottom:8px;">在左侧输入 Markdown 内容</p>
  <p style="font-size:13px;color:#bbb;">转换结果将在此处实时预览<br/>点击「复制到微信」可直接粘贴到公众号编辑器</p>
</div>
`

type PreviewProps = { html: string }

export const Preview = forwardRef<HTMLDivElement, PreviewProps>(({ html }, ref) => {
  return (
    <div className="preview-panel">
      <div className="panel-toolbar">
        <span className="panel-title">微信预览</span>
      </div>
      <div className="preview-scroll">
        <div
          ref={ref}
          className="preview-content"
          dangerouslySetInnerHTML={{ __html: html || EMPTY_STATE }}
        />
      </div>
    </div>
  )
})
Preview.displayName = 'Preview'
