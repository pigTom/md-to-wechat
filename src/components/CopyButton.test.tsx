import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopyButton } from './CopyButton'

function makeRef(el: HTMLDivElement | null) {
  return { current: el } as React.RefObject<HTMLDivElement>
}

beforeEach(() => {
  document.execCommand = vi.fn().mockReturnValue(true)
  const mockRange = { selectNodeContents: vi.fn() }
  document.createRange = vi.fn().mockReturnValue(mockRange)
  Object.defineProperty(window, 'getSelection', {
    value: () => ({ removeAllRanges: vi.fn(), addRange: vi.fn() }),
    configurable: true,
  })
})

describe('CopyButton', () => {
  it('renders copy button label', () => {
    render(<CopyButton html="<p>test</p>" contentRef={makeRef(null)} />)
    expect(screen.getByRole('button', { name: /复制到微信/i })).toBeInTheDocument()
  })

  it('calls execCommand copy when clicked', async () => {
    const div = document.createElement('div')
    render(<CopyButton html="<p>test</p>" contentRef={makeRef(div)} />)
    await userEvent.click(screen.getByRole('button'))
    expect(document.execCommand).toHaveBeenCalledWith('copy')
  })

  it('shows success feedback after copy', async () => {
    const div = document.createElement('div')
    render(<CopyButton html="<p>test</p>" contentRef={makeRef(div)} />)
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByText(/已复制/i)).toBeInTheDocument()
  })

  it('reverts label to original after 2 seconds', () => {
    vi.useFakeTimers()
    const div = document.createElement('div')
    render(<CopyButton html="<p>test</p>" contentRef={makeRef(div)} />)
    act(() => { screen.getByRole('button').click() })
    expect(screen.getByText(/已复制/i)).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByText(/复制到微信/i)).toBeInTheDocument()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is disabled when html is empty', () => {
    render(<CopyButton html="" contentRef={makeRef(null)} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
