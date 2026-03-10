'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ServingControl } from './ServingControl'
import { IngredientRow } from './IngredientRow'
import { TagInput } from './TagInput'

type Recipe = {
  id: string; title: string; description: string | null; imageUrl: string | null
  sourceUrl: string; defaultServings: number; tags: string[]; notes: string | null
  nutrition: {
    calories: number | null; protein: number | null; carbs: number | null
    fat: number | null; fibre: number | null; sugar: number | null; sodium: number | null
  } | null
  ingredients: Array<{ id: string; name: string; quantity: number | null; unit: string | null; notes: string | null }>
  steps: string[]
}

export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const router = useRouter()
  const [servings, setServings] = useState(recipe.defaultServings)
  const [notes, setNotes] = useState(recipe.notes ?? '')
  const [nutritionData, setNutritionData] = useState(recipe.nutrition)
  const [fetchingNutrition, setFetchingNutrition] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tags, setTags] = useState<string[]>(recipe.tags)
  const [allTags, setAllTags] = useState<string[]>([])
  const [tagsSaving, setTagsSaving] = useState(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tagsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-save notes after 800ms of inactivity
  function handleNotesChange(value: string) {
    setNotes(value)
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => saveNotes(value), 800)
  }

  async function saveNotes(value: string) {
    setSaving(true)
    try {
      await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: value || null }),
      })
    } finally {
      setSaving(false)
    }
  }

  // Fetch all tags on mount
  useEffect(() => {
    fetch('/api/tags').then((r) => r.json()).then(setAllTags).catch(() => {})
  }, [])

  // Save on unmount if pending
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      if (tagsTimeout.current) clearTimeout(tagsTimeout.current)
    }
  }, [])

  function handleTagsChange(newTags: string[]) {
    setTags(newTags)
    if (tagsTimeout.current) clearTimeout(tagsTimeout.current)
    tagsTimeout.current = setTimeout(async () => {
      setTagsSaving(true)
      try {
        await fetch(`/api/recipes/${recipe.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: newTags }),
        })
      } finally {
        setTagsSaving(false)
      }
    }, 800)
  }

  async function handleFetchNutrition() {
    setFetchingNutrition(true)
    try {
      const res = await fetch(`/api/recipes/${recipe.id}/nutrition`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setNutritionData(data)
      }
    } finally {
      setFetchingNutrition(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await fetch(`/api/recipes/${recipe.id}`, { method: 'DELETE' })
    router.push('/')
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <div className="animate-fade-up flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-10 transition-colors duration-200 hover:opacity-70"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to recipes
        </Link>
        <div className="mb-10">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>Are you sure?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs px-3 py-1.5 transition-all duration-200 disabled:opacity-50"
                style={{ background: '#b44a3e', color: '#fff', borderRadius: '2px', fontWeight: 500 }}
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-3 py-1.5 transition-all duration-200"
                style={{ color: 'var(--color-ink-muted)', border: '1px solid var(--color-border)', borderRadius: '2px' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 transition-all duration-200"
              style={{
                color: '#b44a3e',
                border: '1px solid #e8b4ae',
                borderRadius: '2px',
                background: '#fef2f0',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#b44a3e'
                e.currentTarget.style.color = '#fff'
                e.currentTarget.style.borderColor = '#b44a3e'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fef2f0'
                e.currentTarget.style.color = '#b44a3e'
                e.currentTarget.style.borderColor = '#e8b4ae'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Delete
            </button>
          )}
        </div>
      </div>

      {recipe.imageUrl && (
        <div className="overflow-hidden mb-8 animate-fade-up" style={{ borderRadius: '4px' }}>
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-72 object-cover"
          />
        </div>
      )}

      <div className="animate-fade-up" style={{ animationDelay: '50ms' }}>
        <h1
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
        >
          {recipe.title}
        </h1>
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm transition-colors duration-200"
          style={{ color: 'var(--color-sage)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
        >
          View original source
        </a>
        {recipe.description && (
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--color-ink-light)' }}>
            {recipe.description}
          </p>
        )}

        <div className="mt-4">
          <p className="text-xs tracking-wide uppercase mb-2" style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}>
            Taste Tags
          </p>
          <TagInput tags={tags} onChange={handleTagsChange} allTags={allTags} saving={tagsSaving} />
        </div>
      </div>

      {/* Serving control */}
      <div
        className="my-8 py-5 animate-fade-up"
        style={{
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
          animationDelay: '100ms',
        }}
      >
        <ServingControl value={servings} onChange={setServings} />
      </div>

      {/* Nutrition */}
      <section className="mb-10 animate-fade-up" style={{ animationDelay: '120ms' }}>
        <h2
          className="text-xs tracking-wide uppercase mb-4"
          style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
        >
          Nutrition <span style={{ fontWeight: 400 }}>(per serving)</span>
        </h2>
        {nutritionData ? (
          <div className="grid grid-cols-4 gap-3">
            {([
              ['Calories', nutritionData.calories, 'kcal'],
              ['Protein', nutritionData.protein, 'g'],
              ['Carbs', nutritionData.carbs, 'g'],
              ['Fat', nutritionData.fat, 'g'],
              ['Fibre', nutritionData.fibre, 'g'],
              ['Sugar', nutritionData.sugar, 'g'],
              ['Sodium', nutritionData.sodium, 'mg'],
            ] as const).map(([label, value, unit]) => (
              value !== null && (
                <div key={label} className="text-center py-3" style={{ background: 'var(--color-border-light)', borderRadius: '2px' }}>
                  <p className="text-lg tabular-nums" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-terracotta)', fontWeight: 600 }}>
                    {Math.round(value)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                    {unit} {label.toLowerCase()}
                  </p>
                </div>
              )
            ))}
          </div>
        ) : (
          <button
            onClick={handleFetchNutrition}
            disabled={fetchingNutrition}
            className="flex items-center gap-2 text-sm px-4 py-2.5 transition-all duration-200 disabled:opacity-50"
            style={{
              color: 'var(--color-sage)',
              border: '1px solid var(--color-sage-light)',
              borderRadius: '2px',
              background: 'var(--color-warm-white)',
              fontWeight: 500,
            }}
          >
            {fetchingNutrition ? 'Fetching...' : 'Fetch nutrition info'}
          </button>
        )}
      </section>

      {/* Ingredients */}
      <section className="mb-10 animate-fade-up" style={{ animationDelay: '150ms' }}>
        <h2
          className="text-xs tracking-wide uppercase mb-4"
          style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
        >
          Ingredients ({recipe.ingredients.length})
        </h2>
        <ul>
          {recipe.ingredients.map((ing) => (
            <IngredientRow
              key={ing.id}
              {...ing}
              defaultServings={recipe.defaultServings}
              currentServings={servings}
            />
          ))}
        </ul>
      </section>

      {/* Instructions */}
      <section className="mb-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
        <h2
          className="text-xs tracking-wide uppercase mb-4"
          style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
        >
          Instructions ({recipe.steps.length} steps)
        </h2>
        <ol className="space-y-4">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-4 text-sm" style={{ lineHeight: 1.7 }}>
              <span
                className="shrink-0 w-7 h-7 flex items-center justify-center text-xs font-medium mt-0.5"
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
      </section>

      {/* Notes */}
      <section className="animate-fade-up" style={{ animationDelay: '250ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <h2
            className="text-xs tracking-wide uppercase"
            style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
          >
            My Notes
          </h2>
          {saving && (
            <span className="text-xs" style={{ color: 'var(--color-sage)' }}>Saving...</span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add your personal notes, tweaks, or tips..."
          rows={4}
          className="w-full px-4 py-3 text-sm outline-none resize-y transition-all duration-200"
          style={{
            background: 'var(--color-warm-white)',
            border: '1px solid var(--color-border)',
            borderRadius: '2px',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.7,
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-terracotta)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
        />
      </section>
    </main>
  )
}
