import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopyButton } from './CopyButton'

const mockWrite = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  mockWrite.mockClear()
  Object.defineProperty(navigator, 'clipboard', {
    value: { write: mockWrite },
    configurable: true,
    writable: true,
  })
})

describe('CopyButton', () => {
  it('renders copy button label', () => {
    render(<CopyButton html="<p>test</p>" />)
    expect(screen.getByRole('button', { name: /复制到微信/i })).toBeInTheDocument()
  })

  it('calls clipboard.write with text/html ClipboardItem', async () => {
    render(<CopyButton html="<p>test</p>" />)
    await userEvent.click(screen.getByRole('button'))
    expect(mockWrite).toHaveBeenCalledTimes(1)
    const [items] = mockWrite.mock.calls[0]
    expect(items[0]).toBeInstanceOf(ClipboardItem)
  })

  it('shows success feedback after copy', async () => {
    render(<CopyButton html="<p>test</p>" />)
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByText(/已复制/i)).toBeInTheDocument()
  })

  it('reverts label to original after 2 seconds', async () => {
    vi.useFakeTimers()
    render(<CopyButton html="<p>test</p>" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    expect(screen.getByText(/已复制/i)).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByText(/复制到微信/i)).toBeInTheDocument()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is disabled when html is empty', () => {
    render(<CopyButton html="" />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
