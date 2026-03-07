import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIngredientSubstitutes } from '@/lib/parsers/spoonacular'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ingredient = await prisma.ingredient.findUnique({ where: { id } })
  if (!ingredient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!ingredient.spoonacularId) {
    return NextResponse.json({ substitutes: [], message: 'No Spoonacular ID resolved yet' })
  }

  const substitutes = await getIngredientSubstitutes(ingredient.spoonacularId)
  return NextResponse.json({ substitutes })
}
