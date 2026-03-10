import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)
vi.stubEnv('SPOONACULAR_API_KEY', 'test-key')

import { fetchNutritionFromUrl } from '@/lib/parsers/spoonacular'

describe('fetchNutritionFromUrl', () => {
  beforeEach(() => { mockFetch.mockReset() })

  it('parses nutrition from Spoonacular extract response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        nutrition: {
          nutrients: [
            { name: 'Calories', amount: 450, unit: 'kcal' },
            { name: 'Protein', amount: 32, unit: 'g' },
            { name: 'Carbohydrates', amount: 55, unit: 'g' },
            { name: 'Fat', amount: 12, unit: 'g' },
            { name: 'Fiber', amount: 8, unit: 'g' },
            { name: 'Sugar', amount: 6, unit: 'g' },
            { name: 'Sodium', amount: 400, unit: 'mg' },
          ],
        },
      }),
    })

    const result = await fetchNutritionFromUrl('https://example.com/recipe')

    expect(result).toEqual({
      calories: 450,
      protein: 32,
      carbs: 55,
      fat: 12,
      fibre: 8,
      sugar: 6,
      sodium: 400,
    })
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch.mock.calls[0][0]).toContain('/recipes/extract')
    expect(mockFetch.mock.calls[0][0]).toContain('includeNutrition=true')
  })

  it('returns null on API failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    const result = await fetchNutritionFromUrl('https://example.com/fail')
    expect(result).toBeNull()
  })
})
