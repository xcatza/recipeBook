import { NextRequest, NextResponse } from 'next/server'
import { getRecipe, storeNutrition } from '@/lib/recipes'
import { fetchNutritionFromUrl } from '@/lib/parsers/spoonacular'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const recipe = await getRecipe(id)
  if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const nutrition = await fetchNutritionFromUrl(recipe.sourceUrl)
  if (!nutrition) return NextResponse.json({ error: 'Could not fetch nutrition data' }, { status: 502 })

  const updated = await storeNutrition(id, nutrition)
  return NextResponse.json(updated.nutrition)
}
