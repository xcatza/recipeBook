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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="url"
          className="block text-xs tracking-wide uppercase mb-2"
          style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
        >
          Recipe URL
        </label>
        <div className="relative">
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.example.com/recipe..."
            required
            className="w-full px-4 py-3.5 text-sm outline-none transition-all duration-200"
            style={{
              background: 'var(--color-warm-white)',
              border: '1px solid var(--color-border)',
              borderRadius: '2px',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-body)',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-terracotta)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
          />
        </div>
      </div>
      {error && (
        <p className="text-sm py-2 px-3" style={{ color: '#b44a3e', background: '#fef2f0', borderRadius: '2px' }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 disabled:opacity-50"
        style={{
          background: 'var(--color-terracotta)',
          color: 'var(--color-warm-white)',
          borderRadius: '2px',
        }}
      >
        {loading ? (
          <>
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
              <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Importing...
          </>
        ) : (
          'Import Recipe'
        )}
      </button>
    </form>
  )
}
