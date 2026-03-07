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

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input type="text" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Default Servings</label>
        <input type="number" min={1} value={form.defaultServings}
          onChange={(e) => setForm({ ...form, defaultServings: parseInt(e.target.value) || 1 })}
          className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Ingredients ({form.ingredients.length})</h3>
        <ul className="space-y-1 text-sm text-gray-700">
          {form.ingredients.map((ing, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-gray-400 w-20 shrink-0">{ing.quantity} {ing.unit}</span>
              <span>{ing.name}</span>
              {ing.notes && <span className="text-gray-400">({ing.notes})</span>}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Steps ({form.steps.length})</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          {form.steps.map((step, i) => <li key={i}>{step}</li>)}
        </ol>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
          {saving ? 'Saving...' : 'Save Recipe'}
        </button>
        <button onClick={onCancel}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
      </div>
    </div>
  )
}
