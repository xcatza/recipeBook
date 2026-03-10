'use client'
import { useState } from 'react'
import { RecipeGrid } from './RecipeGrid'
import { SortBar, type SortState } from './SortBar'

type Nutrition = {
  calories: number | null; protein: number | null; carbs: number | null
  fat: number | null; fibre: number | null; sugar: number | null; sodium: number | null
} | null

type Recipe = {
  id: string; title: string; imageUrl: string | null
  defaultServings: number; tags: string[]; nutrition: Nutrition
}

export function RecipeCollection({ recipes, allTags }: { recipes: Recipe[]; allTags: string[] }) {
  const [sort, setSort] = useState<SortState>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const filtered = tagFilter
    ? recipes.filter((r) => r.tags.includes(tagFilter))
    : recipes

  const sorted = sort
    ? [...filtered].sort((a, b) => {
        const aVal = a.nutrition?.[sort.macro] ?? null
        const bVal = b.nutrition?.[sort.macro] ?? null
        if (aVal === null && bVal === null) return 0
        if (aVal === null) return 1
        if (bVal === null) return -1
        return sort.direction === 'desc' ? bVal - aVal : aVal - bVal
      })
    : filtered

  return (
    <>
      {/* I'm Feeling Like + Sort Bar */}
      <div className="flex items-center gap-4 flex-wrap mb-2">
        <span
          className="text-xs tracking-wide uppercase shrink-0"
          style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
        >
          I&apos;m feeling like
        </span>
        <select
          value={tagFilter ?? ''}
          onChange={(e) => setTagFilter(e.target.value || null)}
          className="text-sm px-3 py-1.5 outline-none transition-all duration-200"
          style={{
            background: 'var(--color-warm-white)',
            border: '1px solid var(--color-border)',
            borderRadius: '2px',
            color: tagFilter ? 'var(--color-ink)' : 'var(--color-ink-muted)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <option value="">All recipes</option>
          {allTags.length === 0
            ? <option disabled value="__empty">No taste tags yet</option>
            : allTags.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))
          }
        </select>
      </div>
      <SortBar sort={sort} onChange={setSort} />
      <RecipeGrid recipes={sorted} activeMacro={sort?.macro ?? null} />
    </>
  )
}
