'use client'
import { useState, useRef, useEffect } from 'react'

const PRESETS = [
  'Comfort', 'Quick', 'Spicy', 'Light', 'Healthy',
  'Indulgent', 'Vegetarian', 'Vegan', 'Meal Prep', 'Date Night',
]

type Props = {
  tags: string[]
  onChange: (tags: string[]) => void
  allTags?: string[]
  saving?: boolean
}

export function TagInput({ tags, onChange, allTags = [], saving }: Props) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = input.length > 0
    ? allTags.filter(
        (t) => t.toLowerCase().includes(input.toLowerCase()) && !tags.includes(t)
      ).slice(0, 6)
    : []

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase()
    if (!trimmed || tags.includes(trimmed)) return
    onChange([...tags, trimmed])
    setInput('')
    setShowSuggestions(false)
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div>
      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PRESETS.map((preset) => {
          const lc = preset.toLowerCase()
          const active = tags.includes(lc)
          return (
            <button
              key={preset}
              type="button"
              onClick={() => active ? removeTag(lc) : addTag(lc)}
              className="text-xs px-2.5 py-1 transition-all duration-200"
              style={{
                borderRadius: '2px',
                fontWeight: 500,
                border: active ? '1px solid var(--color-sage)' : '1px solid var(--color-border)',
                background: active ? 'var(--color-sage-light)' : 'transparent',
                color: active ? 'var(--color-sage)' : 'var(--color-ink-muted)',
              }}
            >
              {preset}
            </button>
          )
        })}
      </div>

      {/* Active tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5"
              style={{
                background: 'var(--color-sage-light)',
                color: 'var(--color-sage)',
                borderRadius: '2px',
                fontWeight: 500,
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="opacity-60 hover:opacity-100 transition-opacity"
                style={{ lineHeight: 1 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Freeform input + saving indicator */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setShowSuggestions(true) }}
            onKeyDown={handleKeyDown}
            placeholder="Add a tag..."
            className="flex-1 px-3 py-2 text-sm outline-none transition-all duration-200"
            style={{
              background: 'var(--color-warm-white)',
              border: '1px solid var(--color-border)',
              borderRadius: '2px',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-body)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-terracotta)'; setShowSuggestions(true) }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; setTimeout(() => setShowSuggestions(false), 150) }}
          />
          {saving && (
            <span className="text-xs shrink-0" style={{ color: 'var(--color-sage)' }}>Saved</span>
          )}
        </div>

        {/* Autocomplete dropdown */}
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
                onMouseDown={() => addTag(s)}
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
      <p className="mt-1.5 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
        Press Enter or comma to add a custom tag
      </p>
    </div>
  )
}
