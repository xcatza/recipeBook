import type { ParsedRecipe, ParsedIngredient } from './types'

const BASE = 'https://api.spoonacular.com'

function key(): string {
  const k = process.env.SPOONACULAR_API_KEY
  if (!k) throw new Error('SPOONACULAR_API_KEY not set')
  return k
}

export async function analyzeRecipeFromUrl(url: string): Promise<ParsedRecipe | null> {
  try {
    const res = await fetch(
      `${BASE}/recipes/extract?apiKey=${key()}&url=${encodeURIComponent(url)}&forceExtraction=false`
    )
    if (!res.ok) return null
    const data = await res.json()
    const ingredients: ParsedIngredient[] = (data.extendedIngredients ?? []).map((ing: any) => ({
      name: ing.nameClean ?? ing.name,
      quantity: ing.amount ?? null,
      unit: ing.unit || null,
      notes: null,
    }))
    const steps: string[] = []
    for (const section of data.analyzedInstructions ?? []) {
      for (const step of section.steps ?? []) steps.push(step.step)
    }
    return {
      title: data.title,
      description: data.summary?.replace(/<[^>]+>/g, '') ?? null,
      imageUrl: data.image ?? null,
      defaultServings: data.servings ?? 4,
      ingredients,
      steps,
      sourceUrl: url,
    }
  } catch {
    return null
  }
}

export async function resolveIngredientId(name: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${BASE}/food/ingredients/search?apiKey=${key()}&query=${encodeURIComponent(name)}&number=1`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.results?.[0]?.id ?? null
  } catch {
    return null
  }
}

export type NutritionData = {
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  fibre: number | null
  sugar: number | null
  sodium: number | null
}

export async function analyzeNutrition(
  title: string,
  ingredients: Array<{ name: string; quantity: number | null; unit: string | null }>,
  servings: number
): Promise<NutritionData | null> {
  try {
    const ingredientList = ingredients
      .map((i) => `${i.quantity ?? ''} ${i.unit ?? ''} ${i.name}`.trim())
      .join('\n')

    const res = await fetch(`${BASE}/recipes/analyze?apiKey=${key()}&includeNutrition=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, ingredients: ingredientList, servings }),
    })
    if (!res.ok) return null
    const data = await res.json()

    const nutrients: Array<{ name: string; amount: number }> = data.nutrition?.nutrients ?? []
    const find = (n: string) => nutrients.find((x) => x.name === n)?.amount ?? null

    return {
      calories: find('Calories'),
      protein: find('Protein'),
      carbs: find('Carbohydrates'),
      fat: find('Fat'),
      fibre: find('Fiber'),
      sugar: find('Sugar'),
      sodium: find('Sodium'),
    }
  } catch {
    return null
  }
}

export async function getIngredientSubstitutes(spoonacularId: number): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/food/ingredients/${spoonacularId}/substitutes?apiKey=${key()}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.substitutes ?? []
  } catch {
    return []
  }
}
