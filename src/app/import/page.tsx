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
    <main className="max-w-2xl mx-auto px-6 py-12">
      <div className="animate-fade-up">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-10 transition-colors duration-200 hover:opacity-70"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to recipes
        </Link>
        <h1
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Import Recipe
        </h1>
        <p className="mb-10" style={{ color: 'var(--color-ink-muted)', fontWeight: 300 }}>
          Paste a link from any recipe website or Instagram post.
        </p>
      </div>
      <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
        {!parsed
          ? <ImportForm onParsed={setParsed} />
          : <RecipeReviewForm recipe={parsed} onCancel={() => setParsed(null)} />}
      </div>
    </main>
  )
}
