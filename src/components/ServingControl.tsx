'use client'

export function ServingControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-4">
      <span
        className="text-xs tracking-wide uppercase"
        style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
      >
        Servings
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          className="w-9 h-9 flex items-center justify-center text-lg transition-all duration-200"
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: '2px',
            color: 'var(--color-ink-muted)',
            background: 'var(--color-warm-white)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-terracotta)'
            e.currentTarget.style.color = 'var(--color-terracotta)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.color = 'var(--color-ink-muted)'
          }}
        >
          {'\u2212'}
        </button>
        <span
          className="w-10 text-center text-lg tabular-nums"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-terracotta)', fontWeight: 600 }}
        >
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 flex items-center justify-center text-lg transition-all duration-200"
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: '2px',
            color: 'var(--color-ink-muted)',
            background: 'var(--color-warm-white)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-terracotta)'
            e.currentTarget.style.color = 'var(--color-terracotta)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.color = 'var(--color-ink-muted)'
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}
