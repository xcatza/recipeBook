import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/parsers/recipe-extractor', () => ({
  extractRecipeFromUrl: vi.fn(),
}))
vi.mock('@/lib/parsers/spoonacular', () => ({
  analyzeRecipeFromUrl: vi.fn(),
  resolveIngredientId: vi.fn(),
  getIngredientSubstitutes: vi.fn(),
}))

import { parseRecipeUrl } from '@/lib/parsers/index'
import { extractRecipeFromUrl } from '@/lib/parsers/recipe-extractor'
import { analyzeRecipeFromUrl } from '@/lib/parsers/spoonacular'

const mockRecipe = {
  title: 'Pasta', description: null, imageUrl: null,
  defaultServings: 4, ingredients: [], steps: ['Boil water'],
  sourceUrl: 'https://example.com/pasta',
}

describe('parseRecipeUrl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns extractor result when successful', async () => {
    vi.mocked(extractRecipeFromUrl).mockResolvedValue(mockRecipe)
    const result = await parseRecipeUrl('https://example.com/pasta')
    expect(result).toEqual(mockRecipe)
    expect(analyzeRecipeFromUrl).not.toHaveBeenCalled()
  })

  it('falls back to Spoonacular when extractor returns null', async () => {
    vi.mocked(extractRecipeFromUrl).mockResolvedValue(null)
    vi.mocked(analyzeRecipeFromUrl).mockResolvedValue(mockRecipe)
    const result = await parseRecipeUrl('https://example.com/pasta')
    expect(result).toEqual(mockRecipe)
    expect(analyzeRecipeFromUrl).toHaveBeenCalled()
  })

  it('falls back to Spoonacular when extractor throws', async () => {
    vi.mocked(extractRecipeFromUrl).mockRejectedValue(new Error('fail'))
    vi.mocked(analyzeRecipeFromUrl).mockResolvedValue(mockRecipe)
    expect(await parseRecipeUrl('https://example.com/pasta')).toEqual(mockRecipe)
  })

  it('returns null when both fail', async () => {
    vi.mocked(extractRecipeFromUrl).mockResolvedValue(null)
    vi.mocked(analyzeRecipeFromUrl).mockResolvedValue(null)
    expect(await parseRecipeUrl('https://example.com/pasta')).toBeNull()
  })
})
