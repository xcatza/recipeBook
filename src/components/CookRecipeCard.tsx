'use client'
import Link from 'next/link'
import type { RankedRecipe } from '@/lib/matching'

type Props = {
  recipe: RankedRecipe
}

export function CookRecipeCard({ recipe }: Props) {
  const isPerfect = recipe.score === 1 && recipe.totalIngredients > 0
  const hasIngredients = recipe.totalIngredients > 0

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="block transition-all duration-200 hover:opacity-90"
      style={{
        background: 'var(--color-warm-white)',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      {recipe.imageUrl ? (
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-36 object-cover"
        />
      ) : (
        <div
          className="w-full h-36"
          style={{ background: 'var(--color-border-light)' }}
        />
      )}

      <div className="p-3">
        <h3
          className="text-sm font-semibold leading-snug mb-1.5"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
        >
          {recipe.title}
        </h3>

        {hasIngredients && (
          <div
            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 mb-1.5"
            style={{
              borderRadius: '2px',
              background: isPerfect ? 'var(--color-sage-light)' : 'var(--color-border-light)',
              color: isPerfect ? 'var(--color-sage)' : 'var(--color-terracotta)',
            }}
          >
            {isPerfect
              ? `${recipe.matchedCount}/${recipe.totalIngredients} ✓`
              : `${recipe.matchedCount}/${recipe.totalIngredients}`}
          </div>
        )}

        {recipe.missingIngredients.length > 0 && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
            Missing: {recipe.missingIngredients.join(', ')}
          </p>
        )}
      </div>
    </Link>
  )
}
