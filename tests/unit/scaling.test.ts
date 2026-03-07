import { describe, it, expect } from 'vitest'
import { scaleQuantity, scaleIngredients } from '@/lib/scaling'

describe('scaleQuantity', () => {
  it('scales proportionally', () => {
    expect(scaleQuantity(2, 4, 8)).toBe(4)
  })
  it('handles halving', () => {
    expect(scaleQuantity(3, 6, 3)).toBe(1.5)
  })
  it('returns null when quantity is null', () => {
    expect(scaleQuantity(null, 4, 8)).toBeNull()
  })
  it('rounds to 2 decimal places', () => {
    expect(scaleQuantity(1, 3, 4)).toBe(1.33)
  })
})

describe('scaleIngredients', () => {
  it('scales all ingredient quantities', () => {
    const ingredients = [
      { id: '1', name: 'flour', quantity: 2, unit: 'cups', notes: null, spoonacularId: null, recipeId: 'r1' },
      { id: '2', name: 'salt', quantity: 1, unit: 'tsp', notes: null, spoonacularId: null, recipeId: 'r1' },
    ]
    const scaled = scaleIngredients(ingredients, 4, 8)
    expect(scaled[0].quantity).toBe(4)
    expect(scaled[1].quantity).toBe(2)
  })
})
