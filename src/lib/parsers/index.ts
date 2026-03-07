import { extractRecipeFromUrl } from './recipe-extractor'
import { analyzeRecipeFromUrl } from './spoonacular'
import type { ParsedRecipe } from './types'

export type { ParsedRecipe, ParsedIngredient } from './types'

export async function parseRecipeUrl(url: string): Promise<ParsedRecipe | null> {
  try {
    const result = await extractRecipeFromUrl(url)
    if (result) return result
  } catch {
    // fall through to Spoonacular
  }
  return analyzeRecipeFromUrl(url)
}
