'use client'
import { useState } from 'react'

type ParsedRecipe = {
  title: string; description: string | null; imageUrl: string | null
  defaultServings: number
  ingredients: Array<{ name: string; quantity: number | null; unit: string | null; notes: string | null }>
  steps: string[]; sourceUrl: string
}

export function ImportForm({ onParsed }: { onParsed: (r: ParsedRecipe) => void }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/recipes/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) { setError((await res.json()).error ?? 'Failed to parse'); return }
      onParsed(await res.json())
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">Recipe or Instagram URL</label>
        <input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..." required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
        {loading ? 'Importing...' : 'Import'}
      </button>
    </form>
  )
}
