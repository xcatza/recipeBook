'use client'

export type MacroKey = 'calories' | 'protein' | 'carbs' | 'fat' | 'fibre' | 'sugar' | 'sodium'
export type SortDirection = 'desc' | 'asc'
export type SortState = { macro: MacroKey; direction: SortDirection } | null

const MACROS: { key: MacroKey; label: string }[] = [
  { key: 'calories', label: 'Calories' },
  { key: 'protein', label: 'Protein' },
  { key: 'carbs', label: 'Carbs' },
  { key: 'fat', label: 'Fat' },
  { key: 'fibre', label: 'Fibre' },
  { key: 'sugar', label: 'Sugar' },
  { key: 'sodium', label: 'Sodium' },
]

export function SortBar({ sort, onChange }: { sort: SortState; onChange: (s: SortState) => void }) {
  return (
    <div
      className="flex items-center gap-3 flex-wrap py-4 mb-8"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <span
        className="text-xs tracking-wide uppercase shrink-0"
        style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
      >
        Sort by
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {MACROS.map(({ key, label }) => {
          const isActive = sort?.macro === key
          return (
            <button
              key={key}
              onClick={() => {
                if (!isActive) {
                  onChange({ macro: key, direction: 'desc' })
                } else if (sort.direction === 'desc') {
                  onChange({ macro: key, direction: 'asc' })
                } else {
                  onChange(null)
                }
              }}
              className="text-xs px-2.5 py-1 transition-all duration-200"
              style={{
                borderRadius: '2px',
                fontWeight: 500,
                background: isActive ? 'var(--color-terracotta)' : 'transparent',
                color: isActive ? 'var(--color-warm-white)' : 'var(--color-ink-muted)',
                border: isActive ? '1px solid var(--color-terracotta)' : '1px solid var(--color-border)',
              }}
            >
              {label}
              {isActive && (sort.direction === 'desc' ? ' ↓' : ' ↑')}
            </button>
          )
        })}
      </div>
      {sort && (
        <button
          onClick={() => onChange(null)}
          className="text-xs ml-auto transition-colors duration-200"
          style={{ color: 'var(--color-ink-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-terracotta)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-ink-muted)'}
        >
          Clear
        </button>
      )}
    </div>
  )
}
