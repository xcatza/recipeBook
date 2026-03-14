import { getRecipes, getIngredientNames } from '@/lib/recipes'
import { CookPage } from '@/components/CookPage'
import Link from 'next/link'

export default async function CookRoute() {
  const [allRecipes, ingredientNames] = await Promise.all([
    getRecipes(),
    getIngredientNames(),
  ])

  const recipes = allRecipes.map((r) => ({
    id: r.id,
    title: r.title,
    imageUrl: r.imageUrl,
    ingredients: r.ingredients as Array<{ name: string }>,
  }))

  if (recipes.length === 0) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center py-24">
          <h2 className="text-2xl mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
            No recipes yet
          </h2>
          <p className="text-base mb-8 max-w-md mx-auto" style={{ color: 'var(--color-ink-muted)', lineHeight: 1.7, fontWeight: 300 }}>
            Import some recipes first, then come back to see what you can cook.
          </p>
          <Link
            href="/import"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 hover:opacity-90"
            style={{
              background: 'var(--color-terracotta)',
              color: 'var(--color-warm-white)',
              borderRadius: '2px',
            }}
          >
            Import a recipe
          </Link>
        </div>
      </main>
    )
  }

  return <CookPage recipes={recipes} ingredientNames={ingredientNames} />
}
