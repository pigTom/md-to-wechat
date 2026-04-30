export const SAMPLE_MARKDOWN = `# 欢迎使用 MD2WeChat

这是一个将 Markdown 转换为**微信公众号**兼容格式的工具，所有样式均已内联。

## 目录

## 基本格式

**粗体文字**和*斜体文字*都支持。

> 这是一段引用内容，适合强调重要观点。

## 代码示例

\`\`\`javascript
const greet = (name) => {
  console.log(\`Hello, \${name}!\`)
}
greet('WeChat')
\`\`\`

行内代码：\`const x = 42\`

## 数学公式

行内公式：$E = mc^2$

块级公式：

$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$

## 列表

- 无序列表项一
- 无序列表项二
- 无序列表项三

1. 有序第一步
2. 有序第二步
3. 有序第三步

任务清单：

- [x] 已完成项
- [ ] 待办项一
- [ ] 待办项二

## 表格

| 功能 | 支持 |
|------|------|
| 代码高亮 | ✅ |
| 数学公式 | ✅ |
| 目录生成 | ✅ |
| 多主题 | ✅ |
| Graphviz | ✅ |

## Graphviz 图

\`\`\`dot
digraph G {
  rankdir=LR;
  node [shape=box, style=rounded];
  Markdown -> Remark -> Rehype -> WeChat;
}
\`\`\`
`
