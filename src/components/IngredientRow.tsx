'use client'
import { useState } from 'react'
import { scaleQuantity } from '@/lib/scaling'

type Props = {
  id: string; name: string; quantity: number | null; unit: string | null
  notes: string | null; defaultServings: number; currentServings: number
}

export function IngredientRow({ id, name, quantity, unit, notes, defaultServings, currentServings }: Props) {
  const [substitutes, setSubstitutes] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const scaledQty = scaleQuantity(quantity, defaultServings, currentServings)

  async function toggleSubstitutes() {
    if (substitutes !== null) { setSubstitutes(null); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/ingredients/${id}/substitutes`)
      const data = await res.json()
      setSubstitutes(data.substitutes ?? [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <li
      className="py-2.5"
      style={{ borderBottom: '1px solid var(--color-border-light)' }}
    >
      <div className="flex items-center gap-3">
        <span
          className="w-24 shrink-0 text-sm tabular-nums"
          style={{ color: 'var(--color-terracotta)', fontWeight: 500 }}
        >
          {scaledQty ?? ''} {unit}
        </span>
        <span className="flex-1 text-sm" style={{ color: 'var(--color-ink)' }}>{name}</span>
        {notes && (
          <span className="text-sm" style={{ color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
            {notes}
          </span>
        )}
        <button
          onClick={toggleSubstitutes}
          className="text-xs shrink-0 transition-colors duration-200"
          style={{
            color: 'var(--color-sage)',
            fontWeight: 500,
            textDecoration: 'underline',
            textDecorationColor: 'transparent',
            textUnderlineOffset: '2px',
          }}
          onMouseEnter={(e) => e.currentTarget.style.textDecorationColor = 'var(--color-sage)'}
          onMouseLeave={(e) => e.currentTarget.style.textDecorationColor = 'transparent'}
        >
          {loading ? (
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
              <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ) : substitutes !== null ? 'Hide' : 'Substitutes'}
        </button>
      </div>
      {substitutes !== null && (
        <div className="mt-2 ml-24 pl-3" style={{ borderLeft: '2px solid var(--color-sage-light)' }}>
          {substitutes.length === 0
            ? <p className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>No substitutes found.</p>
            : <ul className="space-y-1">
                {substitutes.map((s, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--color-ink-light)' }}>
                    <span style={{ color: 'var(--color-sage)', marginTop: '2px' }}>&bull;</span>
                    {s}
                  </li>
                ))}
              </ul>}
        </div>
      )}
    </li>
  )
}
