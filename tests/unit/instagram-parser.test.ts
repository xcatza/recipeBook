import { describe, it, expect } from 'vitest'
import { extractRecipeFromCaption } from '@/lib/parsers/instagram'

describe('extractRecipeFromCaption', () => {
  it('extracts ingredients and steps from a structured caption', () => {
    const caption = `Delicious pasta!\n\nIngredients:\n2 cups flour\n1 tsp salt\n3 eggs\n\nInstructions:\n1. Mix flour and salt\n2. Add eggs and knead\n3. Cook for 10 minutes`
    const result = extractRecipeFromCaption(caption, 'https://instagram.com/p/test/')
    expect(result).not.toBeNull()
    expect(result!.ingredients.length).toBe(3)
    expect(result!.steps.length).toBe(3)
  })

  it('returns null when caption has no recipe structure', () => {
    expect(extractRecipeFromCaption('Just a nice photo!', 'https://instagram.com/p/test/')).toBeNull()
  })
})
