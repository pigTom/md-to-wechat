import '@testing-library/jest-dom'

// jsdom does not implement ClipboardItem
if (typeof ClipboardItem === 'undefined') {
  Object.assign(globalThis, {
    ClipboardItem: class ClipboardItem {
      private data: Record<string, Blob>
      constructor(data: Record<string, Blob>) { this.data = data }
      async getType(type: string) { return this.data[type] }
      get types() { return Object.keys(this.data) }
    },
  })
}
