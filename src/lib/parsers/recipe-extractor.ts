import type { ParsedRecipe, ParsedIngredient } from './types'

function parseIngredientString(raw: string): ParsedIngredient {
  const match = raw.match(/^([\d./]+)?\s*([a-zA-Z]+)?\s+(.+)$/)
  if (!match) return { name: raw, quantity: null, unit: null, notes: null }
  const [, qty, unit, rest] = match
  const [name, ...notesParts] = rest.split(',')
  return {
    quantity: qty ? parseFloat(qty) : null,
    unit: unit || null,
    name: name.trim(),
    notes: notesParts.join(',').trim() || null,
  }
}

function findRecipeInJsonLd(data: any): any | null {
  if (!data) return null
  if (data['@type'] === 'Recipe') return data
  if (Array.isArray(data['@type']) && data['@type'].includes('Recipe')) return data
  if (data['@graph']) {
    for (const item of data['@graph']) {
      const found = findRecipeInJsonLd(item)
      if (found) return found
    }
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInJsonLd(item)
      if (found) return found
    }
  }
  return null
}

export async function extractRecipeFromUrl(url: string): Promise<ParsedRecipe | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)' },
    })
    if (!res.ok) return null
    const html = await res.text()

    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    let match
    let recipeData = null

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1])
        recipeData = findRecipeInJsonLd(parsed)
        if (recipeData) break
      } catch {
        continue
      }
    }

    if (!recipeData) return null

    const ingredients: ParsedIngredient[] = (recipeData.recipeIngredient ?? []).map(parseIngredientString)

    const rawInstructions = recipeData.recipeInstructions ?? []
    const steps: string[] = rawInstructions
      .map((step: any) => {
        if (typeof step === 'string') return step
        if (step.text) return step.text
        if (step['@type'] === 'HowToSection' && step.itemListElement) {
          return step.itemListElement.map((s: any) => s.text ?? '').filter(Boolean)
        }
        return ''
      })
      .flat()
      .filter(Boolean)

    let defaultServings = 4
    if (recipeData.recipeYield) {
      const y = Array.isArray(recipeData.recipeYield) ? recipeData.recipeYield[0] : recipeData.recipeYield
      const n = parseInt(String(y), 10)
      if (!isNaN(n)) defaultServings = n
    }

    return {
      title: recipeData.name,
      description: recipeData.description ?? null,
      imageUrl: Array.isArray(recipeData.image) ? recipeData.image[0] : (recipeData.image?.url ?? recipeData.image ?? null),
      defaultServings,
      ingredients,
      steps,
      sourceUrl: url,
    }
  } catch {
    return null
  }
}
