'use client'
import { useState } from 'react'
import { matchRecipes } from '@/lib/matching'
import type { CookRecipe } from '@/lib/matching'
import { IngredientAutocomplete } from './IngredientAutocomplete'
import { CookRecipeCard } from './CookRecipeCard'

type Props = {
  recipes: CookRecipe[]
  ingredientNames: string[]
}

export function CookPage({ recipes, ingredientNames }: Props) {
  const [pantry, setPantry] = useState<string[]>([])

  const ranked = pantry.length > 0 ? matchRecipes(recipes, pantry) : []
  const hasPantry = pantry.length > 0

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <header className="mb-10 animate-fade-up">
        <div className="flex items-end justify-between border-b-2 pb-6" style={{ borderColor: 'var(--color-ink)' }}>
          <div>
            <h1 className="text-4xl font-bold tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)' }}>
              What can I cook?
            </h1>
            <p className="mt-2 text-base" style={{ color: 'var(--color-ink-muted)', fontWeight: 300 }}>
              Tell us what&apos;s in your kitchen
            </p>
          </div>
        </div>
      </header>

      {/* Ingredient input panel */}
      <section
        className="mb-8 p-5 animate-fade-up"
        style={{
          background: 'var(--color-border-light)',
          borderRadius: '4px',
          animationDelay: '50ms',
        }}
      >
        <label
          htmlFor="pantry-input"
          className="block text-xs tracking-wide uppercase mb-3"
          style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
        >
          What&apos;s in your kitchen?
        </label>
        <IngredientAutocomplete
          allIngredients={ingredientNames}
          pantry={pantry}
          onChange={setPantry}
          inputId="pantry-input"
        />
      </section>

      {/* Results */}
      <section className="animate-fade-up" style={{ animationDelay: '100ms' }}>
        {!hasPantry ? (
          <p className="text-center py-16 text-base" style={{ color: 'var(--color-ink-muted)', fontWeight: 300 }}>
            Add ingredients above to see what you can make
          </p>
        ) : (
          <>
            <p
              className="text-xs tracking-wide uppercase mb-5"
              style={{ color: 'var(--color-ink-muted)', fontWeight: 600, letterSpacing: '0.1em' }}
            >
              {ranked.length} recipe{ranked.length === 1 ? '' : 's'}
            </p>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {ranked.map((recipe) => (
                <CookRecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
