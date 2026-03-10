'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ParsedRecipe = {
  title: string; description: string | null; imageUrl: string | null
  defaultServings: number
  ingredients: Array<{ name: string; quantity: number | null; unit: string | null; notes: string | null }>
  steps: string[]; sourceUrl: string
}

export function RecipeReviewForm({ recipe, onCancel }: { recipe: ParsedRecipe; onCancel: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState(recipe)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe: form }),
      })
      if (!res.ok) { setError('Failed to save recipe'); return }
      const saved = await res.json()
      router.push(`/recipes/${saved.id}`)
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background: 'var(--color-warm-white)',
    border: '1px solid var(--color-border)',
    borderRadius: '2px',
    color: 'var(--color-ink)',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        className="pb-6 mb-2"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <p
          className="text-xs tracking-wide uppercase mb-4"
          style={{ color: 'var(--color-sage)', fontWeight: 600, letterSpacing: '0.1em' }}
        >
          Review before saving
        </p>
        {recipe.imageUrl && (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-48 object-cover mb-5"
            style={{ borderRadius: '4px' }}
          />
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-xs tracking-wide uppercase mb-1.5" style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}>
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 text-lg outline-none"
              style={{ ...inputStyle, fontFamily: 'var(--font-display)' }}
            />
          </div>
          <div>
            <label className="block text-xs tracking-wide uppercase mb-1.5" style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}>
              Servings
            </label>
            <input
              type="number"
              min={1}
              value={form.defaultServings}
              onChange={(e) => setForm({ ...form, defaultServings: parseInt(e.target.value) || 1 })}
              className="w-20 px-3 py-2.5 text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <h3
          className="text-xs tracking-wide uppercase mb-3"
          style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
        >
          Ingredients ({form.ingredients.length})
        </h3>
        <ul className="space-y-1">
          {form.ingredients.map((ing, i) => (
            <li
              key={i}
              className="flex gap-3 py-2 text-sm"
              style={{ borderBottom: '1px solid var(--color-border-light)' }}
            >
              <span className="w-24 shrink-0 tabular-nums" style={{ color: 'var(--color-terracotta)', fontWeight: 500 }}>
                {ing.quantity} {ing.unit}
              </span>
              <span style={{ color: 'var(--color-ink)' }}>{ing.name}</span>
              {ing.notes && <span style={{ color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>{ing.notes}</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      <div>
        <h3
          className="text-xs tracking-wide uppercase mb-3"
          style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
        >
          Instructions ({form.steps.length} steps)
        </h3>
        <ol className="space-y-3">
          {form.steps.map((step, i) => (
            <li key={i} className="flex gap-4 text-sm" style={{ lineHeight: 1.7 }}>
              <span
                className="shrink-0 w-6 h-6 flex items-center justify-center text-xs font-medium mt-0.5"
                style={{
                  background: 'var(--color-border-light)',
                  color: 'var(--color-ink-muted)',
                  borderRadius: '50%',
                }}
              >
                {i + 1}
              </span>
              <p style={{ color: 'var(--color-ink-light)' }}>{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      {error && (
        <p className="text-sm py-2 px-3" style={{ color: '#b44a3e', background: '#fef2f0', borderRadius: '2px' }}>
          {error}
        </p>
      )}
      <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 disabled:opacity-50"
          style={{
            background: 'var(--color-terracotta)',
            color: 'var(--color-warm-white)',
            borderRadius: '2px',
          }}
        >
          {saving ? 'Saving...' : 'Save to Collection'}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-3 text-sm transition-all duration-200"
          style={{
            color: 'var(--color-ink-muted)',
            border: '1px solid var(--color-border)',
            borderRadius: '2px',
            background: 'transparent',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
