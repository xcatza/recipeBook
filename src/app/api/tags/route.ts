import { NextResponse } from 'next/server'
import { getTags } from '@/lib/recipes'

export async function GET() {
  try {
    return NextResponse.json(await getTags())
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}
