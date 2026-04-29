import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from './Editor'

describe('Editor', () => {
  it('renders a textarea', () => {
    render(<Editor value="" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows current value in textarea', () => {
    render(<Editor value="# Hello" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveValue('# Hello')
  })

  it('calls onChange when user types', async () => {
    const onChange = vi.fn()
    render(<Editor value="" onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'h')
    expect(onChange).toHaveBeenCalled()
  })

  it('renders import file button', () => {
    render(<Editor value="" onChange={() => {}} />)
    expect(screen.getByText(/导入文件/i)).toBeInTheDocument()
  })

  it('reads .md file content on import', async () => {
    const onChange = vi.fn()
    render(<Editor value="" onChange={onChange} />)
    const file = new File(['# Imported'], 'test.md', { type: 'text/markdown' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, file)
    expect(onChange).toHaveBeenCalledWith('# Imported')
  })
})
