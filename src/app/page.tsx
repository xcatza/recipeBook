import { getRecipes } from '@/lib/recipes'
import { RecipeGrid } from '@/components/RecipeGrid'
import Link from 'next/link'

export default async function HomePage() {
  const recipes = await getRecipes()
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Recipes</h1>
        <Link href="/import" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          Import Recipe
        </Link>
      </div>
      <RecipeGrid recipes={recipes} />
    </main>
  )
}
