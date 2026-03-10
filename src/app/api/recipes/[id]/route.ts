import { NextRequest, NextResponse } from 'next/server'
import { getRecipe, updateRecipe, deleteRecipe, updateTags } from '@/lib/recipes'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const recipe = await getRecipe(id)
  if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(recipe)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  if (body.tags !== undefined) {
    const recipe = await updateTags(id, body.tags)
    return NextResponse.json(recipe)
  }
  const recipe = await updateRecipe(id, { notes: body.notes ?? null })
  return NextResponse.json(recipe)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteRecipe(id)
  return new NextResponse(null, { status: 204 })
}
