import { NextRequest, NextResponse } from 'next/server'
import { fetchNutritionFromUrl } from '@/lib/parsers/spoonacular'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })
    const nutrition = await fetchNutritionFromUrl(url)
    if (!nutrition) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(nutrition)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch nutrition' }, { status: 500 })
  }
}
