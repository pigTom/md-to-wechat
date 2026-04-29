import { render, screen } from '@testing-library/react'
import { Preview } from './Preview'

describe('Preview', () => {
  it('renders html content', () => {
    render(<Preview html="<p>Hello</p>" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('shows empty state text when html is empty', () => {
    render(<Preview html="" />)
    expect(screen.getByText(/在左侧输入/i)).toBeInTheDocument()
  })

  it('renders panel title', () => {
    render(<Preview html="<p>test</p>" />)
    expect(screen.getByText('微信预览')).toBeInTheDocument()
  })
})
