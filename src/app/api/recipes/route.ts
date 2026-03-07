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
    const { recipe, tags } = await req.json()
    const saved = await saveRecipe(recipe, tags ?? [])
    return NextResponse.json(saved, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to save recipe' }, { status: 500 })
  }
}
