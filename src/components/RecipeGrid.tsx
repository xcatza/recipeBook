import { RecipeCard } from './RecipeCard'

type Recipe = { id: string; title: string; imageUrl: string | null; defaultServings: number; tags: string[] }

export function RecipeGrid({ recipes }: { recipes: Recipe[] }) {
  if (recipes.length === 0) {
    return <div className="text-center text-gray-500 py-16">No recipes yet. Import one above!</div>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((r) => <RecipeCard key={r.id} {...r} />)}
    </div>
  )
}
