import { NextRequest, NextResponse } from 'next/server'
import { saveRecipe, getRecipes } from '@/lib/recipes'

export async function GET() {
  try {
    return NextResponse.json(await getRecipes())
  } catch {
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { recipe, tags, nutrition } = await req.json()
    const recipeWithNutrition = nutrition !== undefined ? { ...recipe, nutrition } : { ...recipe, nutrition: null }
    const saved = await saveRecipe(recipeWithNutrition, tags ?? [])
    return NextResponse.json(saved, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to save recipe' }, { status: 500 })
  }
}
