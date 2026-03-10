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

export function RecipeCollection({ recipes }: { recipes: Recipe[] }) {
  const [sort, setSort] = useState<SortState>(null)

  const sorted = sort
    ? [...recipes].sort((a, b) => {
        const aVal = a.nutrition?.[sort.macro] ?? null
        const bVal = b.nutrition?.[sort.macro] ?? null
        if (aVal === null && bVal === null) return 0
        if (aVal === null) return 1
        if (bVal === null) return -1
        return sort.direction === 'desc' ? bVal - aVal : aVal - bVal
      })
    : recipes

  return (
    <>
      {recipes.length > 1 && <SortBar sort={sort} onChange={setSort} />}
      <RecipeGrid recipes={sorted} activeMacro={sort?.macro ?? null} />
    </>
  )
}
