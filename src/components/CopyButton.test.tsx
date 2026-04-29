import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopyButton } from './CopyButton'

const mockWriteText = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  mockWriteText.mockClear()
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    configurable: true,
    writable: true,
  })
})

describe('CopyButton', () => {
  it('renders copy button label', () => {
    render(<CopyButton html="<p>test</p>" />)
    expect(screen.getByRole('button', { name: /复制到微信/i })).toBeInTheDocument()
  })

  it('calls clipboard.writeText with the html', async () => {
    render(<CopyButton html="<p>test</p>" />)
    await userEvent.click(screen.getByRole('button'))
    expect(mockWriteText).toHaveBeenCalledWith('<p>test</p>')
  })

  it('shows success feedback after copy', async () => {
    render(<CopyButton html="<p>test</p>" />)
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByText(/已复制/i)).toBeInTheDocument()
  })

  it('reverts label to original after 2 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
    render(<CopyButton html="<p>test</p>" />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByText(/已复制/i)).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByText(/复制到微信/i)).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('is disabled when html is empty', () => {
    render(<CopyButton html="" />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
