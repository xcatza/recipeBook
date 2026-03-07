import type { ParsedRecipe, ParsedIngredient } from './types'

const RAPIDAPI_HOST = 'instagram-scraper-api2.p.rapidapi.com'

export async function fetchInstagramPost(
  url: string
): Promise<{ caption: string; imageUrl: string | null } | null> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) throw new Error('RAPIDAPI_KEY not set')

  const match = url.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/)
  if (!match) return null
  const shortcode = match[2]

  const res = await fetch(
    `https://${RAPIDAPI_HOST}/v1/post_info?code_or_id_or_url=${shortcode}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    }
  )
  if (!res.ok) return null
  const data = await res.json()

  return {
    caption: data.data?.caption?.text ?? '',
    imageUrl: data.data?.thumbnail_url ?? data.data?.image_url ?? null,
  }
}

function parseIngredientLine(line: string): ParsedIngredient {
  const match = line.trim().match(/^([\d./]+)?\s*([a-zA-Z]+)?\s+(.+)$/)
  if (!match) return { name: line.trim(), quantity: null, unit: null, notes: null }
  const [, qty, unit, name] = match
  return { quantity: qty ? parseFloat(qty) : null, unit: unit || null, name: name.trim(), notes: null }
}

export function extractRecipeFromCaption(caption: string, sourceUrl: string): ParsedRecipe | null {
  const lower = caption.toLowerCase()
  const hasIngredients = lower.includes('ingredient')
  const hasInstructions =
    lower.includes('instruction') || lower.includes('direction') ||
    lower.includes('method') || /\n\d+\./.test(caption)

  if (!hasIngredients && !hasInstructions) return null

  const lines = caption.split('\n').map((l) => l.trim()).filter(Boolean)
  const ingredients: ParsedIngredient[] = []
  const steps: string[] = []
  let mode: 'none' | 'ingredients' | 'steps' = 'none'

  for (const line of lines) {
    const low = line.toLowerCase()
    if (low.startsWith('ingredient')) { mode = 'ingredients'; continue }
    if (low.startsWith('instruction') || low.startsWith('direction') || low.startsWith('method')) {
      mode = 'steps'; continue
    }
    if (mode === 'ingredients') ingredients.push(parseIngredientLine(line))
    else if (mode === 'steps') steps.push(line.replace(/^\d+[.)]\s*/, ''))
  }

  if (ingredients.length === 0 && steps.length === 0) return null

  return {
    title: lines[0] || 'Untitled Recipe',
    description: null,
    imageUrl: null,
    defaultServings: 4,
    ingredients,
    steps,
    sourceUrl,
  }
}
