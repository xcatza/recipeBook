import { NextRequest, NextResponse } from 'next/server'
import { detectUrlType } from '@/lib/parsers/detect-url'
import { parseRecipeUrl } from '@/lib/parsers'
import { fetchInstagramPost, extractRecipeFromCaption } from '@/lib/parsers/instagram'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

    const type = detectUrlType(url)
    let parsed = null

    if (type === 'instagram') {
      const post = await fetchInstagramPost(url)
      if (post) {
        parsed = extractRecipeFromCaption(post.caption, url)
        if (parsed && post.imageUrl) parsed.imageUrl = post.imageUrl
      }
    } else {
      parsed = await parseRecipeUrl(url)
    }

    if (!parsed) {
      return NextResponse.json({ error: 'Could not extract recipe from URL' }, { status: 422 })
    }
    return NextResponse.json(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
