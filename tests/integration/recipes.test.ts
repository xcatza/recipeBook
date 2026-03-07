import { describe, it, expect, vi, beforeAll } from 'vitest'

// Mock Spoonacular to avoid real API calls
vi.mock('@/lib/parsers/spoonacular', () => ({
  resolveIngredientId: vi.fn().mockResolvedValue(null),
  analyzeRecipeFromUrl: vi.fn(),
  getIngredientSubstitutes: vi.fn(),
}))

import { saveRecipe, getRecipes, getRecipe, deleteRecipe } from '@/lib/recipes'

const testRecipe = {
  title: 'Test Pasta',
  description: 'A test',
  imageUrl: null,
  defaultServings: 4,
  ingredients: [
    { name: 'flour', quantity: 2, unit: 'cups', notes: null },
    { name: 'salt', quantity: 1, unit: 'tsp', notes: null },
  ],
  steps: ['Boil water', 'Cook pasta'],
  sourceUrl: 'https://example.com/pasta',
}

describe('Recipe service', () => {
  it('saves and retrieves a recipe', async () => {
    const saved = await saveRecipe(testRecipe)
    expect(saved.title).toBe('Test Pasta')
    expect(saved.steps).toEqual(['Boil water', 'Cook pasta'])
    expect(saved.ingredients).toHaveLength(2)
    const retrieved = await getRecipe(saved.id)
    expect(retrieved?.title).toBe('Test Pasta')
  })

  it('lists all recipes', async () => {
    await saveRecipe({ ...testRecipe, sourceUrl: 'https://a.com' })
    await saveRecipe({ ...testRecipe, sourceUrl: 'https://b.com' })
    const recipes = await getRecipes()
    expect(recipes.length).toBeGreaterThanOrEqual(2)
  })

  it('deletes a recipe', async () => {
    const saved = await saveRecipe({ ...testRecipe, sourceUrl: 'https://delete.com' })
    await deleteRecipe(saved.id)
    expect(await getRecipe(saved.id)).toBeNull()
  })
})
