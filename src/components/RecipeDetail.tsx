'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ServingControl } from './ServingControl'
import { IngredientRow } from './IngredientRow'

type Recipe = {
  id: string; title: string; description: string | null; imageUrl: string | null
  sourceUrl: string; defaultServings: number; tags: string[]
  ingredients: Array<{ id: string; name: string; quantity: number | null; unit: string | null; notes: string | null }>
  steps: string[]
}

export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const [servings, setServings] = useState(recipe.defaultServings)
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-6 block">{'\u2190'} Back</Link>
      {recipe.imageUrl && (
        <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-64 object-cover rounded-xl mb-6" />
      )}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{recipe.title}</h1>
      <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
        View source
      </a>
      {recipe.description && <p className="text-gray-600 text-sm mt-3">{recipe.description}</p>}
      <div className="mt-6 mb-4">
        <ServingControl value={servings} onChange={setServings} />
      </div>
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h2>
        <ul>
          {recipe.ingredients.map((ing) => (
            <IngredientRow key={ing.id} {...ing} defaultServings={recipe.defaultServings} currentServings={servings} />
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h2>
        <ol className="space-y-3">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-gray-700 text-sm leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
