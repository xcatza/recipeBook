// tests/unit/matching.test.ts
import { describe, it, expect } from 'vitest'
import { matchRecipes } from '@/lib/matching'

const flour   = { name: 'all-purpose flour' }
const eggs    = { name: 'eggs' }
const butter  = { name: 'butter' }
const sugar   = { name: 'sugar' }
const milk    = { name: 'milk' }

const pancakes = { id: 'r1', title: 'Pancakes', imageUrl: null, ingredients: [flour, eggs, butter, sugar, milk] }
const omelette = { id: 'r2', title: 'Omelette', imageUrl: null, ingredients: [eggs, butter] }
const cake     = { id: 'r3', title: 'Cake',     imageUrl: null, ingredients: [flour, eggs, butter, sugar] }

describe('matchRecipes', () => {
  it('returns empty array for empty recipes list', () => {
    expect(matchRecipes([], ['eggs'])).toEqual([])
  })

  it('returns all recipes when pantry is empty, all scores 0, sorted alphabetically', () => {
    const results = matchRecipes([pancakes, omelette, cake], [])
    expect(results.map(r => r.title)).toEqual(['Cake', 'Omelette', 'Pancakes'])
    expect(results.every(r => r.score === 0)).toBe(true)
  })

  it('scores 100% when all ingredients match', () => {
    const results = matchRecipes([omelette], ['eggs', 'butter'])
    expect(results[0].score).toBe(1)
    expect(results[0].matchedCount).toBe(2)
    expect(results[0].missingIngredients).toEqual([])
  })

  it('scores partial match correctly', () => {
    const results = matchRecipes([pancakes], ['eggs', 'butter'])
    expect(results[0].matchedCount).toBe(2)
    expect(results[0].totalIngredients).toBe(5)
    expect(results[0].score).toBeCloseTo(0.4)
    expect(results[0].missingIngredients).toEqual(['all-purpose flour', 'sugar', 'milk'])
  })

  it('sorts by score descending, ties broken alphabetically', () => {
    const results = matchRecipes([pancakes, omelette, cake], ['eggs', 'butter'])
    // omelette: 2/2=1.0, cake: 2/4=0.5, pancakes: 2/5=0.4
    expect(results.map(r => r.title)).toEqual(['Omelette', 'Cake', 'Pancakes'])
  })

  it('bidirectional substring match — pantry item substring of ingredient', () => {
    // 'flour' matches 'all-purpose flour'
    const results = matchRecipes([pancakes], ['flour'])
    expect(results[0].matchedCount).toBe(1)
  })

  it('bidirectional substring match — ingredient substring of pantry item', () => {
    // 'eggs' matches pantry 'large eggs'
    const recipe = { id: 'r4', title: 'r', imageUrl: null, ingredients: [{ name: 'eggs' }] }
    const results = matchRecipes([recipe], ['large eggs'])
    expect(results[0].matchedCount).toBe(1)
  })

  it('normalizes case — pantry "BUTTER" matches ingredient "Butter"', () => {
    const results = matchRecipes([omelette], ['BUTTER', 'EGGS'])
    expect(results[0].matchedCount).toBe(2)
  })

  it('preserves original case in missingIngredients', () => {
    const recipe = { id: 'r5', title: 'r', imageUrl: null, ingredients: [{ name: 'All-Purpose Flour' }] }
    const results = matchRecipes([recipe], [])
    expect(results[0].missingIngredients).toEqual(['All-Purpose Flour'])
  })
})
