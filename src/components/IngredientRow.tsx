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
    <li className="py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-gray-400 w-20 shrink-0 text-sm">{scaledQty ?? ''} {unit}</span>
        <span className="flex-1 text-gray-900">{name}</span>
        {notes && <span className="text-gray-400 text-sm">({notes})</span>}
        <button onClick={toggleSubstitutes} className="text-xs text-blue-600 hover:underline shrink-0">
          {loading ? '...' : substitutes !== null ? 'Hide' : 'Substitutes'}
        </button>
      </div>
      {substitutes !== null && (
        <div className="mt-1 pl-20">
          {substitutes.length === 0
            ? <p className="text-sm text-gray-400">No substitutes found.</p>
            : <ul className="text-sm text-gray-600 list-disc list-inside space-y-0.5">
                {substitutes.map((s, i) => <li key={i}>{s}</li>)}
              </ul>}
        </div>
      )}
    </li>
  )
}
