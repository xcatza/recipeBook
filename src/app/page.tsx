import { getRecipes, getTags } from '@/lib/recipes'
import { RecipeCollection } from '@/components/RecipeCollection'
import Link from 'next/link'

export default async function HomePage() {
  const [recipes, allTags] = await Promise.all([getRecipes(), getTags()])
  const hasRecipes = recipes.length > 0

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <header className="mb-16 animate-fade-up">
        <div className="flex items-end justify-between border-b-2 pb-6" style={{ borderColor: 'var(--color-ink)' }}>
          <div>
            <h1 className="text-5xl font-bold tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)' }}>
              Recipe Book
            </h1>
            <p className="mt-2 text-base" style={{ color: 'var(--color-ink-muted)', fontWeight: 300 }}>
              {hasRecipes
                ? `${recipes.length} recipe${recipes.length === 1 ? '' : 's'} in your collection`
                : 'Your personal recipe collection'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasRecipes ? (
              <Link
                href="/cook"
                className="text-sm font-medium transition-colors duration-200 hover:opacity-70"
                style={{ color: 'var(--color-ink-muted)' }}
              >
                What can I cook?
              </Link>
            ) : (
              <span
                className="text-sm"
                style={{ color: 'var(--color-border)', cursor: 'default' }}
                title="Import recipes first"
              >
                What can I cook?
              </span>
            )}
            <Link
              href="/import"
              className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all duration-200"
              style={{
                background: 'var(--color-terracotta)',
                color: 'var(--color-warm-white)',
                borderRadius: '2px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:-translate-y-0.5">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Import Recipe
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      {hasRecipes ? (
        <RecipeCollection recipes={recipes} allTags={allTags} />
      ) : (
        <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center" style={{ background: 'var(--color-border-light)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-ink-muted)' }}>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <h2 className="text-2xl mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
              Your cookbook awaits
            </h2>
            <p className="text-base mb-8 max-w-md mx-auto" style={{ color: 'var(--color-ink-muted)', lineHeight: 1.7, fontWeight: 300 }}>
              Start building your collection by importing a recipe from any website or Instagram post.
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
              Import your first recipe
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
