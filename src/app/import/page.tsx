'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ImportForm } from '@/components/ImportForm'
import { RecipeReviewForm } from '@/components/RecipeReviewForm'

type ParsedRecipe = {
  title: string; description: string | null; imageUrl: string | null
  defaultServings: number
  ingredients: Array<{ name: string; quantity: number | null; unit: string | null; notes: string | null }>
  steps: string[]; sourceUrl: string
}

export default function ImportPage() {
  const [parsed, setParsed] = useState<ParsedRecipe | null>(null)
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">{'\u2190'} Back</Link>
        <h1 className="text-2xl font-bold text-gray-900">Import Recipe</h1>
      </div>
      {!parsed
        ? <ImportForm onParsed={setParsed} />
        : <RecipeReviewForm recipe={parsed} onCancel={() => setParsed(null)} />}
    </main>
  )
}
