import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeSwitcher } from './ThemeSwitcher'
import { themes } from '../themes/index'

describe('ThemeSwitcher', () => {
  it('renders all 4 theme buttons', () => {
    render(<ThemeSwitcher current={themes[0]} onChange={() => {}} />)
    themes.forEach(theme => {
      expect(screen.getByTitle(theme.name)).toBeInTheDocument()
    })
  })

  it('marks current theme as active', () => {
    render(<ThemeSwitcher current={themes[1]} onChange={() => {}} />)
    expect(screen.getByTitle(themes[1].name)).toHaveAttribute('data-active', 'true')
    expect(screen.getByTitle(themes[0].name)).toHaveAttribute('data-active', 'false')
  })

  it('calls onChange with the clicked theme', async () => {
    const onChange = vi.fn()
    render(<ThemeSwitcher current={themes[0]} onChange={onChange} />)
    await userEvent.click(screen.getByTitle(themes[1].name))
    expect(onChange).toHaveBeenCalledWith(themes[1])
  })
})
