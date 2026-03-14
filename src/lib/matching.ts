export type CookRecipe = {
  id: string
  title: string
  imageUrl: string | null
  ingredients: Array<{ name: string }>
}

export type RankedRecipe = CookRecipe & {
  score: number
  matchedCount: number
  totalIngredients: number
  missingIngredients: string[]
}

export function matchRecipes(recipes: CookRecipe[], pantry: string[]): RankedRecipe[] {
  const normalizedPantry = pantry.map((p) => p.toLowerCase().trim())

  const ranked = recipes.map((recipe) => {
    const totalIngredients = recipe.ingredients.length
    const missingIngredients: string[] = []
    let matchedCount = 0

    for (const ing of recipe.ingredients) {
      const normalizedIng = ing.name.toLowerCase().trim()
      const matched = normalizedPantry.some(
        (p) => p.includes(normalizedIng) || normalizedIng.includes(p)
      )
      if (matched) {
        matchedCount++
      } else {
        missingIngredients.push(ing.name)
      }
    }

    const score = totalIngredients === 0 ? 0 : matchedCount / totalIngredients

    return { ...recipe, score, matchedCount, totalIngredients, missingIngredients }
  })

  return ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.title.localeCompare(b.title)
  })
}
