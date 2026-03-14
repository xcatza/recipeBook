'use client'
import { useState, useRef, type KeyboardEvent } from 'react'

type Props = {
  allIngredients: string[]
  pantry: string[]
  onChange: (pantry: string[]) => void
}

export function IngredientAutocomplete({ allIngredients, pantry, onChange }: Props) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = input.length > 0
    ? allIngredients
        .filter((i) => i.toLowerCase().includes(input.toLowerCase()) && !pantry.includes(i))
        .slice(0, 8)
    : []

  function addItem(item: string) {
    const trimmed = item.trim()
    if (!trimmed || pantry.includes(trimmed)) return
    onChange([...pantry, trimmed])
    setInput('')
    setShowSuggestions(false)
  }

  function removeItem(item: string) {
    onChange(pantry.filter((p) => p !== item))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0) addItem(suggestions[0])
      else if (input.trim()) addItem(input.trim())
    } else if (e.key === 'Backspace' && input === '' && pantry.length > 0) {
      removeItem(pantry[pantry.length - 1])
    }
  }

  return (
    <div>
      {/* Selected pantry pills */}
      {pantry.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 items-center">
          {pantry.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1"
              style={{
                background: 'var(--color-terracotta)',
                color: 'var(--color-warm-white)',
                borderRadius: '2px',
                fontWeight: 500,
              }}
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="opacity-70 hover:opacity-100 transition-opacity ml-0.5"
                style={{ lineHeight: 1 }}
                aria-label={`Remove ${item}`}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs transition-colors duration-150"
            style={{ color: 'var(--color-ink-muted)', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Autocomplete input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true) }}
          onKeyDown={handleKeyDown}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-terracotta)'; setShowSuggestions(true) }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; setTimeout(() => setShowSuggestions(false), 150) }}
          placeholder="Add an ingredient..."
          className="w-full px-3 py-2.5 text-sm outline-none transition-all duration-200"
          style={{
            background: 'var(--color-warm-white)',
            border: '1px solid var(--color-border)',
            borderRadius: '2px',
            color: 'var(--color-ink)',
          }}
        />

        {showSuggestions && suggestions.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 z-10 mt-1"
            style={{
              background: 'var(--color-warm-white)',
              border: '1px solid var(--color-border)',
              borderRadius: '2px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={() => addItem(s)}
                className="w-full text-left px-3 py-2 text-sm transition-colors duration-150"
                style={{ color: 'var(--color-ink)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-border-light)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
