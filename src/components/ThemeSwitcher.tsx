import { themes, type Theme } from '../themes/index'

type ThemeSwitcherProps = {
  current: Theme
  onChange: (theme: Theme) => void
}

export function ThemeSwitcher({ current, onChange }: ThemeSwitcherProps) {
  return (
    <div className="theme-switcher">
      {themes.map(theme => (
        <button
          key={theme.id}
          className="theme-btn"
          title={theme.name}
          data-active={theme.id === current.id ? 'true' : 'false'}
          onClick={() => onChange(theme)}
          style={{ '--accent': theme.accentColor } as React.CSSProperties}
        >
          <span className="theme-dot" style={{ background: theme.accentColor }} />
          <span className="theme-name">{theme.name}</span>
        </button>
      ))}
    </div>
  )
}
