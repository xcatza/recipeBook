import { describe, it, expect, vi, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'

// Mock Spoonacular to avoid real API calls
vi.mock('@/lib/parsers/spoonacular', () => ({
  resolveIngredientId: vi.fn().mockResolvedValue(null),
  analyzeRecipeFromUrl: vi.fn(),
  getIngredientSubstitutes: vi.fn(),
  fetchNutritionFromUrl: vi.fn().mockResolvedValue(null),
}))

import { saveRecipe, getRecipes, getRecipe, deleteRecipe, getTags, updateTags } from '@/lib/recipes'

// Clean up test data after each test
afterEach(async () => {
  await prisma.nutrition.deleteMany()
  await prisma.tagsOnRecipes.deleteMany()
  await prisma.ingredient.deleteMany()
  await prisma.recipe.deleteMany()
})

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

  it('getTags returns all unique tag names', async () => {
    await saveRecipe({ ...testRecipe, sourceUrl: 'https://t1.com' }, ['italian', 'quick'])
    await saveRecipe({ ...testRecipe, sourceUrl: 'https://t2.com' }, ['quick', 'spicy'])
    const tags = await getTags()
    expect(tags).toContain('italian')
    expect(tags).toContain('quick')
    expect(tags).toContain('spicy')
    expect(tags.filter((t: string) => t === 'quick')).toHaveLength(1)
  })

  it('updateTags replaces recipe tags', async () => {
    const saved = await saveRecipe({ ...testRecipe, sourceUrl: 'https://tags.com' }, ['italian'])
    expect(saved.tags).toEqual(['italian'])

    const { updateTags } = await import('@/lib/recipes')
    const updated = await updateTags(saved.id, ['quick', 'spicy'])
    expect(updated.tags).toContain('quick')
    expect(updated.tags).toContain('spicy')
    expect(updated.tags).not.toContain('italian')
  })

  it('stores and retrieves nutrition data', async () => {
    const saved = await saveRecipe({ ...testRecipe, sourceUrl: 'https://nutrition.com' })
    expect(saved.nutrition).toBeNull()

    const { storeNutrition } = await import('@/lib/recipes')
    const updated = await storeNutrition(saved.id, {
      calories: 450, protein: 32, carbs: 55, fat: 12, fibre: 8, sugar: 6, sodium: 400,
    })
    expect(updated.nutrition?.calories).toBe(450)
    expect(updated.nutrition?.protein).toBe(32)

    const retrieved = await getRecipe(saved.id)
    expect(retrieved?.nutrition?.calories).toBe(450)

    const all = await getRecipes()
    const found = all.find((r: any) => r.id === saved.id)
    expect(found?.nutrition?.calories).toBe(450)
  })
})
