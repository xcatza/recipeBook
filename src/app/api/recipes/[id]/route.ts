import { NextRequest, NextResponse } from 'next/server'
import { getRecipe, deleteRecipe } from '@/lib/recipes'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const recipe = await getRecipe(id)
  if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(recipe)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteRecipe(id)
  return new NextResponse(null, { status: 204 })
}
